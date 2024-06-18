const db = require("../models");
const Project = db.project;
const Workspace = db.workspace;
const User = db.user;
const mongoose = require("mongoose")

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]   
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               workspaceName:
 *                 type: string
 *               creatorUserID:
 *                 type: string
 *               imgKey:
 *                 type: string
 *               imgUrl:
 *                 type: string
 *               order:
 *                 type: array
 *                 items:
 *                   type: string
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     taskIds:
 *                       type: array
 *                       items:
 *                         type: string
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     taskName:
 *                       type: string
 *                     content:
 *                       type: string
 *             example:
 *               name: "Project Name"
 *               description: "Project Description"
 *               workspaceID: "Unique Workspace ID"
 *               imgKey: "unique filename"
 *               imgUrl: "https://img.freepik.com/free-vector/hand-drawn-minimal-background_23-2149001650.jpg"
 *               creatorUserID: "Unique User ID"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 order:
 *                   type: array
 *                   items:
 *                     type: string
 *                 columns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       taskIds:
 *                         type: array
 *                         items:
 *                           type: string
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       taskName:
 *                         type: string
 *                       content:
 *                         type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
exports.create = async (req, res) => {
    try {
        const { name, description, workspaceID, order, columns, tasks, creatorUserID, imgUrl, imgKey } = req.body;
        if (!creatorUserID) {
            return res.status(400).send({ message: "Please enter the creator details" });
        }

        const user = await User.findById(creatorUserID);

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (!workspaceID) {
            return res.status(400).send({ message: "Please enter the workspace ID" });
        }

        const workspace = await Workspace.findById(workspaceID);

        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }

        const isMember = workspace.members.some(member => member.user.equals(creatorUserID));
        if (!isMember) {
            return res.status(403).send({ message: "Forbidden: You are not a member of the specified workspace" });
        }

        if (!name) {
            return res.status(400).send({ message: "Please enter the name field" });
        }

        let defaultColumns = columns || [
            { title: "To Do", taskIds: [] },
            { title: "In Progress", taskIds: [] },
            { title: "Done", taskIds: [] }
        ];

        const project = new Project({
            name,
            description,
            workspaceId: workspace._id,
            creatorUserID: creatorUserID,
            order,
            columns: defaultColumns,
            tasks,
            imgUrl,
            imgKey
        });

        const savedProject = await project.save();

        // Update project order with column IDs
        const columnIds = savedProject.columns.map(column => column._id);
        savedProject.order = columnIds;
        await savedProject.save();

        // Update workspace with new project ID
        workspace.projects.push(savedProject._id);
        await workspace.save();

        res.status(201).send(savedProject);
    } catch (err) {
        res.status(500).send({
            message: err.message || "Some error occurred while creating the project"
        });
    }
};

// exports.createAI = async (req, res) => {
//     try {
//         const { name, description, workspaceID,  tasks, creatorUserID, imgUrl, imgKey } = req.body;
//         if (!creatorUserID) {
//             return res.status(400).send({ message: "Please enter the creator details" });
//         }

//         const user = await User.findById(creatorUserID);

//         if (!user) {
//             return res.status(404).send({ message: "User not found" });
//         }

//         if (!workspaceID) {
//             return res.status(400).send({ message: "Please enter the workspace ID" });
//         }

//         const workspace = await Workspace.findById(workspaceID);

//         if (!workspace) {
//             return res.status(404).send({ message: "Workspace not found" });
//         }

//         // const isMember = workspace.members.some(member => member.user.equals(creatorUserID));
//         // if (!isMember) {
//         //     return res.status(403).send({ message: "Forbidden: You are not a member of the specified workspace" });
//         // }

//         if (!name) {
//             return res.status(400).send({ message: "Please enter the name field" });
//         }

//         let defaultColumns =  [
//             { title: "To Do", taskIds: [] },
//             { title: "In Progress", taskIds: [] },
//             { title: "Done", taskIds: [] }
//         ];

//         const project = new Project({
//             name,
//             description,
//             workspaceId: workspaceID,
//             creatorUserID: creatorUserID,
//             order:[],
//             columns: defaultColumns,
//             tasks:[],
//             imgUrl,
//             imgKey
//         });

//         const savedProject = await project.save();
        
//         // Process tasks and assign to default columns
//         const taskDocs = tasks.map(task => ({
//             ...task,
           
//             taskName:task.title,
//             content:task.description,
//             //assigneeUserID: assigneeUserID ? assigneeUserID : null,
//             //dueDate,
//             //priority,
//             //comments,
//             createdBy:creatorUserID,
//             //attachments
//         }));

