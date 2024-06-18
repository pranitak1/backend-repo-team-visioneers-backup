const db = require("../models");
const Project = db.project;
const Workspace = db.workspace;
const Notification = db.notification;
const Column = db.Column;
const mongoose = require("mongoose");

const validDocTypes = ["image", "document", "video"]; // Define allowed document types

/**
 * @swagger
 * /api/projects/{projectId}/tasks:
 *   post:
 *     summary: Add a new task to a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskName:
 *                 type: string
 *               content:
 *                 type: string
 *               columnId:
 *                 type: string
 *               assigneeUserID:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               comments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     comment:
 *                       type: string
 *               createdBy:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     docType:
 *                       type: string
 *                       enum: [image, document, video]
 *                     docName:
 *                       type: string
 *                     docKey:
 *                       type: string
 *                     docUrl:
 *                       type: string
 *             example:
 *               taskName: "New Task"
 *               content: "Task content here"
 *               columnId: "columnId1"
 *               assigneeUserID: "userId123"
 *               dueDate: "2023-12-31"
 *               priority: "High"
 *               comments: [
 *                 {
 *                   user: {
 *                     _id: "userId123",
 *                     username: "username123",
 *                     email: "user@example.com"
 *                   },
 *                   comment: "This is a comment"
 *                 }
 *               ]
 *               createdBy: {
 *                 _id: "userId123",
 *                 username: "creatorUsername",
 *                 email: "creator@example.com"
 *               }
 *               attachments: [
 *                 {
 *                   docType: "image",
 *                   docName: "screenshot.png",
 *                   docKey: "screenshot123",
 *                   docUrl: "http://example.com/screenshot123.png"
 *                 }
 *               ]
 *     responses:
 *       201:
 *         description: Task added successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project or column not found
 *       500:
 *         description: Internal server error
 */
exports.addTaskToProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const {
      taskName,
      content,
      columnId,
      assigneeUserID,
      dueDate,
      priority,
      comments,
      createdBy,
      attachments,
    } = req.body;

    // Validate priority and status
    const validPriorities = ["Low", "Medium", "High"];
    const validStatuses = ["To Do", "In Progress", "Done"];

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        message: `Invalid priority value. Allowed values are: ${validPriorities.join(
          ", "
        )}`,
      });
    }

    // if (status && !validStatuses.includes(status)) {
    //     return res.status(400).json({ message: `Invalid status value. Allowed values are: ${validStatuses.join(', ')}` });
    // }
    if (attachments) {
      for (const attachment of attachments) {
        if (!validDocTypes.includes(attachment.docType)) {
          return res.status(400).json({
            message: `Invalid document type in attachments. Allowed values are: ${validDocTypes.join(
              ", "
            )}`,
          });
        }
        if (!attachment.docName || !attachment.docKey || !attachment.docUrl) {
          return res.status(400).json({
            message:
              "Attachments must include docType, docName, docKey, and docUrl for each item",
          });
        }
      }
    }

    // Find the project by ID
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Find the workspace containing the project
    const workspace = await Workspace.findOne({ projects: projectId });
    if (!workspace) {
      return res
        .status(404)
        .json({ message: "Workspace not found for the project" });
    }

    // If an assignee is provided, check if they are a member of the workspace
    if (assigneeUserID) {
      const isMember = workspace.members.some(
        (member) =>
          member.user.equals(new mongoose.Types.ObjectId(assigneeUserID)) &&
          member.isActive
      );
      if (!isMember) {
        return res
          .status(400)
          .json({ message: "Assignee must be a member of the workspace" });
      }
    }
    // if (createdBy) {
    //     const isMember = workspace.members.some(member =>
    //         member.user.equals(new mongoose.Types.ObjectId(createdBy)) && member.isActive
    //     );
    //     if (!isMember) {
    //         return res.status(400).json({ message: "Assignee must be a member of the workspace" });
    //     }
    // }

    // Find the column by ID within the project
    const column = project.columns.id(columnId);
    if (!column) {
      return res
        .status(404)
        .json({ message: "Column not found in the project" });
    }

    // Create a new task with all the details
    const newTask = {
      taskName,
      content,
      assigneeUserID: assigneeUserID ? assigneeUserID : null,
      dueDate,
      priority,
      comments,
      createdBy,
      attachments,
      //status: columnId, // To Do, In Progress, Done, etc.
    };

    // Add the new task to the project's tasks array
    project.tasks.push(newTask);

    // Save the project with the new task
    const savedProject = await project.save();

    // Retrieve the new task ID
    const newTaskId = savedProject.tasks[savedProject.tasks.length - 1]._id;

    // Add the new task ID to the corresponding column's taskIds array
    column.taskIds.push(newTaskId);

    // Save the project again with the updated column
    await savedProject.save();

    //Create a notification for the assignee
    if (assigneeUserID && assigneeUserID.id !== createdBy._id) {
      const notification = new Notification({
        userId: assigneeUserID.id,
        message: `The following task has been assigned to you <taskName>${taskName}</taskName> in the project <projectName>${project.name}</projectName> of workspace <workspaceName>${workspace.name}</workspaceName>`,
        taskId: newTaskId,
        projectId: projectId,
        isRead: false,
      });
      await notification.save();
    }

    res.status(201).json({ taskId: newTaskId, project: savedProject });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/projects/{projectId}/tasks/{taskId}:
 *   put:
 *     summary: Update a task in a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               taskName:
 *                 type: string
 *               content:
 *                 type: string
 *               assigneeUserID:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               comments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         username:
 *                           type: string
 *                         email:
 *                           type: string
 *                     comment:
 *                       type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     docType:
 *                       type: string
 *                       enum: [image, document, video]
 *                     docName:
 *                       type: string
 *                     docKey:
 *                       type: string
 *                     docUrl:
 *                       type: string
 *             example:
 *               taskName: "Updated Task Name"
 *               content: "Updated content here"
 *               assigneeUserID: "newUserId123"
 *               dueDate: "2024-01-31"
 *               priority: "Medium"
 *               comments: [
 *                 {
 *                   user: {
 *                     _id: "userId123",
 *                     username: "username123",
 *                     email: "user@example.com"
 *                   },
 *                   comment: "Updated comment"
 *                 }
 *               ]
 *               attachments: [
 *                 {
 *                   docType: "document",
 *                   docName: "updatedDoc.pdf",
 *                   docKey: "doc123",
 *                   docUrl: "http://example.com/doc123.pdf"
 *                 }
 *               ]
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project or task not found
 *       500:
 *         description: Internal server error
 */
