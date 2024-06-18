const db = require("../models");
const Workspace = db.workspace;
const Project = db.project;
const User = db.user;

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags:
 *       - Workspace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the workspace
 *               description:
 *                 type: string
 *                 description: Description of the workspace
 *               imgUrl:
 *                 type: string
 *                 description: URL of the workspace image
 *               imgKey:
 *                 type: string
 *               creatorUserID:
 *                 type: string
 *                 description: ID of the user creating the workspace
 *               memberEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of email addresses of members to be added to the workspace
 *             example:
 *               name: "Unique Workspace Name"
 *               description: "Workspace Description"
 *               imgUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
 *               creatorUserID: "UserId"
 *               imgKey: "unique filename"
 *               memberEmails:
 *                 - "email1@example.com"
 *                 - "email2@example.com"
 *     responses:
 *       200:
 *         description: Workspace created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 workspace:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: ID of the workspace
 *                     name:
 *                       type: string
 *                       description: Name of the workspace
 *                     description:
 *                       type: string
 *                       description: Description of the workspace
 *                     imgUrl:
 *                       type: string
 *                       description: URL of the workspace image
 *                     creatorUserID:
 *                       type: string
 *                       description: ID of the user who created the workspace
 *                     isActive:
 *                       type: boolean
 *                       description: Status indicating if the workspace is active
 *                     members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           user:
 *                             type: string
 *                             description: ID of the user
 *                           role:
 *                             type: string
 *                             description: Role of the user in the workspace
 *                           status:
 *                             type: string
 *                             description: Status of the user in the workspace
 *                 memberStatus:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                         description: Email address of the member
 *                       status:
 *                         type: string
 *                         description: Status indicating if the member was added or not found
 *                 message:
 *                   type: string
 *                   description: Success message
 *             example:
 *               workspace:
 *                 _id: "workspaceId"
 *                 name: "Workspace Name"
 *                 description: "Workspace Description"
 *                 imgUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
 *                 creatorUserID: "creatorUserId"
 *                 isActive: true
 *                 members:
 *                   - user: "creatorUserId"
 *                     role: "Admin"
 *                     status: "Added"
 *                   - user: "memberUserId"
 *                     role: "Member"
 *                     status: "Added"
 *               memberStatus:
 *                 - email: "member@example.com"
 *                   status: "Added"
 *                 - email: "notfound@example.com"
 *                   status: "Not Found"
 *               message: "Workspace created successfully"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing why the request was invalid
 *             example:
 *               message: "Name field is required"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message describing the internal server error
 *             example:
 *               message: "Error creating workspace: detailed error message"
 */
exports.create = async (req, res) => {
    try {
        const { name, description, imgUrl, imgKey, creatorUserID, memberEmails = [] } = req.body;

        if (!name) {
            return res.status(400).send({ message: "Name field is required" });
        }

        if (!creatorUserID) {
            return res.status(400).send({ message: "Please enter the creator User ID" });
        }

        const user = await User.findById(creatorUserID);

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        const members = [{ user: user._id, role: 'Admin', _id: user._id }];
        const memberStatus = [];

        if (memberEmails.length > 0) {
            const memberPromises = memberEmails.map(async (email) => {
                const member = await User.findOne({ email });
                if (member) {
                    members.push({ user: member._id, role: 'Member', status: 'Added', _id: member._id });
                    memberStatus.push({ email, status: 'Added' });
                } else {
                    memberStatus.push({ email, status: 'Not Found' });
                }
            });

            await Promise.all(memberPromises);
        }

        const workspace = new Workspace({
            name,
            description,
            imgUrl,
            imgKey,
            creatorUserID: user._id,
            isActive: true,
            members
        });

        const savedWorkspace = await workspace.save();

        res.status(200).send({ 
            workspace: savedWorkspace, 
            memberStatus,
            message: "Workspace created successfully" 
        });
    } catch (err) {
        console.error("Error creating workspace:", err);
        res.status(500).send({ message: "Error creating workspace: " + err.message });
    }
};

