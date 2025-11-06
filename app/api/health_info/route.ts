import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bloodType, chronicDiseases, allergies, medications, familyHistory, height, weight } = body;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const query = `
      INSERT INTO health_info 
      (user_id, blood_type, chronic_diseases, allergies, medications, family_history, height, weight)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE
        SET blood_type = EXCLUDED.blood_type,
            chronic_diseases = EXCLUDED.chronic_diseases,
            allergies = EXCLUDED.allergies,
            medications = EXCLUDED.medications,
            family_history = EXCLUDED.family_history,
            height = EXCLUDED.height,
            weight = EXCLUDED.weight
    `;

    await pool.query(query, [
      userId,
      bloodType,
      JSON.stringify(chronicDiseases),
      JSON.stringify(allergies),
      medications,
      JSON.stringify(familyHistory),
      height,
      weight,
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
