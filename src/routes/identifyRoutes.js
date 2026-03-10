const express = require("express");
const router = express.Router();
const { handleIdentify } = require("../controllers/identifyController");

router.post("/", handleIdentify);

module.exports = router;
