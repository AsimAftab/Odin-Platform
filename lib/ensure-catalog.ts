import { CatalogTool } from "@/models/CatalogTool";
import { CATALOG_SEED } from "@/lib/catalog-seed";

// In-memory guard so a warm serverless instance only checks once.
let checked = false;

/**
 * Populates the catalog with the curated starter set the first time it's found
 * empty, so a fresh deploy has data with no manual step. Re-running the
 * `seed:catalog` script is still the way to update/extend entries.
 */
export async function ensureCatalogSeeded() {
  if (checked) return;
  try {
    const count = await CatalogTool.estimatedDocumentCount();
    if (count === 0) {
      // ordered:false + catch tolerates a race between concurrent cold starts
      // (unique slug index rejects duplicates without aborting the batch).
      await CatalogTool.insertMany(CATALOG_SEED, { ordered: false }).catch(() => {});
    }
    checked = true;
  } catch {
    // don't cache failures — allow a retry on the next request
  }
}
