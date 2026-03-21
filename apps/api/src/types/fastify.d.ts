import "fastify";
import { Session, User } from "auth";


declare module "fastify" {
  interface FastifyRequest {
    user: any
    session: any
  }
}