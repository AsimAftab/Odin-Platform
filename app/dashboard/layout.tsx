"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  Package,
  Cpu,
  HeartPulse,
  Settings,
  Monitor,
  SlidersHorizontal,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/snapshots", label: "Snapshots", icon: Clock },
  { href: "/dashboard/tools", label: "Dev Tools", icon: Package },
  { href: "/dashboard/profiles", label: "Profiles", icon: Cpu },
  { href: "/dashboard/health", label: "Health", icon: HeartPulse },
  { href: "/dashboard/config", label: "Config Vault", icon: SlidersHorizontal },
  { href: "/dashboard/machines", label: "Machines", icon: Monitor },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border flex flex-col py-6 px-4 gap-1 shrink-0">
        <div className="flex items-center gap-2 px-2 mb-6">
          <span className="text-xl font-bold tracking-tight text-yellow-400">ᚢ Odin</span>
          <span className="text-xs text-muted-foreground mt-1">Platform</span>
        </div>

        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              pathname === href
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="mt-auto px-2 pt-4 border-t border-border">
          <UserButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
