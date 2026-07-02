import { NextResponse } from "next/server";
import { isMaintainer } from "@/lib/maintainer";

// Lets the dashboard decide whether to show the maintainer-only nav item.
// Access is still enforced server-side on the page and the mutation route.
export async function GET() {
  return NextResponse.json({ isMaintainer: await isMaintainer() });
}
