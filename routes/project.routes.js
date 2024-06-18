module.exports = (app) => {
    const project = require("../controllers/project.controller.js");
    const board = require("../controllers/board.controller.js");
    const task = require("../controllers/task.controller.js");

    var router = require("express").Router();

    // Create a new Project
    router.post("/projects", project.create);

    // Get a project by id
    router.get("/projects/:id", project.getProjectById);

    // Update a project by ID
    router.put('/projects/:id', project.updateProjectById);

    // Deactivate a project by ID
    router.patch('/projects/:id/deactivate', project.deactivateProjectById);

    // Route to add a new column to a project
    router.post('/projects/:projectId/columns', board.addColumnToProject);

    // Route to update a column in a project
    router.put('/projects/:projectId/columns/:columnId', board.updateColumn);

    // Route to Deactivate a column from a project
    router.patch('/projects/:projectId/columns/:columnId/deactivate', board.deactivateColumn);

    //Route to change column order
    router.put('/projects/:projectId/order', board.updateColumnOrder);

    // Route to move a task from one column to another
    router.put("/projects/:projectId/tasks/:taskId/move", board.moveTaskToAnotherColumn);

    // Route to add a new task to a project
    router.post('/projects/:projectId/tasks', task.addTaskToProject);

    // Route to update a task in a project
    router.put("/projects/:projectId/tasks/:taskId", task.updateTaskInProject);

    // Route to Deactivate a task from a project
    router.put("/projects/:projectId/tasks/:taskId/deactivate", task.deactivateTaskInProject);

    router.post("/projects/createAI",project.createAI)

    app.use("/api", router);
};
