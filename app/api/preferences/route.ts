import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, notifications, notifyMethods, language, consentAI } = body;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const query = `
      INSERT INTO preferences
      (user_id, notifications, notify_methods, language, consent_ai)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) DO UPDATE
        SET notifications = EXCLUDED.notifications,
            notify_methods = EXCLUDED.notify_methods,
            language = EXCLUDED.language,
            consent_ai = EXCLUDED.consent_ai
    `;

    await pool.query(query, [
      userId,
      notifications,
      JSON.stringify(notifyMethods),
      language,
      consentAI,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
