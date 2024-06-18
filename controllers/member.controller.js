const { ObjectId } = require('mongoose').Types;
const db = require("../models");
const Workspace = db.workspace;
const User = db.user;

/**
 * @swagger
 * /api/workspaces/{workspaceId}/user/{adminUserId}/members:
 *   post:
 *     tags:
 *       - Member
 *     summary: Add members to a workspace
 *     description: Add members to a workspace.
 *     parameters:
 *       - name: workspaceId
 *         in: path
 *         description: ID of the workspace to add members to
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               memberEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Emails of the members to add to the workspace
 *               role:
 *                 type: string
 *                 description: Role of the members (optional)
 *             example:
 *               memberEmails: ["abc@email.com", "xyz@email.com"]
 *               role: "Admin or Member"
 *     responses:
 *       200:
 *         description: Successfully added members to the workspace
 *         schema:
 *           $ref: "#/definitions/Workspace"
 *       400:
 *         description: Invalid workspace ID or member Email
 *       404:
 *         description: Workspace not found or User not found
 *       500:
 *         description: Error adding members to workspace
 */
exports.addMembersToWorkspace = async (req, res) => {
    try {
        const { workspaceId, adminUserId } = req.params;
        const { memberEmails, role } = req.body;

        // Check if workspaceId is a valid ObjectId
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }

        // Check if adminUserId is a valid ObjectId
        if (!isValidObjectId(adminUserId)) {
            return res.status(400).send({ message: "Invalid admin user ID" });
        }

        // Find the workspace by its ID
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }

        // Find the admin user by its ID
        const adminUser = await User.findById(adminUserId);
        if (!adminUser) {
            return res.status(404).send({ message: "Admin user not found" });
        }

        // Check if the authenticated user is an admin of the workspace
        const isAdmin = workspace.members.some(m => m.user.toString() === adminUserId && m.role === 'Admin');
        if (!isAdmin) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const membersStatus = [];

        // Loop through each member email and add them to the workspace
        for (const memberEmail of memberEmails) {
            // Find the user by Email
            const user = await User.findOne({ email: memberEmail });
            if (!user) {
                membersStatus.push({ email: memberEmail, status: 'User not found' });
                continue; // Continue with the next iteration
            }

            // Check if the member is already in the workspace
            let existingMember = workspace.members.find(member => member.user.toString() === user._id.toString());
            if (existingMember) {
                // If member exists and is inactive, activate them
                if (!existingMember.isActive) {
                    existingMember.isActive = true;
                    existingMember.joinedAt = new Date();
                    existingMember.deactivatedAt = null;
                    membersStatus.push({ email: memberEmail, status: 'Member activated and added to workspace' });
                } else {
                    membersStatus.push({ email: memberEmail, status: 'Member already in workspace' });
                }
                continue; // Continue with the next iteration
            }

            // Add the member to the workspace
            workspace.members.push({
                user: user._id,
                role: role || 'Member', // Default to 'Member' if role is not provided
                isActive: true,
                joinedAt: new Date()
            });

            membersStatus.push({ email: memberEmail, status: 'Added successfully' });
        }

        // Update the workspace and send the updated workspace object along with members status in the response
        workspace.updatedAt = new Date();
        const updatedWorkspace = await workspace.save();
        res.status(200).send({ workspace: updatedWorkspace, membersStatus });
    } catch (err) {
        // Log the error
        console.error("Error adding members to workspace:", err);
        // Send a generic error message to the client
        res.status(500).send({ message: "Error adding members to workspace" });
    }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}/user/{adminUserId}/members:
 *   delete:
 *     tags:
 *       - Member
 *     summary: Remove members from a workspace
 *     description: Remove members from a workspace.
 *     parameters:
 *       - name: workspaceId
 *         in: path
 *         description: ID of the workspace to remove members from
 *         required: true
 *         schema:
 *           type: string
 *       - name: adminUserId
 *         in: path
 *         description: ID of the admin user performing the action
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               memberEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Emails of the members to remove from the workspace
 *     responses:
 *       200:
 *         description: Successfully removed members from the workspace
 *         schema:
 *           $ref: "#/definitions/Workspace"
 *       400:
 *         description: Invalid workspace ID or member Email
 *       404:
 *         description: Workspace not found, User not found, or Member not found in workspace
 *       500:
 *         description: Error removing members from workspace
 */
