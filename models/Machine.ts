import mongoose, { Schema, Document } from "mongoose";

export interface IMachine extends Document {
  userId: string;
  hostname: string;
  osName: string;
  osVersion: string;
  username: string;
  lastSeenAt: Date;
  createdAt: Date;
}

const MachineSchema = new Schema<IMachine>(
  {
    userId: { type: String, required: true, index: true },
    hostname: { type: String, required: true },
    osName: { type: String, default: "Windows" },
    osVersion: { type: String, default: "" },
    username: { type: String, default: "" },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MachineSchema.index({ userId: 1, hostname: 1 }, { unique: true });

export const Machine =
  mongoose.models.Machine ||
  mongoose.model<IMachine>("Machine", MachineSchema);
