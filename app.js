require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const cron = require("node-cron");
const uploadController = require("./controllers/upload.controller");
const db = require("./models");
const { updateImageUrls } = require("./services/updateImageUrlsJob");

const app = express();

// use of cookieParser
app.use(cookieParser());

// app.use(cors({ origin: "http://localhost:3000", credentials: true }));
const corsOptions = {
  origin: "https://devtaskwisefrontend.netlify.app", // Replace with your Netlify domain
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.S3_BUCKET ||
  !process.env.MONGODB_URL
) {
  console.error("Environment variables not set properly.");
  process.exit(1);
}

db.mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

app.use("/api/upload", uploadController);
app.use("/api/get-image-url", uploadController);
// Import routes
require("./routes/project.routes")(app);
require("./routes/workspace.routes")(app);
require("./routes/auth.routes")(app);
require("./routes/ai.routes")(app);
require("./routes/notification.routes")(app);
require("./routes/common.routes")(app);

// Schedule the updateImageUrls function to run at midnight every day
cron.schedule(
  "0 0 * * *",
  () => {
    updateImageUrls();
  },
  {
    timezone: "Asia/Kolkata", // Specify your timezone here
  }
);

// Call updateImageUrls once after starting the app
updateImageUrls();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "TaskWise API",
      version: "1.0.0",
      description:
        "TaskWise is a task management API that allows users to manage workspaces, projects, tasks efficiently.",
    },
    servers: [{ url: "http://localhost:8080" }],
  },
  apis: ["./controllers/*.js", "./routes/*.js"],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`TaskWise Server is running on port ${PORT}`);
});
