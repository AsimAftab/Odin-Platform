import mongoose, { Schema, Document } from "mongoose";

/**
 * Per-user preferences. Currently just snapshot retention. One document per
 * user, keyed by the Better Auth user id.
 */
export interface IUserSettings extends Document {
  userId: string;
  // Max snapshots to keep per machine. 0 = keep everything (default). Enforced
  // opportunistically at ingest time.
  retentionPerMachine: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: { type: String, required: true, unique: true },
    retentionPerMachine: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const UserSettings =
  mongoose.models.UserSettings ||
  mongoose.model<IUserSettings>("UserSettings", UserSettingsSchema);
