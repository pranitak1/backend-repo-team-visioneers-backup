const dotenv = require("dotenv").config();
const dbURL = process.env.MONGODB_URL;

module.exports = {
  url: dbURL
};
