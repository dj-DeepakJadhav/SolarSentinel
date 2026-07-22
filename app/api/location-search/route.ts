import { NextRequest, NextResponse } from "next/server";
import { searchGlobalLocations } from "@/src/lib/geocoding";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  try {
    return NextResponse.json({ results: await searchGlobalLocations(query) });
  } catch {
    return NextResponse.json({ results: [], status: "unavailable" }, { status: 503 });
  }
}
