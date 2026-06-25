import { NextResponse } from "next/server";
import { getLog, saveLog } from "@/lib/db";

export const dynamic = "force-dynamic";

/** DELETE /api/log/:entryId — remove a single log entry. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ entryId: string }> }
) {
  const { entryId } = await params;
  const log = await getLog();
  const next = log.filter((e) => e.entryId !== entryId);

  if (next.length === log.length) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await saveLog(next);
  return NextResponse.json({ ok: true });
}
