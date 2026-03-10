const express = require("express");
const router = express.Router();
const { handleIdentify } = require("../controllers/identifyController");
const asyncHandler = require("../utils/asyncHandler");

router.post("/", asyncHandler(handleIdentify));

module.exports = router;
