import { NextResponse } from "next/server";
import { getMay2024Replay } from "@/src/lib/providers/donki";

export async function GET() { return NextResponse.json(await getMay2024Replay()); }
