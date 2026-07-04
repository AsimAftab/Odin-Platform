import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { validateApiToken } from "@/lib/api-token";
import mongoose from "mongoose";

// Bearer-authenticated identity probe for the Odin CLI. Lets `odin login` /
// `odin config status` confirm a token works and show "Connected as <email>"
// without performing a snapshot upload. Read-only; no side effects.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  await connectDB();
  const userId = await validateApiToken(authHeader.slice(7));
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Best-effort identity from Better Auth's `user` collection (same database).
  let email: string | null = null;
  let name: string | null = null;
  try {
    const db = mongoose.connection.db;
    if (db) {
      const _id = mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;
      const doc = await db
        .collection("user")
        .findOne({ _id: _id as unknown as object });
      email = (doc?.email as string) ?? null;
      name = (doc?.name as string) ?? null;
    }
  } catch {
    // Identity lookup is optional — the token is already validated.
  }

  return NextResponse.json({ ok: true, userId, email, name });
}