exports.removeMemberFromWorkspace = async (req, res) => {
    try {
        const { workspaceId, adminUserId } = req.params;
        const { memberEmails } = req.body;

        // Check if workspaceId is a valid ObjectId
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }

        // Check if adminUserId is a valid ObjectId
        if (!isValidObjectId(adminUserId)) {
            return res.status(400).send({ message: "Invalid admin user ID" });
        }

        // Find the workspace by its ID
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }

        // Find the admin user by its ID
        const adminUser = await User.findById(adminUserId);
        if (!adminUser) {
            return res.status(404).send({ message: "Admin user not found" });
        }

        // Check if the authenticated user is an admin of the workspace
        const isAdmin = workspace.members.some(m => m.user.toString() === adminUserId && m.role === 'Admin');
        if (!isAdmin) {
            return res.status(403).json({ message: "You are not authorized to perform this action" });
        }

        const membersStatus = [];

        // Loop through each member email and set isActive to false
        for (const memberEmail of memberEmails) {
            // Find the user by Email
            const user = await User.findOne({ email: memberEmail });
            if (!user) {
                membersStatus.push({ email: memberEmail, status: 'User not found' });
                continue; // Continue with the next iteration
            }

            // Check if the member is the admin user trying to remove themselves
            if (user._id.toString() === adminUserId) {
                membersStatus.push({ email: memberEmail, status: 'Admin user cannot remove themselves' });
                continue; // Continue with the next iteration
            }

            // Check if the member is in the workspace
            const member = workspace.members.find(m => m.user.toString() === user._id.toString());
            if (!member) {
                membersStatus.push({ email: memberEmail, status: 'Member not found in workspace' });
                continue; // Continue with the next iteration
            }

            // Update isActive status to false
            member.isActive = false;
            member.deactivatedAt = new Date();
            membersStatus.push({ email: memberEmail, status: 'Deactivated successfully' });
        }

        // Update the workspace and send the updated workspace object along with members status in the response
        workspace.updatedAt = new Date();
        const updatedWorkspace = await workspace.save();
        res.status(200).send({ workspace: updatedWorkspace, membersStatus });
    } catch (err) {
        // Log the error
        console.error("Error removing members from workspace:", err);
        // Send a generic error message to the client
        res.status(500).send({ message: "Error removing members from workspace" });
    }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members:
 *   get:
 *     summary: Retrieve all members of a workspace
 *     tags:
 *       - Member
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of members
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       imgUrl:
 *                         type: string
 *                   role:
 *                     type: string
 *                   isActive:
 *                     type: boolean
 *                   joinedAt:
 *                     type: string
 *                   deactivatedAt:
 *                     type: string
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Internal server error
 */
exports.getWorkspaceMembers = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }
        const workspace = await Workspace.findById(workspaceId).populate({
            path: 'members.user', // Populate the 'user' field in the 'members' array
            select: '_id email imgUrl' // Select the 'email' and 'imgUrl' fields from the 'User' model
        });
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }
        
        // Filter and extract imgUrl and email from populated members with active status
        const activeMembersWithImgUrlAndEmail = workspace.members
            .filter(member => member.isActive) // Filter active members
            .map(member => ({
                user: {
                    id: member.user._id,
                    email: member.user.email,
                    imgUrl: member.user.imgUrl
                },
                role: member.role,
                isActive: member.isActive,
                joinedAt: member.joinedAt,
                deactivatedAt: member.deactivatedAt,
            }));

        res.status(200).send(activeMembersWithImgUrlAndEmail);
    } catch (err) {
        console.error("Error retrieving workspace members:", err);
        res.status(500).send({ message: "Error retrieving workspace members" });
    }
};


/**
 * @swagger
 * /api/workspaces/{workspaceId}/projects:
 *   get:
 *     summary: Retrieve all projects of a workspace
 *     tags:
 *       - Member
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The ID of the project
 *                   name:
 *                     type: string
 *                     description: The name of the project
 *                   imgurl:
 *                     type: string
 *                     description: The URL of the project image
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Internal server error
 */
