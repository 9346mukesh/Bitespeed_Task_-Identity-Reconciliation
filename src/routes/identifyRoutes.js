const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
  res.json({ message: "Identify endpoint - coming soon" });
});

module.exports = router;
