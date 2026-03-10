const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: [
    { level: "error", emit: "stdout" },
    { level: "warn", emit: "stdout" },
  ],
});

prisma
  .$connect()
  .then(() => console.log("Database connected successfully"))
  .catch((error) => {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  });

module.exports = prisma;
