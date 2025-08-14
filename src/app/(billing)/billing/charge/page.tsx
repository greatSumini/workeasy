"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function BillingChargePage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const customerKey = useMemo(
    () => localStorage.getItem("demoCustomerKey") || "",
    []
  );
  const billingKey = useMemo(
    () => localStorage.getItem("demoBillingKey") || "",
    []
  );

  const onCharge = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const orderId = `auto_${Date.now()}`;
      const res = await fetch("/api/billing/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerKey,
          orderId,
          amount: 4900,
          orderName: "workeasy 구독 1개월",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "자동결제 승인 실패");
      setResult(json);
    } catch (e: any) {
      setError(e?.message || "요청 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6 max-w-2xl mx-auto">
        <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            테스트 자동결제
          </h1>
          <p className="text-muted-foreground mt-2">
            발급된 빌링키로 서버 승인 API를 호출해야 합니다.
          </p>
        </header>
        <div className="glass glass-animation rounded-2xl p-6 space-y-4">
          <div className="text-sm">
            customerKey: <code>{customerKey || "(없음)"}</code>
          </div>
          <div className="text-sm break-all">
            billingKey: <code>{billingKey || "(없음)"}</code>
          </div>
          {!billingKey && (
            <div className="text-sm text-red-600">
              빌링키가 없습니다. 먼저 카드 등록을 완료해주세요.
            </div>
          )}
          <Button
            className="glass-subtle hover:glass"
            disabled={!billingKey || loading}
            onClick={onCharge}
          >
            자동결제 승인 시뮬레이션
          </Button>
          {loading && <div className="text-sm">요청 중...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {result && (
            <div className="glass-subtle rounded-xl p-4 text-sm break-all">
              {JSON.stringify(result)}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/billing")}>
              처음으로
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
