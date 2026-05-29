import { FastifyInstance } from "fastify";
import { generateSlug, isValidSlug, isValidUrl } from "../utils/validators";

type CreateLinkBody = {
  url: string;
  expiresAt?: string | null;
};

type SlugParams = {
  slug: string;
};

type CustomSlugParams = {
  customSlug?: string;
};

const linkCache = new Map<string, { id: number; original_url: string; is_active: number; expires_at: string | null }>();

export default async function linksRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateLinkBody }>(
    "/links",
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const userId = request.user.id;
      const { url, expiresAt } = request.body;

      if (!url) {
        return reply.status(400).send({ error: "URL is required" });
      }

      if (!isValidUrl(url)) {
        return reply.status(400).send({ error: "Invalid URL" });
      }

      let slug = generateSlug(6);
      let created = false;
      let attempts = 0;

      while (!created && attempts < 10) {
        try {
          await fastify.mysql.query(
            "INSERT INTO links (original_url, slug, user_id, is_custom, expires_at) VALUES (?, ?, ?, 0, ?)",
            [url, slug, userId, expiresAt || null]
          );
          created = true;
        } catch (error: any) {
          if (error.code === "ER_DUP_ENTRY") {
            slug = generateSlug(6);
            attempts++;
          } else {
            fastify.log.error(error);
            return reply.status(500).send({ error: "Database insertion failed" });
          }
        }
      }

      if (!created) {
        return reply.status(500).send({ error: "Could not generate unique slug" });
      }

      return {
        original_url: url,
        slug,
        short_url: `${process.env.BASE_URL}/r/${slug}`,
        is_custom: false
      };
    }
  );

  fastify.post<{ Params: CustomSlugParams; Body: CreateLinkBody }>(
    "/links/custom/:customSlug",
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const userId = request.user.id;
      const { customSlug } = request.params;
      const { url, expiresAt } = request.body;

      if (!url) {
        return reply.status(400).send({ error: "URL is required" });
      }

      if (!customSlug) {
        return reply.status(400).send({ error: "Custom slug is required" });
      }

      if (!isValidUrl(url)) {
        return reply.status(400).send({ error: "Invalid URL" });
      }

      if (!isValidSlug(customSlug)) {
        return reply.status(400).send({
          error: "Custom slug must be 3-32 chars, letters/numbers/_/- only"
        });
      }

      try {
        const [existingRows] = await fastify.mysql.query(
          "SELECT slug FROM links WHERE slug = ?",
          [customSlug]
        );

        if ((existingRows as any[]).length > 0) {
          return reply.status(400).send({ error: "Custom slug already exists" });
        }

        await fastify.mysql.query(
          "INSERT INTO links (original_url, slug, user_id, is_custom, expires_at) VALUES (?, ?, ?, 1, ?)",
          [url, customSlug, userId, expiresAt || null]
        );

        return {
          original_url: url,
          slug: customSlug,
          short_url: `${process.env.BASE_URL}/r/${customSlug}`,
          is_custom: true
        };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Database insertion failed" });
      }
    }
  );

  fastify.get(
    "/links",
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const userId = request.user.id;

      try {
        const [rows] = await fastify.mysql.query(
          `SELECT id, original_url, slug, click_count, is_custom, is_active, expires_at, created_at
           FROM links
           WHERE user_id = ?
           ORDER BY created_at DESC`,
          [userId]
        );

        return { links: rows };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch links" });
      }
    }
  );

  fastify.get<{ Params: SlugParams }>(
    "/links/:slug/history",
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const userId = request.user.id;
      const { slug } = request.params;

      try {
        const [rows] = await fastify.mysql.query(
          `SELECT DATE(c.clicked_at) as date, COUNT(*) as count
           FROM clicks c
           JOIN links l ON c.link_id = l.id
           WHERE l.slug = ? AND l.user_id = ?
           GROUP BY DATE(c.clicked_at)
           ORDER BY date ASC`,
          [slug, userId]
        );

        return { history: rows };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch history" });
      }
    }
  );

  fastify.get<{ Params: SlugParams }>(
    "/links/:slug/stats",
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const userId = request.user.id;
      const { slug } = request.params;

      try {
        const [rows] = await fastify.mysql.query(
          `SELECT id, original_url, slug, click_count, is_custom, is_active, expires_at, created_at
           FROM links
           WHERE slug = ? AND user_id = ?`,
          [slug, userId]
        );

        const results = rows as any[];

        if (results.length === 0) {
          return reply.status(404).send({ error: "Link not found" });
        }

        return { link: results[0] };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch stats" });
      }
    }
  );

  fastify.delete<{ Params: SlugParams }>(
    "/links/:slug",
    { preHandler: [fastify.authenticate] },
    async (request: any, reply) => {
      const userId = request.user.id;
      const { slug } = request.params;

      try {
        const [result] = await fastify.mysql.query(
          "DELETE FROM links WHERE slug = ? AND user_id = ?",
          [slug, userId]
        );

        if ((result as any).affectedRows === 0) {
          return reply.status(404).send({ error: "Link not found" });
        }
        
        linkCache.delete(slug);
        return { message: "Link deleted successfully" };
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ error: "Delete failed" });
      }
    }
  );

  fastify.get<{ Params: SlugParams }>("/r/:slug", async (request, reply) => {
    const { slug } = request.params;

    try {
      let link: { id: number; original_url: string; is_active: number; expires_at: string | null } | undefined;

      if (linkCache.has(slug)) {
        fastify.log.info(`Cache hit: ${slug}`);
        link = linkCache.get(slug);
      } else {
        const [rows] = await fastify.mysql.query(
          `SELECT id, original_url, is_active, expires_at
           FROM links
           WHERE slug = ?`,
          [slug]
        );

        const results = rows as {
          id: number;
          original_url: string;
          is_active: number;
          expires_at: string | null;
        }[];

        if (results.length === 0) {
          return reply.status(404).send({ error: "Link not found" });
        }
        
        link = results[0];
        linkCache.set(slug, link);
      }

      if (link!.is_active === 0) {
        linkCache.delete(slug);
        return reply.status(410).send({ error: "Link is inactive" });
      }

      if (link!.expires_at && new Date(link!.expires_at) < new Date()) {
        linkCache.delete(slug);
        return reply.status(410).send({ error: "Link has expired" });
      }

      await Promise.all([
        fastify.mysql.query(
          "UPDATE links SET click_count = click_count + 1 WHERE id = ?",
          [link!.id]
        ),
        fastify.mysql.query(
          "INSERT INTO clicks (link_id) VALUES (?)",
          [link!.id]
        )
      ]);

      reply.redirect(link!.original_url);
      return;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Database query failed" });
    }
  });
}
