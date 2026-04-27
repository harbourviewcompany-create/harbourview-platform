import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "harbourview-public-site",
    timestamp: new Date().toISOString(),
  });
}
