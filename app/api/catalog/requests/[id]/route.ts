import { NextRequest, NextResponse } from "next/server";
import { isMaintainer } from "@/lib/maintainer";
import { connectDB } from "@/lib/db";
import { ToolRequest, type RequestStatus } from "@/models/ToolRequest";
import { CatalogTool } from "@/models/CatalogTool";
import { slugify, buildCommand, INSTALL_MANAGERS } from "@/lib/catalog-util";

const STATUSES: RequestStatus[] = [
  "pending",
  "in_progress",
  "needs_correction",
  "verified",
  "approved",
  "rejected",
];

interface InstallInput {
  manager: string;
  packageId: string;
  command?: string;
}

function cleanInstall(raw: unknown): InstallInput[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is InstallInput => !!i && typeof i.manager === "string")
    .filter((i) => INSTALL_MANAGERS.includes(i.manager as never))
    .map((i) => ({
      manager: i.manager,
      packageId: String(i.packageId ?? "").trim(),
      command: typeof i.command === "string" ? i.command.trim() : undefined,
    }))
    .filter((i) => i.packageId.length > 0);
}

// PATCH — maintainer edits fields and/or transitions status. Approving promotes
// the request into the public catalog.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isMaintainer())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  await connectDB();

  const request = await ToolRequest.findById(id);
  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // --- edits ---
  if (typeof body.name === "string" && body.name.trim()) request.name = body.name.trim();
  if (typeof body.description === "string") request.description = body.description.trim();
  if (typeof body.category === "string") request.category = body.category.trim();
  if (typeof body.homepage === "string") request.homepage = body.homepage.trim();
  if (typeof body.correctionNote === "string") request.correctionNote = body.correctionNote.trim();
  if (body.install !== undefined) request.install = cleanInstall(body.install);

  // --- status transition ---
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (body.status === "approved") {
      if (!request.category || request.install.length === 0) {
        return NextResponse.json(
          { error: "Add a category and at least one install source before approving." },
          { status: 400 }
        );
      }

      // Promote into the catalog (upsert by slug).
      const slug = slugify(request.name);
      await CatalogTool.updateOne(
        { slug },
        {
          $set: {
            name: request.name,
            slug,
            category: request.category,
            description: request.description ?? "",
            homepage: request.homepage,
            install: request.install.map((i: InstallInput) => ({
              manager: i.manager,
              packageId: i.packageId,
              command: i.command || buildCommand(i.manager, i.packageId),
            })),
          },
        },
        { upsert: true }
      );
    }

    request.status = body.status;
  }

  await request.save();
  return NextResponse.json({ request: request.toObject() });
}

// DELETE — maintainer removes a request.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isMaintainer())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await connectDB();
  await ToolRequest.deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
