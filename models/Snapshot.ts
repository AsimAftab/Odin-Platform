import mongoose, { Schema, Document } from "mongoose";

export interface ISnapshot extends Document {
  snapshotId: string; // UUID from odin.lock
  machineId: mongoose.Types.ObjectId;
  userId: string;
  capturedAt: Date;
  tag?: string;
  schemaVersion: number;
  machine: Record<string, unknown>;
  environment: Record<string, unknown>;
  packages: Record<string, unknown>;
  vscode: Record<string, unknown>;
  git: Record<string, unknown>;
  profiles?: Record<string, unknown>;
  lockSha256: string;
  createdAt: Date;
}

const SnapshotSchema = new Schema<ISnapshot>(
  {
    snapshotId: { type: String, required: true, unique: true },
    machineId: { type: Schema.Types.ObjectId, ref: "Machine", required: true },
    userId: { type: String, required: true, index: true },
    capturedAt: { type: Date, required: true },
    tag: { type: String },
    schemaVersion: { type: Number, default: 1 },
    machine: { type: Schema.Types.Mixed, required: true },
    environment: { type: Schema.Types.Mixed, required: true },
    packages: { type: Schema.Types.Mixed, required: true },
    vscode: { type: Schema.Types.Mixed, required: true },
    git: { type: Schema.Types.Mixed, required: true },
    // Optional Asgard profiles summary (CLIs >= 0.8 send it).
    profiles: { type: Schema.Types.Mixed },
    lockSha256: { type: String, required: true },
  },
  { timestamps: true }
);

SnapshotSchema.index({ userId: 1, capturedAt: -1 });
SnapshotSchema.index({ machineId: 1, capturedAt: -1 });

export const Snapshot =
  mongoose.models.Snapshot ||
  mongoose.model<ISnapshot>("Snapshot", SnapshotSchema);
