import { Server } from "http";
import { env } from "./config/env.js";
import app from "./app.js";
import prisma from "./config/prisma.js";

process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

const PORT = env.PORT || 5000;
const DB_URI = env.DB_URI;

let server: Server;
async function startServer(): Promise<void> {
  try {
    // Connect to Prisma DB first
    await prisma.$connect();
    console.log("Database connection established successfully.");

    // Start Express Application
    const PORT = env.PORT || 5000;
    server = app.listen(PORT, () => {
      console.log(`Server running in [${env.NODE_ENV}] mode on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to the database:", error);
    process.exit(1);
  }
}

startServer();

process.on("unhandledRejection", (err: any) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(err?.name, err?.message);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});
