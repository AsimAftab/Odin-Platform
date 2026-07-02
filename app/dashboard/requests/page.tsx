import { redirect } from "next/navigation";
import mongoose from "mongoose";
import { isMaintainer } from "@/lib/maintainer";
import { connectDB } from "@/lib/db";
import { ToolRequest } from "@/models/ToolRequest";
import { RequestsClient, type ToolRequestDTO } from "./requests-client";

export default async function RequestsPage() {
  if (!(await isMaintainer())) redirect("/dashboard");

  await connectDB();

  const docs = await ToolRequest.find({})
    .sort({ status: 1, createdAt: -1 })
    .lean();

  // Resolve requester name/email from Better Auth's `user` collection.
  const ids = Array.from(new Set(docs.map((d) => String(d.userId))))
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const users = ids.length
    ? await mongoose.connection
        .collection("user")
        .find({ _id: { $in: ids } })
        .toArray()
    : [];

  const userMap = new Map(
    users.map((u) => [u._id.toString(), { name: u.name as string, email: u.email as string }])
  );

  const requests: ToolRequestDTO[] = docs.map((d) => {
    const u = userMap.get(String(d.userId));
    return {
      id: String(d._id),
      name: d.name,
      notes: d.notes ?? "",
      description: d.description ?? "",
      category: d.category ?? "",
      homepage: d.homepage ?? "",
      correctionNote: d.correctionNote ?? "",
      install: (d.install ?? []).map(
        (i: { manager: string; packageId: string; command?: string }) => ({
          manager: i.manager,
          packageId: i.packageId,
          command: i.command ?? "",
        })
      ),
      status: d.status,
      createdAt: new Date(d.createdAt).toISOString(),
      requesterName: u?.name ?? "Unknown",
      requesterEmail: u?.email ?? "",
    };
  });

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-yellow-400">Tool Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review tools the community wants added to the catalog.
        </p>
      </div>
      <RequestsClient initialRequests={requests} />
    </div>
  );
}
