const mongoose = require('mongoose');

// Function to get the model dynamically
const getModel = (collectionName) => {
    return mongoose.model(collectionName);
};

/**
 * @swagger
 * /api/get-existing-data:
 *   get:
 *     summary: Retrieve a list of key values from a specified collection
 *     description: This endpoint returns an array of values for a specified key from a given collection.
 *     tags:
 *       - Common
 *     parameters:
 *       - in: query
 *         name: collection
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the collection to query
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         required: true
 *         description: The key whose values need to be retrieved
 *     responses:
 *       200:
 *         description: A list of key values
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *                 example: "Sample value"
 *       400:
 *         description: Missing required parameters (collection or key)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Collection name and key are required"
 *       404:
 *         description: Collection not found or no records found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   examples:
 *                     collectionNotFound:
 *                       value: "Collection not found"
 *                     noRecordsFound:
 *                       value: "No records found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred while fetching records"
 */
exports.checkAvailabilityOfData = async (req, res) => {
    const { collection, key } = req.query;

    if (!collection || !key) {
        return res.status(400).json({ error: 'Collection name and key are required' });
    }

    try {
        const Model = getModel(collection);

        if (!Model) {
            return res.status(404).json({ error: 'Collection not found' });
        }

        // Check if the collection has an isActive field
        const schemaPaths = Model.schema.paths;
        const isActiveFieldExists = !!schemaPaths['isActive'];

        // Query based on the presence of isActive field
        const query = isActiveFieldExists ? { isActive: true } : {};
        const projection = { [key]: 1, _id: 0 };

        const records = await Model.find(query, projection);

        const keyValues = records.map(record => record[key]);
        
        return res.status(200).json(keyValues);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while fetching records' });
    }
};

