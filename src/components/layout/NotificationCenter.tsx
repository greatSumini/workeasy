"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NotificationCenter({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 glass-subtle">
        <DropdownMenuLabel>알림</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="p-2 text-sm text-muted-foreground">
          새 알림이 없습니다.
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/notifications" className="w-full">
            알림 센터 열기
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