exports.getWorkspaceProjects = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }
        const workspace = await Workspace.findById(workspaceId).populate('projects', 'id name imgUrl');
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }
        res.status(200).send(workspace.projects);
    } catch (err) {
        console.error("Error retrieving workspace tasks:", err);
        res.status(500).send({ message: "Error retrieving workspace tasks" });
    }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}/tasks:
 *   get:
 *     summary: Retrieve all tasks of a workspace
 *     tags:
 *       - Member
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Internal server error
 */exports.getWorkspaceTasks = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }
        const workspace = await Workspace.findById(workspaceId).populate('projects');
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }

        // Check if the workspace is active
        if (!workspace.isActive) {
            return res.status(400).send({ message: "Workspace is not active" });
        }

        // Array to hold all active tasks
        let allTasks = [];
        
        // Iterate over each project in the workspace
        workspace.projects.forEach(project => {
            // Check if the project is active
            if (project.isActive) {
                // Iterate over each task in the project
                project.tasks.forEach(task => {
                    // Check if the task is active
                    if (task.isActive) {
                        // Extract relevant task details and add projectName
                        const taskDetails = {
                            _id: 0,
                            id: task._id,
                            isTaskActive: task.isActive,
                            projectID: project._id,
                            project: project.name,
                            isProjectActive: task.isActive,
                            workspace: workspace.name,
                            isWorkspaceActive: workspace.isActive,
                            name: task.taskName,
                            content: task.content,
                            assigneeUserID: task.assigneeUserID,
                            dueDate: task.dueDate,
                            priority: task.priority,
                            attachments: task.attachments,
                            comments: task.comments,
                            createdBy: task.createdBy,
                        };
                        // Push task details to allTasks array
                        allTasks.push(taskDetails);
                    }
                });
            }
        });

        res.status(200).send(allTasks);
    } catch (err) {
        console.error("Error retrieving workspace tasks:", err);
        res.status(500).send({ message: "Error retrieving workspace tasks" });
    }
};

/**
 * @swagger
 * /api/workspaces/user/{userId}/workspaces:
 *   get:
 *     summary: Retrieve all workspaces where the user is a member
 *     tags:
 *       - Member
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   imgUrl:
 *                     type: string
 *       404:
 *         description: No workspaces found for this user
 *       500:
 *         description: Internal server error
 */
exports.getAllWorkspacesByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Validate userId
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find all active workspaces where the user is an active member
        const workspaces = await Workspace.find({
            isActive: true,
            members: {
                $elemMatch: {
                    user: userId,
                    isActive: true
                }
            }
        });

        // Map workspaces to the response format including members' IDs and active status array
        const response = workspaces.map(workspace => ({
            id: workspace._id,
            name: workspace.name,
            imgUrl: workspace.imgUrl,
            members: workspace.members.map(member => ({
                userId: member.user,
                isActive: member.isActive
            }))
        }));

        // Respond with the list of workspaces or an empty array
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

/**
 * @swagger
 * /api/workspaces/user/{userId}/projects:
 *   get:
 *     summary: Retrieve all projects of all workspaces where the user is a member
 *     tags:
 *       - Member
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   workspaceName:
 *                     type: string
 *                   imgUrl:
 *                     type: string
 *       404:
 *         description: No workspaces or projects found for this user
 *       500:
 *         description: Internal server error
 */
exports.getAllProjectsByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Validate userId
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find all workspaces where the user is a member
        const workspaces = await Workspace.find({
            "members.user": userId,
            "members.isActive": true
        }).populate('projects');

        // Collect and map all projects from the found workspaces
        const projects = workspaces.flatMap(workspace => {
            return workspace.projects.map(project => ({
                id: project._id,
                name: project.name,
                imgUrl: project.imgUrl,
                workspaceName: workspace.name,
                workspaceId: workspace._id
            }));
        });

        // Respond with the list of projects
        res.status(200).json(projects);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

/**
 * @swagger
 * /api/workspaces/user/{userId}/tasks:
 *   get:
 *     summary: Retrieve all tasks of all workspaces where the user is a member
 *     tags:
 *       - Member
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: projectName
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   taskName:
 *                     type: string
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                   priority:
 *                     type: string
 *                   status:
 *                     type: string
 *                   workspaceName:
 *                     type: string
 *                   projectName:
 *                     type: string
 *       404:
 *         description: No workspaces or projects found for this user
 *       500:
 *         description: Internal server error
 */
