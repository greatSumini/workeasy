"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addMonths, format } from "date-fns";

type BillingProfile = {
  id: string;
  customer_key: string;
  card_masked: string | null;
  issuer_code: string | null;
  acquirer_code: string | null;
  created_at: string;
};

type PaymentIntent = {
  id: string;
  order_id: string;
  amount: number;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELED";
  created_at: string;
};

export default function AdminSubscriptionPage() {
  return (
    <AuthGuard>
      <Content />
    </AuthGuard>
  );
}

function Content() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [payments, setPayments] = useState<PaymentIntent[]>([]);
  const [charging, setCharging] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  const lastSucceeded = useMemo(() => {
    return payments.find((p) => p.status === "SUCCEEDED") || null;
  }, [payments]);

  const nextBillingAt = useMemo(() => {
    if (!lastSucceeded) return null;
    try {
      return addMonths(new Date(lastSucceeded.created_at), 1);
    } catch {
      return null;
    }
  }, [lastSucceeded]);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // AuthGuard가 처리

      // 관리자 권한 체크
      const { data: roleRow, error: roleErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (roleErr || !roleRow || roleRow.role !== "manager") {
        router.replace("/dashboard?reason=not_manager");
        return;
      }

      // 데이터 로딩 함수 추출
      const supabaseRefresh = async () => {
        const { data: profRows } = await supabase
          .from("billing_profiles")
          .select(
            "id, customer_key, card_masked, issuer_code, acquirer_code, created_at"
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const { data: intentRows } = await supabase
          .from("payment_intents")
          .select("id, order_id, amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        if (!active) return;
        setProfile((profRows?.[0] as BillingProfile) ?? null);
        setPayments((intentRows as PaymentIntent[]) ?? []);
      };

      await supabaseRefresh();
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const chargeNow = useCallback(async () => {
    if (!profile?.customer_key) return;
    setCharging(true);
    try {
      const orderId = `sub_${Date.now()}`;
      const res = await fetch("/api/billing/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerKey: profile.customer_key,
          orderId,
          amount: 4900,
          orderName: "workeasy 구독 1개월",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "결제 실패");
      // 갱신
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: intentRows } = await supabase
          .from("payment_intents")
          .select("id, order_id, amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
        setPayments((intentRows as PaymentIntent[]) ?? []);
      }
      alert("결제가 완료되었습니다.");
    } catch (e: any) {
      alert(e?.message || "결제 요청 실패");
    } finally {
      setCharging(false);
    }
  }, [profile]);

  const unlinkPaymentMethod = useCallback(async () => {
    if (!profile) return;
    setUnlinking(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("billing_profiles")
        .delete()
        .eq("id", profile.id);
      if (error) throw error;
      setProfile(null);
      alert("결제수단 연결이 해제되었습니다.");
    } catch (e: any) {
      alert(e?.message || "해제 실패");
    } finally {
      setUnlinking(false);
    }
  }, [profile]);

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
            구독 관리
          </h1>
          <p className="text-muted-foreground mt-2">
            관리자 전용 구독/결제 관리 페이지입니다.
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="glass glass-animation rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              결제수단
            </h2>
            {profile ? (
              <>
                <div className="space-y-2 text-sm">
                  <div>
                    상태: <span className="font-medium">등록됨</span>
                  </div>
                  <div>
                    카드:{" "}
                    <span className="font-mono">
                      {profile.card_masked ?? "(마스킹 없음)"}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    고객 키:{" "}
                    <span className="font-mono">{profile.customer_key}</span>
                  </div>
                </div>
                {nextBillingAt && (
                  <div className="text-muted-foreground">
                    다음 결제 예정일:{" "}
                    {format(nextBillingAt, "yyyy.MM.dd HH:mm")}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                등록된 결제수단이 없습니다.
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild className="glass-subtle hover:glass">
                <Link href="/billing">결제수단 등록/변경</Link>
              </Button>
              {profile ? (
                <>
                  <Button
                    onClick={chargeNow}
                    disabled={charging}
                    variant="secondary"
                    className="glass-subtle hover:glass"
                  >
                    {charging ? "결제 중..." : "구독 결제 실행 (₩4,900)"}
                  </Button>
                  <Button
                    onClick={unlinkPaymentMethod}
                    disabled={unlinking}
                    variant="ghost"
                    className="glass-subtle hover:glass"
                  >
                    {unlinking ? "해제 중..." : "결제수단 해제"}
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  variant="secondary"
                  className="glass-subtle hover:glass"
                >
                  <Link href="/billing/charge">자동결제 테스트</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="glass glass-animation rounded-2xl p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              최근 결제 내역
            </h2>
            <div className="mt-4 space-y-3">
              {payments.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  결제 내역이 없습니다.
                </div>
              )}
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="glass-subtle glass-animation rounded-xl p-4 text-sm hover:glass"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{p.order_id}</div>
                    <Badge
                      variant={
                        p.status === "SUCCEEDED"
                          ? "default"
                          : p.status === "FAILED"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    금액 {p.amount.toLocaleString()}원 ·{" "}
                    {new Date(p.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
