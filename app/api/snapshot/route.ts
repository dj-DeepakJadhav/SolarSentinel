import { NextResponse } from "next/server";
import { getSpaceWeatherSnapshot } from "@/src/lib/providers/noaa";

export async function GET() {
  const snapshot = await getSpaceWeatherSnapshot();
  return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
