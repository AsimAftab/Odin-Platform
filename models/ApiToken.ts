import mongoose, { Schema, Document } from "mongoose";

export interface IApiToken extends Document {
  userId: string;
  label: string;
  tokenHash: string;
  // Public lookup id embedded in newer tokens (`odin_<keyId>_<secret>`), enabling
  // an O(1) `findOne({ keyId })` instead of a linear bcrypt scan. Legacy tokens
  // (`odin_<hex>`) omit this field entirely and fall back to the scan path.
  keyId?: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

const ApiTokenSchema = new Schema<IApiToken>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    tokenHash: { type: String, required: true },
    // Sparse so legacy tokens (which never set keyId) are exempt from the unique
    // constraint — sparse indexes ignore documents missing the field.
    keyId: { type: String, unique: true, sparse: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

export const ApiToken =
  mongoose.models.ApiToken ||
  mongoose.model<IApiToken>("ApiToken", ApiTokenSchema);
