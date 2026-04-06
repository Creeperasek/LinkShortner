import { FastifyInstance } from "fastify";
import bcrypt from "bcrypt";
import { isValidEmail, isValidPassword } from "../utils/validators";

type RegisterBody = {
  email: string;
  password: string;
};

type LoginBody = {
  email: string;
  password: string;
};

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: RegisterBody }>("/register", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required" });
    }

    if (!isValidEmail(email)) {
      return reply.status(400).send({ error: "Invalid email format" });
    }

    if (!isValidPassword(password)) {
      return reply.status(400).send({ error: "Password must be at least 6 characters long" });
    }

    try {
      const [rows] = await fastify.mysql.query(
        "SELECT id FROM users WHERE email = ?",
        [email]
      );

      if ((rows as any[]).length > 0) {
        return reply.status(400).send({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [result] = await fastify.mysql.query(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        [email, hashedPassword]
      );

      return reply.status(201).send({
        message: "User registered successfully",
        userId: (result as any).insertId
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Registration failed" });
    }
  });

  fastify.post<{ Body: LoginBody }>("/login", async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.status(400).send({ error: "Email and password are required" });
    }

    try {
      const [rows] = await fastify.mysql.query(
        "SELECT id, email, password FROM users WHERE email = ?",
        [email]
      );

      const users = rows as { id: number; email: string; password: string }[];

      if (users.length === 0) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return reply.status(401).send({ error: "Invalid credentials" });
      }

      const token = fastify.jwt.sign(
        { id: user.id, email: user.email },
        { expiresIn: "7d" }
      );

      reply.setCookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      });

      return {
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Login failed" });
    }
  });

  fastify.post("/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return { message: "Logout successful" };
  });

  fastify.get(
    "/me",
    { preHandler: [fastify.authenticate] },
    async (request: any) => {
      return {
        user: {
          id: request.user.id,
          email: request.user.email
        }
      };
    }
  );
}