import fp from "fastify-plugin";

export default fp(async function (fastify) {
  fastify.decorate("authenticate", async function (request: any, reply: any) {
    try {
      let token = request.cookies.token;
      
      if (!token && request.headers.authorization) {
        token = request.headers.authorization.replace("Bearer ", "");
      }

      if (token) {
        request.headers.authorization = `Bearer ${token}`;
      } else {
        return reply.status(401).send({ error: "Unauthorized: Token missing from request" });
      }

      await request.jwtVerify();
      request.log.info({ user: request.user }, "JWT Verified successfully");
    } catch (err: any) {
      request.log.error({ err: err.message }, "JWT Verification failed");
      return reply.status(401).send({ error: "Unauthorized: " + err.message });
    }
  });
});