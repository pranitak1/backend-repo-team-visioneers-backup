module.exports = (app) => {
    const ai = require("../controllers/ai.controller.js");


    var router = require("express").Router();

    // Create a new Project
    router.post("/createai", ai.create);

    
    app.use("/api", router);
};