exports.getAllTasksByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;
        const projectName = req.query.projectName;

        // Validate userId
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ message: "Invalid userId format" });
        }

        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Aggregate tasks assigned to the user
        const aggregatePipeline = [
            {
                $match: {
                    "members.user": new ObjectId(userId),
                    "members.isActive": true,
                    isActive: true // Check for active workspace
                }
            },
            {
                $lookup: {
                    from: "projects",
                    localField: "projects",
                    foreignField: "_id",
                    as: "projects"
                }
            },
            { $unwind: "$projects" },
            {
                $match: {
                    "projects.isActive": true // Check for active projects
                }
            },
            { $unwind: "$projects.tasks" },
            {
                $match: {
                    "projects.tasks.assigneeUserID.id": new ObjectId(userId),
                    "projects.tasks.isActive": true // Check for active tasks
                }
            }
        ];

        // Add an additional match stage for projectName if provided
        if (projectName) {
            aggregatePipeline.push({
                $match: {
                    "projects.name": projectName
                }
            });
        }

        // Continue with the project stage
        aggregatePipeline.push({
            $project: {
                _id: 0,
                id: "$projects.tasks._id",
                isTaskActive: "$projects.tasks.isActive",
                projectID: "$projects._id",
                project: "$projects.name",
                isProjectActive: "$projects.tasks.isActive",
                workspace: "$name",
                isWorkspaceActive: "$isActive",
                name: "$projects.tasks.taskName",
                content: "$projects.tasks.content",
                assigneeUserID: "$projects.tasks.assigneeUserID",
                dueDate: "$projects.tasks.dueDate",
                priority: "$projects.tasks.priority",
                attachments: "$projects.tasks.attachments",
                comments: "$projects.tasks.comments",
                createdBy: "$projects.tasks.createdBy",
            }
        });

        const tasks = await Workspace.aggregate(aggregatePipeline);

        // Respond with the list of tasks
        res.status(200).json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}/members/{userId}/exit:
 *   patch:
 *     summary: Deactivate a member from a workspace
 *     tags: 
 *       - Member
 *     description: Deactivates a member from a workspace, setting their status to inactive
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the workspace
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user to deactivate
 *     responses:
 *       200:
 *         description: Member deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Member deactivated successfully
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Error deactivating member
 */

exports.exitMember = async (req, res) => {
    const { workspaceId, userId } = req.params;

    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const member = workspace.members.find(m => m.user && m.user.toString() === userId);
        if (!member) {
            return res.status(404).json({ message: 'Member not found' });
        }

        if (member.role === 'Admin') {
            const otherAdmins = workspace.members.filter(m => m.role === 'Admin' && m.user.toString() !== userId);
            if (otherAdmins.length === 0 && workspace.members.length > 1) {
                return res.status(400).json({ message: 'Cannot deactivate the last admin. Please assign another admin first.' });
            }
        }

        // `exitMember` is a method of the `Workspace` model
        await workspace.exitMember(userId);

        // Check the number of active members
        const activeMembers = workspace.members.filter(m => m.isActive);
        if (activeMembers.length === 0) {
            // Append epoch to the workspace name
            workspace.name += `_${Date.now()}`;
            workspace.isActive = false;
            workspace.deactivatedAt = new Date();
            await workspace.save();
        }

        return res.status(200).json({ message: 'Member deactivated successfully' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Error deactivating member', error });
    }
};

/**
 * @swagger
 * /api/workspaces/members/role/{adminUserId}:
 *   patch:
 *     summary: Update a member's role in a workspace
 *     tags: 
 *       - Member
 *     description: Updates a member's role to either admin or member. Only admins can perform this action.
 *     parameters:
 *       - in: path
 *         name: adminUserId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the admin user performing the action
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workspaceId:
 *                 type: string
 *                 description: The ID of the workspace
 *               userId:
 *                 type: string
 *                 description: The ID of the user whose role is being updated
 *               role:
 *                 type: string
 *                 enum: [Admin, Member]
 *                 description: The new role of the user
 *     responses:
 *       200:
 *         description: Member role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Member role updated successfully
 *       400:
 *         description: Invalid role or insufficient permissions
 *       404:
 *         description: Workspace or member not found
 *       500:
 *         description: Error updating member role
 */
exports.updateMemberRole = async (req, res) => {
    const { adminUserId } = req.params;
    const { workspaceId, userId, role } = req.body;

    if (!['Admin', 'Member'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Role must be either Admin or Member.' });
    }

    try {
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }

        const requestingMember = workspace.members.find(member => member.user.toString() === adminUserId);
        if (!requestingMember || requestingMember.role !== 'Admin') {
            return res.status(403).json({ message: 'Only admins can update member roles.' });
        }

        const memberToUpdate = workspace.members.find(member => member.user.toString() === userId);
        if (!memberToUpdate) {
            return res.status(404).json({ message: 'Member not found' });
        }

        memberToUpdate.role = role;
        await workspace.save();

        return res.status(200).json({ message: 'Member role updated successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Error updating member role', error });
    }
};

function isValidObjectId(id) {
    // Check if id is a valid MongoDB ObjectId
    return ObjectId.isValid(id);
}
