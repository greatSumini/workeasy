"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { InviteForm } from "@/features/invitations/components/InviteForm";
import {
  listInvitations,
  deleteInvitation,
  resendInvitationEmail,
} from "@/features/invitations/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type InvitationRow = {
  id: string;
  invitee_email: string | null;
  role: "staff" | "manager";
  code: string;
  expires_at: string;
  max_uses: number;
  uses: number;
  created_at: string;
};

export default function StaffPage() {
  return (
    <AuthGuard>
      <Content />
    </AuthGuard>
  );
}

function Content() {
  const supabase = createClient();
  const { toast } = useToast();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [list, setList] = useState<InvitationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      // 간단히: 현재 사용자가 owner인 첫 매장을 사용 (MVP)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1);
      const sid = data?.[0]?.id ?? null;
      if (!active) return;
      setStoreId(sid);
      if (sid) {
        const rows = await listInvitations(sid);
        if (!active) return;
        setList(rows as InvitationRow[]);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const refresh = async () => {
    if (!storeId) return;
    const rows = await listInvitations(storeId);
    setList(rows as InvitationRow[]);
  };

  if (loading) return <main className="p-6">로딩중...</main>;
  if (!storeId)
    return <main className="p-6">관리 중인 매장을 먼저 생성해 주세요.</main>;

  return (
    <main className="p-6 space-y-6">
      <section>
        <h1 className="text-2xl font-semibold">직원 초대</h1>
        <p className="text-sm text-muted-foreground mt-1">
          이메일 또는 코드로 초대할 수 있습니다.
        </p>
        <div className="mt-4 max-w-md">
          <InviteForm storeId={storeId} onCreated={refresh} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold">초대 내역</h2>
        <div className="mt-3 space-y-3">
          {list.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between rounded border p-3"
            >
              <div className="space-y-1">
                <div className="text-sm">
                  {inv.invitee_email ?? "링크 초대"} · 역할 {inv.role}
                </div>
                <div className="text-xs text-muted-foreground">
                  코드 {inv.code} · {inv.uses}/{inv.max_uses} · 만료{" "}
                  {new Date(inv.expires_at).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(inv.code);
                      toast({ title: "코드 복사됨", description: inv.code });
                    } catch {}
                  }}
                >
                  코드 복사
                </Button>
                <Button
                  variant="secondary"
                  onClick={async () => {
                    try {
                      await resendInvitationEmail({ invitationId: inv.id });
                      toast({
                        title: "재발송 요청",
                        description: "이메일 함수 호출됨",
                      });
                    } catch (e: any) {
                      toast({
                        title: "재발송 실패",
                        description: e.message ?? String(e),
                      });
                    }
                  }}
                >
                  재발송
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    try {
                      await deleteInvitation(inv.id);
                      await refresh();
                    } catch (e: any) {
                      toast({
                        title: "삭제 실패",
                        description: e.message ?? String(e),
                      });
                    }
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          ))}
          {list.length === 0 && (
            <div className="text-sm text-muted-foreground">
              초대 내역이 없습니다.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
