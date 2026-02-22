import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

async function ensureAdminExists() {
  try {
    const count = await prisma.user.count();
    if (count === 0 && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await prisma.user.create({
        data: {
          email: process.env.ADMIN_EMAIL.toLowerCase().trim(),
          name: "Admin",
          hashedPassword: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
          role: "ADMIN",
          status: "ACTIVE",
        },
      });
      console.log("✅ Auto-created admin:", process.env.ADMIN_EMAIL);
    }
  } catch (e) {
    // Table might not exist yet on very first cold start — ignore
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) throw new Error("Email and password required");
        // Auto-seed admin if first time
        await ensureAdminExists();
        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase().trim() } });
        if (!user) throw new Error("Invalid email or password");
        if (user.status === "SUSPENDED") throw new Error("Account suspended. Contact your administrator.");
        if (user.status === "PENDING") throw new Error("Account pending approval.");
        if (!(await bcrypt.compare(credentials.password, user.hashedPassword))) throw new Error("Invalid email or password");
        await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = (user as any).role; token.status = (user as any).status; }
      return token;
    },
    async session({ session, token }) {
      if (session.user) { (session.user as any).id = token.id; (session.user as any).role = token.role; (session.user as any).status = token.status; }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
