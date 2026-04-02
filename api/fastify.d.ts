import "fastify";
import "@fastify/mysql";
import "@fastify/jwt";

declare module "fastify" {
  interface FastifyInstance {
    mysql: any;
    authenticate: any;
  }
}