import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { CatalogTool } from "@/models/CatalogTool";
import { ensureCatalogSeeded } from "@/lib/ensure-catalog";

// Public: browse the tool catalog. Also consumable by the Odin CLI.
// Optional ?q= full-text-ish search and ?category= filter.
export async function GET(req: NextRequest) {
  await connectDB();
  await ensureCatalogSeeded();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();

  const query: Record<string, unknown> = {};
  if (category) query.category = category;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: rx }, { description: rx }, { slug: rx }];
  }

  const tools = await CatalogTool.find(query)
    .select("name slug category description homepage install notes")
    .sort({ category: 1, name: 1 })
    .lean();

  return NextResponse.json({ tools });
}
