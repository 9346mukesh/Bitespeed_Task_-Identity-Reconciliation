const { identifyContact } = require("../services/identifyService");
const { AppError } = require("../utils/errorHandler");

async function handleIdentify(req, res) {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    throw new AppError("At least one of email or phoneNumber is required", 400);
  }

  const result = await identifyContact({ email, phoneNumber });
  return res.status(200).json(result);
}

module.exports = { handleIdentify };
