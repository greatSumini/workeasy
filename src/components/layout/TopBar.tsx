"use client";

import React from "react";
import { Bell, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationCenter from "./NotificationCenter";
import { createClient } from "@/lib/supabase/client";

export default function TopBar({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const onLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {children}
        <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <NotificationCenter>
          <Button
            variant="ghost"
            className="glass-subtle hover:glass"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </NotificationCenter>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="glass-subtle hover:glass px-2">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage
                    src="https://picsum.photos/seed/workeasy/64/64"
                    alt="profile"
                  />
                  <AvatarFallback>WE</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-subtle">
            <DropdownMenuLabel>내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings/profile">프로필</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings/notifications">알림 설정</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>로그아웃</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
