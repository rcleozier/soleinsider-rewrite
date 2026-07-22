import { randomUUID } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/memberPassword";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel preview/production URLs and the soleinsider.com custom domain are
  // both valid hosts for this app, so the callback URL can't be pinned to one
  // AUTH_URL — trust whatever host the request actually arrived on instead.
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) {
          return null;
        }

        const member = await prisma.member.findUnique({ where: { email } });

        if (!member || !(await verifyPassword(password, member.password))) {
          return null;
        }

        return {
          id: String(member.id),
          email: member.email,
          name: member.name,
          image: member.profileImage,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.trim().toLowerCase();

      if (!email) {
        return false;
      }

      // Google-authenticated members never use the password column, but it's
      // NOT NULL on the legacy `members` table — fill it with an unusable
      // random hash so the row still satisfies the schema.
      await prisma.member.upsert({
        where: { email },
        update: {
          name: user.name || undefined,
          profileImage: user.image || undefined,
          updatedAt: new Date(),
        },
        create: {
          email,
          name: user.name || null,
          password: await hashPassword(randomUUID()),
          phoneNumber: "",
          carrier: 0,
          bouncedEmail: 0,
          verified: Buffer.from([1]),
          profileImage: user.image || "default.png",
          updatedAt: new Date(),
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const member = await prisma.member.findUnique({ where: { email: user.email.toLowerCase() } });

        if (member) {
          token.memberId = member.id;
          token.name = member.name;
          token.picture = member.profileImage;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.memberId ? String(token.memberId) : "";
      }

      return session;
    },
  },
});
