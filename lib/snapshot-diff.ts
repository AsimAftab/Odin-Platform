import type {
  EnvironmentSection,
  InstalledPackage,
  PackagesSection,
  VsCodeSection,
} from "@/types/snapshot";

// Compares two snapshot payloads and reports what changed between them. Pure and
// defensive: any section may be missing (older snapshots predate some payload
// keys), so every accessor tolerates undefined. Mirrors the set-diff semantics
// of the CLI's `src/services/diff_service.rs`.

export interface DiffChange {
  key: string; // stable identity (package id, extension id, env name)
  name: string; // display label
  from: string; // previous value/version
  to: string; // new value/version
}

export interface SectionDiff<T> {
  added: T[];
  removed: T[];
  changed: DiffChange[];
}

export interface SnapshotDiff {
  packages: SectionDiff<{ key: string; name: string; version: string }>;
  extensions: SectionDiff<{ key: string; name: string; version: string }>;
  environment: SectionDiff<{ key: string; name: string; version: string }>;
  isEmpty: boolean;
}

type SnapshotLike = {
  packages?: unknown;
  vscode?: unknown;
  environment?: unknown;
};

function packageKey(p: InstalledPackage): string {
  return `${p.source ?? "unknown"}:${p.id ?? p.name}`;
}

function diffMaps(
  before: Map<string, { name: string; version: string }>,
  after: Map<string, { name: string; version: string }>
): SectionDiff<{ key: string; name: string; version: string }> {
  const added: { key: string; name: string; version: string }[] = [];
  const removed: { key: string; name: string; version: string }[] = [];
  const changed: DiffChange[] = [];

  for (const [key, a] of after) {
    const b = before.get(key);
    if (!b) added.push({ key, ...a });
    else if (b.version !== a.version)
      changed.push({ key, name: a.name, from: b.version, to: a.version });
  }
  for (const [key, b] of before) {
    if (!after.has(key)) removed.push({ key, ...b });
  }

  const byName = (
    x: { name: string },
    y: { name: string }
  ): number => x.name.localeCompare(y.name);
  added.sort(byName);
  removed.sort(byName);
  changed.sort(byName);
  return { added, removed, changed };
}

function packageMap(
  snap: SnapshotLike
): Map<string, { name: string; version: string }> {
  const list = (snap.packages as PackagesSection | undefined)?.packages ?? [];
  const map = new Map<string, { name: string; version: string }>();
  for (const p of list) {
    map.set(packageKey(p), { name: p.name ?? p.id, version: p.version ?? "" });
  }
  return map;
}

function extensionMap(
  snap: SnapshotLike
): Map<string, { name: string; version: string }> {
  const list = (snap.vscode as VsCodeSection | undefined)?.extensions ?? [];
  const map = new Map<string, { name: string; version: string }>();
  for (const e of list) {
    map.set(e.identifier, { name: e.identifier, version: e.version ?? "" });
  }
  return map;
}

function envMap(
  snap: SnapshotLike
): Map<string, { name: string; version: string }> {
  const list =
    (snap.environment as EnvironmentSection | undefined)?.user_variables ?? [];
  const map = new Map<string, { name: string; version: string }>();
  for (const v of list) {
    // PATH-type vars are noisy and huge; exclude them (matches the vault/detail
    // convention elsewhere in the dashboard). "version" carries the value here.
    if (v.name.toUpperCase().includes("PATH")) continue;
    map.set(v.name, { name: v.name, version: v.value ?? "" });
  }
  return map;
}

/**
 * Diffs snapshot `a` (before) against snapshot `b` (after). Returns per-section
 * added/removed/changed sets plus an `isEmpty` flag when nothing differs.
 */
export function diffSnapshots(a: SnapshotLike, b: SnapshotLike): SnapshotDiff {
  const packages = diffMaps(packageMap(a), packageMap(b));
  const extensions = diffMaps(extensionMap(a), extensionMap(b));
  const environment = diffMaps(envMap(a), envMap(b));

  const isEmpty = [packages, extensions, environment].every(
    (s) => s.added.length === 0 && s.removed.length === 0 && s.changed.length === 0
  );

  return { packages, extensions, environment, isEmpty };
}
