import mongoose, { Schema, Document } from "mongoose";

export interface ICatalogInstall {
  manager: string; // winget | chocolatey | scoop | npm | manual ...
  command: string; // full install command
}

export interface ICatalogTool extends Document {
  name: string;
  slug: string;
  category: string;
  description: string;
  homepage?: string;
  install: ICatalogInstall[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InstallSchema = new Schema<ICatalogInstall>(
  {
    manager: { type: String, required: true },
    command: { type: String, required: true },
  },
  { _id: false }
);

const CatalogToolSchema = new Schema<ICatalogTool>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    homepage: { type: String },
    install: { type: [InstallSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true }
);

CatalogToolSchema.index({ name: "text", description: "text" });

export const CatalogTool =
  mongoose.models.CatalogTool ||
  mongoose.model<ICatalogTool>("CatalogTool", CatalogToolSchema);
