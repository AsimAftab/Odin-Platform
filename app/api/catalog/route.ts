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

  // Bound the result set. The catalog is curated and small today, but keep it
  // from growing unbounded on the wire; callers can page with ?page=.
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "200") || 200, 1),
    500
  );
  const page = Math.max(parseInt(searchParams.get("page") ?? "1") || 1, 1);

  const [tools, total] = await Promise.all([
    CatalogTool.find(query)
      .select("name slug category description homepage install notes")
      .sort({ category: 1, name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CatalogTool.countDocuments(query),
  ]);

  return NextResponse.json({ tools, total, page, limit });
}
