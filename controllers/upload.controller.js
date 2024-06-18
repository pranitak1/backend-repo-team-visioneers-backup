const express = require("express");
const multer = require('multer');
const AWS = require('aws-sdk');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.S3_REGION,
  signatureVersion: 'v4'
});

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         presignedUrl:
 *           type: string
 */

/**
 * @swagger
 * /api/upload:
 *   post:
 *     summary: Uploads a file to Amazon S3 and returns a presigned URL
 *     tags: [Integrate]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       '200':
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FileUploadResponse'
 *       '400':
 *         description: No file uploaded
 *       '500':
 *         description: Error uploading file to S3
 */
router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  const bucketName = process.env.S3_BUCKET;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  const params = {
    Bucket: bucketName,
    Key: `${Date.now().toString()}-${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3.upload(params).promise();

    const presignedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: params.Key,
      Expires: 172800 // Expiry duration in seconds (48 hours)
    });

    res.status(200).send({ 
      message: 'File uploaded to S3 successfully!',
      presignedUrl: presignedUrl,
      imgKey: params.Key
    });
  } catch (error) {
    console.error('S3 upload error:', error.message); // Logging the actual error message
    res.status(500).send('Error uploading file to S3: ' + error.message); // Sending detailed error message
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     FileUploadResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         presignedUrl:
 *           type: string
 */

/**
 * @swagger
 * /api/get-image-url:
 *   get:
 *     summary: Generates a new pre-signed URL for accessing an image from Amazon S3
 *     tags: [Integrate]
 *     parameters:
 *       - in: query
 *         name: key
 *         required: true
 *         description: The key of the image object in S3
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Pre-signed URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 presignedUrl:
 *                   type: string
 *                 imgKey:
 *                   type: string
 *       '400':
 *         description: Missing or invalid query parameters
 *       '500':
 *         description: Error generating pre-signed URL
 */
router.get('/', async (req, res) => {
  const { key } = req.query;
  const bucketName = process.env.S3_BUCKET;

  if (!key) {
    return res.status(400).send('Missing key parameter.');
  }

  try {
    const presignedUrl = await s3.getSignedUrlPromise('getObject', {
      Bucket: bucketName,
      Key: key,
      Expires: 172800 // Expiry duration in seconds (48 hours)
    });

    res.status(200).send({ 
      presignedUrl: presignedUrl,
      imgKey: key
    });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    res.status(500).send('Error generating pre-signed URL.');
  }
});

module.exports = router;