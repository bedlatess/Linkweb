/**
 * Registration API — POST
 *
 * Public endpoint. Creates a new user account with:
 *   - bcrypt password hashing (12 rounds)
 *   - Email + Username uniqueness validation
 *   - Username format validation (alphanumeric + underscore only)
 *   - Reserved username blocklist
 *   - Auto-creates default ThemeConfig (Glassmorphism preset)
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// System reserved usernames — cannot be registered
const RESERVED = new Set([
  "dashboard",
  "auth",
  "api",
  "_next",
  "favicon.ico",
  "public",
  "admin", // legacy admin
  "linkweb",
  "settings",
  "appearance",
  "links",
  "analytics",
]);

// Username regex: letters, numbers, underscores, 3-30 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export async function POST(request: Request) {
  const body = await request.json();
  const { email, username, password } = body;

  // ─── Validation ───
  const errors: string[] = [];

  if (!email || typeof email !== "string" || !email.includes("@")) {
    errors.push("请提供有效的邮箱地址");
  }

  if (!username || typeof username !== "string") {
    errors.push("请提供用户名");
  } else if (!USERNAME_REGEX.test(username)) {
    errors.push("用户名只允许英文字母、数字和下划线，长度 3-30 个字符");
  } else if (RESERVED.has(username.toLowerCase())) {
    errors.push(`用户名 "${username}" 为系统保留字，请使用其他用户名`);
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push("密码长度至少为 6 个字符");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join("；") }, { status: 400 });
  }

  // ─── Uniqueness check ───
  const existingEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingEmail) {
    return NextResponse.json(
      { error: "该邮箱已被注册" },
      { status: 409 }
    );
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username: username.toLowerCase().trim() },
  });

  if (existingUsername) {
    return NextResponse.json(
      { error: "该用户名已被使用" },
      { status: 409 }
    );
  }

  // ─── Create user + default ThemeConfig in a transaction ───
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: email.toLowerCase().trim(),
        username: username.toLowerCase().trim(),
        name: username,
        passwordHash,
      },
    });

    // Auto-create default ThemeConfig (Classic Glassmorphism)
    await tx.themeConfig.create({
      data: {
        userId: newUser.id,
        bgType: "gradient",
        bgValue:
          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        bgBlur: 12,
        buttonStyle: "rounded",
      },
    });

    return newUser;
  });

  return NextResponse.json(
    {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    },
    { status: 201 }
  );
}