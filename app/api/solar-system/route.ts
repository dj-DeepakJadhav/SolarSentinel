import { NextResponse } from "next/server";
import { getSolarSystemSnapshot } from "@/src/lib/providers/horizons";

export async function GET() {
  return NextResponse.json(await getSolarSystemSnapshot(), { headers: { "Cache-Control": "public, max-age=300, s-maxage=900" } });
}
