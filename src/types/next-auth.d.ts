import { DefaultSession, DefaultUser } from "next-auth";
declare module "next-auth" {
  interface Session { user: { id: string; role: "USER"|"ADMIN"; status: "ACTIVE"|"SUSPENDED"|"PENDING" } & DefaultSession["user"] }
  interface User extends DefaultUser { role: "USER"|"ADMIN"; status: "ACTIVE"|"SUSPENDED"|"PENDING" }
}
declare module "next-auth/jwt" {
  interface JWT { id: string; role: "USER"|"ADMIN"; status: "ACTIVE"|"SUSPENDED"|"PENDING" }
}
