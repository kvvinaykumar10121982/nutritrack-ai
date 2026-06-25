import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** DELETE /api/log/:entryId — remove a single log entry. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  const db = await getDb();
  const before = db.data.log.length;
  db.data.log = db.data.log.filter((e) => e.entryId !== entryId);

  if (db.data.log.length === before) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await db.write();
  return NextResponse.json({ ok: true });
}
