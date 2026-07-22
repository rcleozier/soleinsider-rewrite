"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/memberPassword";
import { signIn } from "@/lib/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/" });
}

export async function loginWithCredentials(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Enter your email and password.")}`);
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=${encodeURIComponent("That email and password don't match.")}`);
    }

    throw error;
  }
}

export async function signUpWithCredentials(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) {
    redirect(`/signup?error=${encodeURIComponent("Enter your name.")}`);
  }

  if (!EMAIL_PATTERN.test(email)) {
    redirect(`/signup?error=${encodeURIComponent("Enter a valid email address.")}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent("Password must be at least 8 characters.")}`);
  }

  const existing = await prisma.member.findUnique({ where: { email } });

  if (existing) {
    redirect(`/signup?error=${encodeURIComponent("An account with this email already exists.")}`);
  }

  await prisma.member.create({
    data: {
      email,
      name,
      password: await hashPassword(password),
      phoneNumber: "",
      carrier: 0,
      bouncedEmail: 0,
      verified: Buffer.from([0]),
      updatedAt: new Date(),
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }

    throw error;
  }
}
