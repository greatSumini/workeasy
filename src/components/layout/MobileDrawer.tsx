"use client";

import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export default function MobileDrawer({
  items,
  adminItems,
  showAdmin,
}: {
  items: NavItem[];
  adminItems?: NavItem[];
  showAdmin?: boolean;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="glass-subtle hover:glass"
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 glass">
        <SheetHeader>
          <SheetTitle>메뉴</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl p-3 glass-subtle hover:glass"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
        {showAdmin && adminItems && adminItems.length > 0 && (
          <div className="mt-4 space-y-1">
            <div className="text-xs text-muted-foreground px-3 py-2">
              관리자
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl p-3 glass-subtle hover:glass"
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
