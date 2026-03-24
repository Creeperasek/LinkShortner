import Fastify from "fastify";

const dotenv = require("dotenv");
dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(require("./links"));

fastify.register(require("@fastify/mysql"), {
  promise: true,
  connectionString: process.env.MYSQL_CONNECTION_STRING,
});

fastify.get("/status", async (request, reply) => {
  const [rows] = await fastify.mysql.query("SELECT NOW() as now");
  return rows;
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
