const express = require("express");
const cors = require("cors");
require("dotenv").config();

const identifyRoutes = require("./routes/identifyRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/identify", identifyRoutes);

app.get("/", (req, res) => {
  res.send("Bitespeed Identity Reconciliation API");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
