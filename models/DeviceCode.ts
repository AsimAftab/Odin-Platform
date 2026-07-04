import mongoose, { Schema, Document } from "mongoose";

/**
 * OAuth 2.0 Device Authorization Grant (RFC 8628) record. Created when the
 * Odin CLI runs `odin login`, approved/denied by the signed-in user on the
 * `/activate` page, and polled by the CLI at `POST /api/device/token` until a
 * bearer token is issued. Records are short-lived and self-expire via a TTL
 * index on `expiresAt`.
 */
export interface IDeviceCode extends Document {
  deviceCode: string;
  userCode: string;
  status: "pending" | "approved" | "denied";
  userId?: string;
  userEmail?: string;
  label?: string;
  tokenIssued: boolean;
  interval: number;
  lastPolledAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const DeviceCodeSchema = new Schema<IDeviceCode>(
  {
    // High-entropy secret held only by the CLI; used to poll for the token.
    deviceCode: { type: String, required: true, unique: true, index: true },
    // Short human code (XXXX-XXXX) the user confirms in the browser.
    userCode: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "denied"],
      default: "pending",
    },
    // Set on approval — the token is minted for this Better Auth user.
    userId: { type: String },
    userEmail: { type: String },
    // Device label sent by the CLI (typically the machine hostname).
    label: { type: String },
    // Ensures the access token is returned to the CLI exactly once.
    tokenIssued: { type: Boolean, default: false },
    // Minimum seconds between CLI polls (RFC 8628 `interval`).
    interval: { type: Number, default: 5 },
    lastPolledAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// TTL index: Mongo removes the record once `expiresAt` passes.
DeviceCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const DeviceCode =
  mongoose.models.DeviceCode ||
  mongoose.model<IDeviceCode>("DeviceCode", DeviceCodeSchema);