exports.getAllWorkspaces = async (req, res) => {
    try {
        const { isActive } = req.query;
        let query = {};
        
        // Check if isActive parameter is provided
        if (isActive !== undefined) {
            query.isActive = isActive.toLowerCase() === 'true';
        } else {
            query.isActive = true; // Default to true if isActive parameter is not provided
        }

        const workspaces = await Workspace.find(query);
        res.status(200).send(workspaces);
    } catch (err) {
        console.error("Error retrieving workspaces:", err);
        res.status(500).send({ message: "Error retrieving workspaces" });
    }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}:
 *   get:
 *     summary: Get workspace details
 *     tags:
 *       - Workspace
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workspace details
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
 *                 imgUrl:
 *                   type: string
 *                 creatorUserID:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *                 isActive:
 *                   type: boolean
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update workspace details
 *     tags:
 *       - Workspace
 *     parameters:
 *       - in: path
 *         name: workspaceId
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               imgUrl:
 *                 type: string
 *               imgKey:
 *                 type: string
 *             example:
 *               name: "Updated Workspace Name"
 *               description: "Updated Workspace Description"
 *               imgUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb"
 *               imgKey: "46273834b3fb"
 *     responses:
 *       200:
 *         description: Workspace updated successfully
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
 *                 imgUrl:
 *                   type: string
 *                 updatedAt:
 *                   type: string
 *       400:
 *         description: Bad request
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Internal server error
 */
exports.getWorkspaceById = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }
        res.status(200).send(workspace);
    } catch (err) {
        console.error("Error retrieving workspace:", err);
        res.status(500).send({ message: "Error retrieving workspace" });
    }
};

exports.updateWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const { name, description, imgUrl, imgKey } = req.body;
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }

        if (name) workspace.name = name;
        if (description) workspace.description = description;
        if (imgUrl) workspace.imgUrl = imgUrl;
        if (imgKey) workspace.imgKey = imgKey;
        workspace.updatedAt = new Date();

        const updatedWorkspace = await workspace.save();
        res.status(200).send(updatedWorkspace);
    } catch (err) {
        console.error("Error updating workspace:", err);
        res.status(500).send({ message: "Error updating workspace" });
    }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}/deactivate:
 *   patch:
 *     summary: Deactivate a workspace
 *     tags: 
 *       - Workspace
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Workspace deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Workspace deactivated successfully
 *       '403':
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You are not allowed to deactivate this workspace"
 *       '404':
 *         description: Workspace not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Workspace not found
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Some error occurred while deactivating the workspace
 */
exports.deactivateWorkspace = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        if (!isValidObjectId(workspaceId)) {
            return res.status(400).send({ message: "Invalid workspace ID" });
        }
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).send({ message: "Workspace not found" });
        }

        // Check if the user is admin
        const userIsAdmin = workspace.members.some(
            member => member.userID.toString() === req.userId && member.role === 'Admin'
        );
        if (!userIsAdmin) {
            return res.status(403).send({ message: "Forbidden: You are not allowed to deactivate this workspace" });
        }

        workspace.isActive = false;
        workspace.deactivatedAt = new Date();
        await workspace.save();

        res.status(200).send({ message: "Workspace deactivated successfully" });
    } catch (err) {
        console.error("Error deactivating workspace:", err);
        res.status(500).send({ message: "Error deactivating workspace" });
    }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}/media-docs:
 *   get:
 *     summary: Get image URLs and document URLs for a workspace
 *     tags: 
 *       - Workspace
 *     description: Retrieve image URLs for the workspace, project images, and task document URLs for the given workspace ID.
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the workspace to get media and document URLs for
 *     responses:
 *       '200':
 *         description: Successful operation. Returns an array of image and document URLs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imgUrls:
 *                   type: array
 *                   items:
 *                     type: string
 *                   description: Array of image and document URLs
 *       '404':
 *         description: Workspace not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Workspace not found
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
exports.getWorkspaceMediaAndDocs = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        // Find workspace by ID
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: 'Workspace not found' });
        }
        // Initialize arrays to collect objects with URLs
        const imgUrls = [];
        const docUrls = [];
        // Find projects in the workspace
        const projects = await Project.find({ workspaceId });
        for (const project of projects) {
            // Iterate over tasks in each project
            for (const task of project.tasks) {
                for (const attachment of task.attachments) {
                    if (attachment.docType === 'image') {
                        // Collect image URL
                        imgUrls.push({ imgKey: attachment.docName, imgUrl: attachment.docUrl });
                    } else {
                        // Collect document URL
                        docUrls.push({ docName: attachment.docName, docUrl: attachment.docUrl });
                    }
                }
            }
        }
        res.json({ imgUrls, docUrls });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
};


function isValidObjectId(id) {
    // Check if id is a valid MongoDB ObjectId
    const { ObjectId } = require('mongoose').Types;
    return ObjectId.isValid(id);
}
