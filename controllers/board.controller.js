const db = require("../models");
const Project = db.project;
const mongoose = require("mongoose");

/**
 * @swagger
 * /api/projects/{projectId}/columns:
 *   post:
 *     summary: Add a new column to a project
 *     tags: [Boards]
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
 *               title:
 *                 type: string
 *     responses:
 *       201:
 *         description: Column added successfully
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
 *                 workSpaceId:
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
exports.addColumnToProject = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { title } = req.body;

        // Validate title
        if (!title) {
            return res.status(400).json({ message: "Title is required" });
        }

        // Find the project by ID
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Create a new column
        const newColumn = {
            title: title,
            taskIds: []
        };

        // Add the new column to the project's columns array
        project.columns.push(newColumn);

        // Save the project to update the database
        const savedProject = await project.save();

        // Get the _id of the newly created column
        const newColumnId = savedProject.columns[savedProject.columns.length - 1]._id;

        // Add the new column's ID to the order array
        savedProject.order.push(newColumnId);

        // Save the project again to update the order array
        const updatedProject = await savedProject.save();

        // Respond with the updated project
        res.status(201).json(updatedProject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * @swagger
 * /api/projects/{projectId}/columns/{columnId}:
 *   put:
 *     summary: Update a column in a project
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: The column ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Column updated successfully
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
 *                 workSpaceId:
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
 *         description: Project or column not found
 *       500:
 *         description: Internal server error
 */
exports.updateColumn = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const columnId = req.params.columnId;
        const { title, taskIds } = req.body;

        // Find the project by ID
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Find the column within the project
        const column = project.columns.id(columnId);
        if (!column) {
            return res.status(404).json({ message: "Column not found" });
        }

        // Update the column properties
        if (title) column.title = title;
        if (taskIds) column.taskIds = taskIds;

        // Save the updated project
        const updatedProject = await project.save();

        res.status(200).json(updatedProject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * @swagger
 * /api/projects/{projectId}/columns/{columnId}/deactivate:
 *   patch:
 *     summary: Deactivate a column from a project
 *     tags: [Boards]
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *         description: The project ID
 *       - in: path
 *         name: columnId
 *         required: true
 *         schema:
 *           type: string
 *         description: The column ID
 *     responses:
 *       200:
 *         description: Column deactivated successfully
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
 *                 workSpaceId:
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
 *         description: Project or column not found
 *       500:
 *         description: Internal server error
 */
exports.deactivateColumn = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const columnId = req.params.columnId;

        // Find the project by ID
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Find the column within the project
        const column = project.columns.id(columnId);
        if (!column) {
            return res.status(404).json({ message: "Column not found" });
        }

        // Deactivate the column by setting isActive to false
        column.isActive = false;
        column.deactivatedAt= new Date()

        // Save the project to update the column's isActive status
        await project.save();

        res.status(200).json({ message: "Column deactivated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * @swagger
 * /api/projects/{projectId}/columns/order:
 *   put:
 *     summary: Update the order of columns in a project
 *     tags: [Boards]
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
 *               order:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               order: ["columnId1", "columnId2", "columnId3"]
 *     responses:
 *       200:
 *         description: Column order updated successfully
 *       400:
 *         description: Order must be an array of valid column IDs
 *       404:
 *         description: Project or columns not found
 *       500:
 *         description: Internal server error
 */
exports.updateColumnOrder = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const { order } = req.body;
        console.log(req.body.order)
        // Validate order array
        // if (!Array.isArray(order) || order.some(id => !mongoose.Types.ObjectId.isValid(id))) {
        //     return res.status(400).json({ message: "Order must be an array of valid column IDs" });
        // }

        // Find the project by ID
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // // Check if all provided column IDs exist in the project
        // const allColumnsExist = order.every(id => project.columns.some(column => column._id.equals(id)));
        // if (!allColumnsExist) {
        //     return res.status(404).json({ message: "One or more columns not found" });
        // }

        // Update the order of columns
        project.order = order;

        // Save the updated project
        const savedProject = await project.save();

        res.status(200).json(savedProject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

/**
 * @swagger
 * /api/projects/{projectId}/tasks/{taskId}/move:
 *   put:
 *     summary: Move a task to another column in a project
 *     tags: [Boards]
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
 *               sourceColumnId:
 *                 type: string
 *               destinationColumnId:
 *                 type: string
 *             example:
 *               sourceColumnId: "sourceColumnId1"
 *               destinationColumnId: "destinationColumnId1"
 *     responses:
 *       200:
 *         description: Task moved successfully
 *       404:
 *         description: Project, columns, or task not found
 *       500:
 *         description: Internal server error
 */
exports.moveTaskToAnotherColumn = async (req, res) => {
    try {
        const { projectId, taskId } = req.params;
        const { sourceColumnId, destinationColumnId } = req.body;

        // Validate IDs
        if (!mongoose.Types.ObjectId.isValid(sourceColumnId) || !mongoose.Types.ObjectId.isValid(destinationColumnId)) {
            return res.status(400).json({ message: "Invalid column IDs" });
        }

        // Find the project by ID
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        // Find the source and destination columns
        const sourceColumn = project.columns.find(col => col._id.equals(sourceColumnId));
        const destinationColumn = project.columns.find(col => col._id.equals(destinationColumnId));

        if (!sourceColumn) {
            return res.status(404).json({ message: "Source column not found in the project" });
        }
        if (!destinationColumn) {
            return res.status(404).json({ message: "Destination column not found in the project" });
        }

        // Remove the task ID from the source column
        const taskIndex = sourceColumn.taskIds.indexOf(taskId);
        if (taskIndex === -1) {
            return res.status(404).json({ message: "Task not found in the source column" });
        }
        sourceColumn.taskIds.splice(taskIndex, 1);

        // Add the task ID to the destination column
        destinationColumn.taskIds.push(taskId);

        // Save the updated project
        await project.save();

        res.status(200).json({project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
