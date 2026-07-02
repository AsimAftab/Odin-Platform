import mongoose, { Schema, Document } from "mongoose";

export interface IToolRequest extends Document {
  name: string;
  notes?: string;
  userId: string; // Better Auth user id of the requester
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ToolRequestSchema = new Schema<IToolRequest>(
  {
    name: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    userId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

export const ToolRequest =
  mongoose.models.ToolRequest ||
  mongoose.model<IToolRequest>("ToolRequest", ToolRequestSchema);
