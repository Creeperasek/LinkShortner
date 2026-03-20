import Fastify from "fastify";

const dotenv = require("dotenv");
dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(require("@fastify/mysql"), {
  promise: true,
  connectionString: process.env.MYSQL_CONNECTION_STRING,
});

fastify.get("/status", async (request, reply) => {
  const [rows] = await fastify.mysql.query("SELECT NOW() as now");
  return rows;
});

fastify.get("/", function (request, reply) {
  reply.send({ hello: "world" });
});

fastify.post("/create-link", async function (request, reply) {
  const { url } = request.body as { url: string };

  if (!url) {
    return reply.status(400).send({ error: "URL is required" });
  }

  const slug = Math.random().toString(36).substring(2, 8);

  try {
    await fastify.mysql.query(
      "INSERT INTO links (original_url, slug) VALUES (?, ?)",
      [url, slug],
    );

    return { original_url: url, slug };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Database insertion failed" });
  }
});

fastify.get("/:slug", async function (request, reply) {
  const { slug } = request.params as { slug: string };

  try {
    const [rows] = await fastify.mysql.query(
      "SELECT original_url FROM links WHERE slug = ?",
      [slug],
    );

    if (rows.length === 0) {
      return reply.status(404).send({ error: "Link not found" });
    }

    const originalUrl = rows[0].original_url;
    return reply.send(originalUrl);
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Database query failed" });
  }
});

fastify.listen({ port: 3000 }, function (err, address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
