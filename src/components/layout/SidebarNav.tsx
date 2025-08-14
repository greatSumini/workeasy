"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
};

export default function SidebarNav({
  items,
  adminItems,
  showAdmin,
}: {
  items: NavItem[];
  adminItems?: NavItem[];
  showAdmin?: boolean;
}) {
  const pathname = usePathname();

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive =
      pathname === item.href ||
      (pathname?.startsWith(item.href + "/") ?? false);
    return (
      <Link
        key={item.href}
        href={item.href}
        title={item.label}
        aria-label={item.label}
        className={cn(
          "group relative mb-2 block rounded-xl p-3 glass-subtle glass-animation hover:glass",
          isActive && "glass"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <div className="relative inline-block">
          <Icon className="h-5 w-5" />
          {item.badgeCount && item.badgeCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] leading-4 text-gray-900 glass-subtle text-center">
              {item.badgeCount > 99 ? "99+" : item.badgeCount}
            </span>
          )}
        </div>
        <span className="pointer-events-none absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-xs glass-subtle opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-30">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="glass-strong glass-animation rounded-2xl p-2 h-full w-16 flex flex-col items-center relative z-20">
      <div className="mt-2 flex-1">
        {items.map(renderItem)}
        {showAdmin && adminItems && adminItems.length > 0 && (
          <>
            <div className="my-3 h-px w-8 bg-white/30" />
            {adminItems.map(renderItem)}
          </>
        )}
      </div>
    </nav>
  );
}
