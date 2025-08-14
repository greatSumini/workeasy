"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import SidebarNav from "./SidebarNav";
import TopBar from "./TopBar";
import MobileDrawer from "./MobileDrawer";
import {
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Repeat,
  Settings,
  BarChart3,
  Users,
  Cog,
  Bell,
} from "lucide-react";

type UserRole = "manager" | "staff" | null;

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function useUserRole(): UserRole {
  const { data } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null as const;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "manager") return "manager" as const;
      return "staff" as const;
    },
    staleTime: 60_000,
  });
  return data ?? null;
}

function useNavItems(role: UserRole) {
  const common: NavItem[] = [
    { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
    { label: "근무 캘린더", href: "/schedule", icon: Calendar },
    { label: "교환 요청", href: "/requests", icon: Repeat },
    { label: "채팅", href: "/chat", icon: MessageSquare },
    { label: "알림", href: "/notifications", icon: Bell },
    { label: "설정", href: "/settings", icon: Settings },
  ];
  const admin: NavItem[] = [
    { label: "관리자 대시보드", href: "/admin/dashboard", icon: BarChart3 },
    { label: "직원 관리", href: "/admin/staff", icon: Users },
    { label: "매장 설정", href: "/admin/settings", icon: Cog },
  ];
  return { common, admin, showAdmin: role === "manager" };
}

function getPageTitle(pathname: string): string {
  const map: { test: RegExp; title: string }[] = [
    { test: /^\/?$/, title: "홈" },
    { test: /^\/dashboard(\/.*)?$/, title: "대시보드" },
    { test: /^\/schedule(\/.*)?$/, title: "근무 캘린더" },
    { test: /^\/requests(\/.*)?$/, title: "교환 요청" },
    { test: /^\/requests\/[^/]+$/, title: "요청 상세" },
    { test: /^\/chat(\/.*)?$/, title: "채팅" },
    { test: /^\/chat\/[^/]+$/, title: "채팅" },
    { test: /^\/notifications(\/.*)?$/, title: "알림" },
    { test: /^\/settings(\/.*)?$/, title: "설정" },
    { test: /^\/settings\/profile$/, title: "프로필" },
    { test: /^\/settings\/notifications$/, title: "알림 설정" },
    { test: /^\/settings\/app$/, title: "앱 설정" },
    { test: /^\/admin\/dashboard(\/.*)?$/, title: "관리자 대시보드" },
    { test: /^\/admin\/staff(\/.*)?$/, title: "직원 관리" },
    { test: /^\/admin\/settings(\/.*)?$/, title: "매장 설정" },
    { test: /^\/login$/, title: "로그인" },
    { test: /^\/signup$/, title: "회원가입" },
    { test: /^\/invite\//, title: "초대" },
  ];
  const found = map.find((m) => m.test.test(pathname));
  return found?.title ?? "workeasy";
}

function isPublicPath(pathname: string): boolean {
  return (
    /^\/(login|signup)(\/.*)?$/.test(pathname) ||
    /^\/invite\//.test(pathname) ||
    /^\/landing$/.test(pathname)
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useUserRole();
  const { common, admin, showAdmin } = useNavItems(role);

  const title = useMemo(() => getPageTitle(pathname || "/"), [pathname]);
  const isPublic = useMemo(() => isPublicPath(pathname || "/"), [pathname]);

  return (
    <div className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30 pointer-events-none" />
      <div className="relative z-10 flex min-h-screen">
        {!isPublic && (
          <aside className="hidden md:block w-20 p-4">
            <SidebarNav
              items={common}
              adminItems={admin}
              showAdmin={showAdmin}
            />
          </aside>
        )}

        <section className="flex-1 flex flex-col">
          {!isPublic && (
            <div className="p-4">
              <div className="glass-strong glass-animation rounded-2xl p-4">
                <TopBar title={title}>
                  <div className="md:hidden">
                    <MobileDrawer
                      items={common}
                      adminItems={admin}
                      showAdmin={showAdmin}
                    />
                  </div>
                </TopBar>
              </div>
            </div>
          )}

          <div className="p-6 space-y-6">{children}</div>
        </section>
      </div>
    </div>
  );
}
