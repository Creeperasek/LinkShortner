import Fastify from "fastify";
import dotenv from "dotenv";
import mysql from "@fastify/mysql";
import cookie from "@fastify/cookie";
import jwt from "@fastify/jwt";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth";
import authRoutes from "./routes/auth";
import linksRoutes from "./routes/links";

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
  ],
  credentials: true,
});

fastify.register(mysql, {
  promise: true,
  connectionString: process.env.MYSQL_CONNECTION_STRING,
});

fastify.register(cookie);

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || "supersecret",
  verify: {
    extractToken: (request) => {
      return (
        request.cookies.token ||
        request.headers.authorization?.replace("Bearer ", "")
      );
    },
  },
});

fastify.register(authPlugin);

fastify.after(() => {
  fastify.register(authRoutes, { prefix: "/auth" });
  fastify.register(linksRoutes);
});

fastify.get("/status", async (_request, reply) => {
  try {
    const [rows] = await fastify.mysql.query("SELECT NOW() as now");
    return {
      status: "ok",
      db: "connected",
      time: (rows as any[])[0].now,
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ status: "error", db: "disconnected" });
  }
});

const port = Number(process.env.PORT || 8080);

fastify.listen({ port, host: "0.0.0.0" }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.info(`Server listening at ${address}`);
});
