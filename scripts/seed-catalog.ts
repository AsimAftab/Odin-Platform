/**
 * Seeds / updates the public tool catalog. Upserts by slug so it is safe to
 * re-run. Bun auto-loads .env.local, so MONGODB_URI is available.
 *
 *   bun run seed:catalog
 */
import { connectDB } from "@/lib/db";
import { CatalogTool } from "@/models/CatalogTool";
import { CATALOG_SEED } from "@/lib/catalog-seed";
import mongoose from "mongoose";

async function main() {
  await connectDB();
  let created = 0;
  let updated = 0;

  for (const entry of CATALOG_SEED) {
    const res = await CatalogTool.updateOne(
      { slug: entry.slug },
      { $set: entry },
      { upsert: true }
    );
    if (res.upsertedCount) created++;
    else if (res.modifiedCount) updated++;
  }

  const total = await CatalogTool.countDocuments();
  console.log(
    `Catalog seeded: ${created} created, ${updated} updated, ${total} total tools.`
  );
  await mongoose.connection.close();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
