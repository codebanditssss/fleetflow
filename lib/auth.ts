import { NextRequest } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role, UserSession } from "@/lib/types";

export const SESSION_COOKIE = "fleetflow_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function sessionCookieMaxAge(): number {
  return SESSION_MAX_AGE_SECONDS;
}

export async function loginWithCredentials(email: string, password: string): Promise<{ user: UserSession; token: string } | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) {
    return null;
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return null;
  }

  const token = crypto.randomBytes(48).toString("base64url");
  await prisma.session.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
    }
  });

  return {
    token,
    user: { email: user.email, name: user.name, role: user.role as Role }
  };
}

export async function signupWithCredentials(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}): Promise<{ user: UserSession; token: string } | null> {
  const email = input.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return null;
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const created = await prisma.user.create({
    data: {
      name: input.name.trim(),
      email,
      role: input.role,
      passwordHash
    }
  });
  const token = crypto.randomBytes(48).toString("base64url");
  await prisma.session.create({
    data: {
      token,
      userId: created.id,
      expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000)
    }
  });
  return {
    token,
    user: { email: created.email, name: created.name, role: created.role as Role }
  };
}

export async function readSessionFromRequest(request: NextRequest): Promise<UserSession | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true }
  });
  if (!session) {
    return null;
  }
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }
  return {
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as Role
  };
}

export async function deleteSessionByToken(token: string | undefined): Promise<void> {
  if (!token) {
    return;
  }
  await prisma.session.deleteMany({ where: { token } });
}

export async function requestPasswordReset(email: string): Promise<{ ok: true; token?: string; userFound: boolean }> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) {
    return { ok: true, userFound: false };
  }

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null
    }
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30)
    }
  });

  if (process.env.NODE_ENV !== "production") {
    if (process.env.RESET_EMAIL_ENDPOINT) {
      await fetch(process.env.RESET_EMAIL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          subject: "FleetFlow password reset",
          text: `Your reset token is: ${token}`
        })
      }).catch(() => undefined);
    }
    return { ok: true, token, userFound: true };
  }

  if (process.env.RESET_EMAIL_ENDPOINT) {
    await fetch(process.env.RESET_EMAIL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: user.email,
        subject: "FleetFlow password reset",
        text: `Use this reset token within 30 minutes: ${token}`
      })
    }).catch(() => undefined);
  }
  return { ok: true, userFound: true };
}

export async function resetPassword(input: { token: string; newPassword: string }): Promise<boolean> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: input.token },
    include: { user: true }
  });
  if (!resetToken) {
    return false;
  }
  if (resetToken.usedAt) {
    return false;
  }
  if (resetToken.expiresAt.getTime() < Date.now()) {
    return false;
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { token: input.token },
      data: { usedAt: new Date() }
    }),
    prisma.session.deleteMany({ where: { userId: resetToken.userId } })
  ]);

  return true;
}