//         // Save tasks and get their IDs
//         //const savedTasks = await Project.TaskModel.insertMany(taskDocs);
//         const savedTasks = await Project.updateOne(
//             { _id: savedProject._id },
//             { $push: { tasks: { $each: taskDocs } } },
//             { new: true }
//         );
//         // Assign task IDs to the default column (e.g., "To Do")
//         defaultColumns[0].taskIds = savedTasks.map(task => task._id);

//         // Update the project with the correct column and task details
//         savedProject.columns = defaultColumns;
//         savedProject.tasks = savedTasks;
//         const columnIds = savedProject.columns.map(column => column._id);
//         savedProject.order = columnIds;
        
//         // Save the updated project
//         await savedProject.save();

//         // Update workspace with new project ID
//         workspace.projects.push(savedProject._id);
//         await workspace.save();

//         res.status(201).send(savedProject);


//     } catch (error) {
//         res.status(500).send({
//             message: error.message || "Some error occurred while creating the project"
//         });
//     }
// }

exports.createAI = async (req, res) => {
    try {
        const { name, description, workspaceID, tasks, creatorUserID, imgUrl, imgKey } = req.body;

        if (!creatorUserID) {
            return res.status(400).send({ message: "Please enter the creator details" });
        }

        const user = await User.findById(creatorUserID);
        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        if (!workspaceID) {
            return res.status(400).send({ message: "Please enter the workspace ID" });
        }

        const workspace = await Workspace.findById(workspaceID);
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }

        if (!name) {
            return res.status(400).send({ message: "Please enter the name field" });
        }

        let defaultColumns = [
            { title: "To Do", taskIds: [] },
            { title: "In Progress", taskIds: [] },
            { title: "Done", taskIds: [] }
        ];

        const project = new Project({
            name,
            description,
            workspaceId: workspaceID,
            creatorUserID: creatorUserID,
            order: [],
            columns: defaultColumns,
            tasks: [],
            imgUrl,
            imgKey
        });

        const savedProject = await project.save();
        const columnIds = savedProject.columns.map(column => column._id);
        savedProject.order = columnIds;
        await savedProject.save();

        // Process tasks and assign to default columns
        const taskDocs = tasks.map(task => ({
            taskName: task.title,
            content: task.description,
            createdBy: {
                _id: creatorUserID,
                username: user.username,
                email: user.email
            }
        }));

        // Save tasks to the project's tasks array
        const updatedProject = await Project.findByIdAndUpdate(
            savedProject._id,
            { $push: { tasks: { $each: taskDocs } } },
            { new: true, useFindAndModify: false }
        );

        // Extract saved task IDs
        const savedTaskIds = updatedProject.tasks.map(task => task._id);

        // Assign task IDs to the "To Do" column
        const toDoColumn = updatedProject.columns.find(column => column.title === "To Do");
        toDoColumn.taskIds.push(...savedTaskIds);

        // Update the project with the correct column and task details
        await Project.findByIdAndUpdate(
            savedProject._id,
            { $set: { columns: updatedProject.columns } },
            { new: true, useFindAndModify: false }
        );

        // Update workspace with new project ID
        await Workspace.findByIdAndUpdate(
            workspaceID,
            { $push: { projects: savedProject._id } },
            { new: true, useFindAndModify: false }
        );

        res.status(201).send(updatedProject);
    } catch (error) {
        res.status(500).send({
            message: error.message || "Some error occurred while creating the project"
        });
    }
};




/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: The project data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 workspaceId:
 *                   type: string
 *                 order:
 *                   type: array
 *                   items:
 *                     type: string
 *                 columns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       taskIds:
 *                         type: array
 *                         items:
 *                           type: string
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       taskName:
 *                         type: string
 *                       content:
 *                         type: string
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).send({ message: "Project not found" });
        }
        res.status(200).send(project)
    } catch (error) {
        res.status(500).send(error);
    }
}

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               order:
 *                 type: array
 *                 items:
 *                   type: string
 *               columns:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     taskIds:
 *                       type: array
 *                       items:
 *                         type: string
 *               tasks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     taskName:
 *                       type: string
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
exports.updateProjectById = async (req, res) => {
    try {
        const { name, description, order, columns, tasks } = req.body;
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { name, description, order, columns, tasks },
        )
        if (!project) {
            return res.status(404).send({ message: "Project not found" });
        }
        res.send(project);
    } catch (error) {
        res.status(500).send(error)
    }
}

/**
 * @swagger
 * /api/projects/{id}/deactivate:
 *   patch:
 *     summary: Deactivate project by ID
 *     tags: [Projects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *     responses:
 *       200:
 *         description: Project deactivated successfully
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
exports.deactivateProjectById = async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(req.params.id, { isActive: false, deactivatedAt: new Date() });
        if (!project) {
            return res.status(404).send({ message: "Project not found" });
        }
        res.send({ message: "Project deactivated successfully" });
    } catch (error) {
        res.status(500).send(error);
    }
};
