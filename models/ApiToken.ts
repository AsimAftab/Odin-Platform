import mongoose, { Schema, Document } from "mongoose";

export interface IApiToken extends Document {
  userId: string;
  label: string;
  tokenHash: string;
  // Public lookup id embedded in every token (`odin_<keyId>_<secret>`), enabling
  // an O(1) `findOne({ keyId })` at validation instead of a bcrypt scan.
  keyId: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

const ApiTokenSchema = new Schema<IApiToken>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    tokenHash: { type: String, required: true },
    keyId: { type: String, required: true, unique: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

export const ApiToken =
  mongoose.models.ApiToken ||
  mongoose.model<IApiToken>("ApiToken", ApiTokenSchema);