exports.updateTaskInProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const taskId = req.params.taskId;
    const {
      taskName,
      content,
      assigneeUserID,
      priority,
      dueDate,
      comments,
      attachments,
    } = req.body;

    const validDocTypes = ["image", "document", "video"]; // Define allowed document types

    if (attachments) {
      for (const attachment of attachments) {
        if (!validDocTypes.includes(attachment.docType)) {
          return res.status(400).json({
            message: `Invalid document type in attachments. Allowed values are: ${validDocTypes.join(
              ", "
            )}`,
          });
        }
        if (!attachment.docName || !attachment.docKey || !attachment.docUrl) {
          return res.status(400).json({
            message:
              "Attachments must include docType, docName, docKey, and docUrl for each item",
          });
        }
      }
    }

    // Find the project by ID
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Find the task within the project's tasks array
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found in the project" });
    }

    // Get the _id field from the existing task
    const createdById = task.createdBy._id;

    // Update the task with the new data
    if (taskName) task.taskName = taskName;
    if (content) task.content = content;
    if (assigneeUserID) task.assigneeUserID = assigneeUserID;
    if (priority) task.priority = priority;
    if (dueDate) task.dueDate = dueDate;
    if (comments) task.comments = comments;
    if (attachments) task.attachments = attachments;
    // Save the project with the updated task
    await project.save();

    //Create a notification for the assignee
    if (assigneeUserID && assigneeUserID.id !== createdById.toString()) {
      const notification = new Notification({
        userId: assigneeUserID.id,
        message: `The following task has been assigned to you <taskName>${task.taskName}</taskName> in the project <projectName>${project.name}</projectName>.`,
        taskId: taskId,
        projectId: projectId,
        isRead: false,
      });
      await notification.save();
    }

    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * @swagger
 * /api/projects/{projectId}/tasks/{taskId}/deactivate:
 *   patch:
 *     summary: Deactivate a task from a project
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID
 *     responses:
 *       200:
 *         description: Task deactivated successfully
 *       404:
 *         description: Project or task not found
 *       500:
 *         description: Internal server error
 */
exports.deactivateTaskInProject = async (req, res) => {
  try {
    const projectId = req.params.projectId;
    const taskId = req.params.taskId;

    // Find the project by ID
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Find the task within the project's tasks array
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found in the project" });
    }

    // Deactivate the task by setting isActive to false
    task.isActive = false;
    task.deactivatedAt = new Date();

    // Find and deactivate the task in all columns
    project.columns.forEach((column) => {
      const taskIndex = column.taskIds.indexOf(taskId);
      if (taskIndex !== -1) {
        column.taskIds.splice(taskIndex, 1);
      }
    });

    // Save the project with the updated task
    await project.save();

    res.status(200).json({ message: "Task deactivated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
