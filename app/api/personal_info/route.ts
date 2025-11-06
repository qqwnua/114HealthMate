import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { userId, name, gender, birthdate, address, avatarUrl } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 將空字串轉成 null
    birthdate = birthdate && birthdate.trim() !== "" ? birthdate : null;
    avatarUrl = avatarUrl && avatarUrl.trim() !== "" ? avatarUrl : null;

    const query = `
      INSERT INTO personal_info (user_id, name, gender, birthdate, address, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id) DO UPDATE
        SET name = EXCLUDED.name,
            gender = EXCLUDED.gender,
            birthdate = EXCLUDED.birthdate,
            address = EXCLUDED.address,
            avatar_url = EXCLUDED.avatar_url
    `;

    await pool.query(query, [userId, name, gender, birthdate, address, avatarUrl]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
