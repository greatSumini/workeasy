"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { InviteForm } from "@/features/invitations/components/InviteForm";
import {
  getOwnerPrimaryStore,
  getStoreSummary,
  listRecentInvitations,
} from "@/features/invitations/api";

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminContent />
    </AuthGuard>
  );
}

function AdminContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<{ id: string; name?: string } | null>(
    null
  );
  const [summary, setSummary] = useState<{
    memberCount: number;
    pendingInvitesCount: number;
  } | null>(null);
  const [recentInvites, setRecentInvites] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return; // AuthGuard will redirect
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        // fallback to dashboard on error
        router.replace("/dashboard");
        return;
      }

      if (active) {
        if (!data || data.role !== "manager") {
          router.replace("/dashboard?reason=not_manager");
        } else {
          // load store context & summaries
          const s = await getOwnerPrimaryStore();
          setStore(s);
          if (s?.id) {
            const sum = await getStoreSummary(s.id);
            setSummary(sum);
            const rec = await listRecentInvitations(s.id, 5);
            setRecentInvites(rec);
          }
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen ios-gradient flex items-center justify-center">
        <div className="glass glass-animation rounded-2xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="text-lg font-medium">로딩중...</span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6">
        <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            관리자 대시보드
          </h1>
          <p className="text-muted-foreground mt-2">
            관리자 전용 페이지입니다.
          </p>
        </header>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="glass glass-animation rounded-2xl p-5 hover:scale-105">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              내 매장
            </div>
            <div className="mt-2 text-lg font-semibold">
              {store?.name ?? "(이름 없음)"}
            </div>
          </div>
          <div className="glass glass-animation rounded-2xl p-5 hover:scale-105">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              구성원 수
            </div>
            <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {summary?.memberCount ?? 0}
            </div>
          </div>
          <div className="glass glass-animation rounded-2xl p-5 hover:scale-105">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              대기 중 초대
            </div>
            <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-orange-600 to-pink-600 bg-clip-text text-transparent">
              {summary?.pendingInvitesCount ?? 0}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="glass glass-animation rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                직원 초대
              </h2>
              <Button
                asChild
                variant="secondary"
                className="glass-subtle hover:glass"
              >
                <Link href="/admin/staff">전체 관리</Link>
              </Button>
            </div>
            <div className="mt-4 max-w-md">
              {store?.id ? (
                <InviteForm
                  storeId={store.id}
                  onCreated={async () => {
                    if (store?.id) {
                      const sum = await getStoreSummary(store.id);
                      setSummary(sum);
                      const rec = await listRecentInvitations(store.id, 5);
                      setRecentInvites(rec);
                    }
                  }}
                />
              ) : (
                <div className="text-sm text-muted-foreground">
                  매장이 없습니다. 아래 버튼으로 먼저 생성해 주세요.
                  <div className="mt-3">
                    <Button asChild>
                      <Link href="/admin/settings">매장 만들기</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass glass-animation rounded-2xl p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              최근 초대
            </h2>
            <div className="mt-4 space-y-3">
              {recentInvites.map((inv) => (
                <div
                  key={inv.id}
                  className="glass-subtle glass-animation rounded-xl p-4 text-sm hover:glass"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {inv.invitee_email ?? "링크 초대"}
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full glass-subtle">
                      {inv.role}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    코드 {inv.code} · {inv.uses}/{inv.max_uses} · 만료{" "}
                    {new Date(inv.expires_at).toLocaleString()}
                  </div>
                </div>
              ))}
              {recentInvites.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  최근 초대가 없습니다.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
