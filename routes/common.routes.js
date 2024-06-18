module.exports = (app) => {
    const commonController = require("../controllers/common.controller.js");

    var router = require("express").Router();

    app.use("/api/get-existing-data", commonController.checkAvailabilityOfData);
};
