import mongoose, { Schema, Document } from "mongoose";

export type RequestStatus =
  | "pending"
  | "in_progress"
  | "needs_correction"
  | "verified"
  | "approved"
  | "rejected";

export interface IRequestInstall {
  manager: string; // winget | chocolatey | scoop | npm | manual
  packageId: string; // e.g. Neovim.Neovim (structured — CLI builds the command)
  command?: string; // optional override; otherwise derived from manager + packageId
}

export interface IToolRequest extends Document {
  name: string;
  notes?: string; // requester's original note
  userId: string; // Better Auth user id of the requester

  // Maintainer-curated fields (edited during the workflow, promoted on approval)
  description?: string;
  category?: string;
  homepage?: string;
  install: IRequestInstall[];
  correctionNote?: string; // message shown when status = needs_correction

  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

const RequestInstallSchema = new Schema<IRequestInstall>(
  {
    manager: { type: String, required: true },
    packageId: { type: String, required: true },
    command: { type: String },
  },
  { _id: false }
);

const ToolRequestSchema = new Schema<IToolRequest>(
  {
    name: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    userId: { type: String, required: true, index: true },

    description: { type: String, trim: true },
    category: { type: String, trim: true },
    homepage: { type: String, trim: true },
    install: { type: [RequestInstallSchema], default: [] },
    correctionNote: { type: String, trim: true },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "needs_correction",
        "verified",
        "approved",
        "rejected",
      ],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const ToolRequest =
  mongoose.models.ToolRequest ||
  mongoose.model<IToolRequest>("ToolRequest", ToolRequestSchema);
