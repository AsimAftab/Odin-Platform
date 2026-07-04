import mongoose, { Schema, Document } from "mongoose";

/**
 * Fixed-window rate-limit counter. One document per (key, window-start). The
 * document self-expires via a TTL index on `expiresAt`, so old windows are
 * reaped automatically — no cleanup job needed.
 *
 * Mongo-backed (not in-memory) on purpose: serverless instances don't share
 * memory, so a per-process map would let each cold start reset the limit.
 */
export interface IRateLimit extends Document {
  key: string; // `${bucket}:${identifier}:${windowStart}`
  count: number;
  expiresAt: Date;
}

const RateLimitSchema = new Schema<IRateLimit>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true },
});

// TTL index: Mongo removes the counter once its window has fully elapsed.
RateLimitSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimit =
  mongoose.models.RateLimit ||
  mongoose.model<IRateLimit>("RateLimit", RateLimitSchema);
