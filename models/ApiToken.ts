import mongoose, { Schema, Document } from "mongoose";

export interface IApiToken extends Document {
  userId: string;
  label: string;
  tokenHash: string;
  lastUsedAt?: Date;
  createdAt: Date;
}

const ApiTokenSchema = new Schema<IApiToken>(
  {
    userId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    tokenHash: { type: String, required: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

export const ApiToken =
  mongoose.models.ApiToken ||
  mongoose.model<IApiToken>("ApiToken", ApiTokenSchema);
