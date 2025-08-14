"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BillingSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const customerKey = params.get("customerKey");
  const authKey = params.get("authKey");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = useMemo(
    () => Boolean(customerKey && authKey),
    [customerKey, authKey]
  );

  useEffect(() => {
    // 자동 확인 실행
    if (canConfirm) {
      void confirmBilling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canConfirm]);

  const confirmBilling = async () => {
    if (!canConfirm) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerKey, authKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "빌링키 발급 실패");
      setData(json);
      if (json?.billingKey && customerKey) {
        localStorage.setItem("demoBillingKey", json.billingKey);
        localStorage.setItem("demoCustomerKey", customerKey);
      }
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
            결제수단 인증 성공
          </h1>
          <p className="text-muted-foreground mt-2">
            빌링키 발급을 완료합니다.
          </p>
        </header>

        <div className="glass glass-animation rounded-2xl p-6 space-y-4">
          <div className="text-sm">
            customerKey: <code>{customerKey}</code>
          </div>
          <div className="text-sm break-all">
            authKey: <code>{authKey}</code>
          </div>
          {loading && <div className="text-sm">발급 요청 중...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {!data && (
            <Button
              className="glass-subtle hover:glass"
              onClick={confirmBilling}
              disabled={!canConfirm || loading}
            >
              빌링키 발급 요청
            </Button>
          )}
          {data && (
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                아래 빌링키는 데모 표시용이며 서버 DB에 저장하지 않았습니다.
              </div>
              <div className="glass-subtle rounded-xl p-4 text-sm break-all">
                billingKey: {data?.billingKey}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.push("/billing")}>
              돌아가기
            </Button>
            <Button onClick={() => router.push("/billing/charge")}>
              테스트 결제 실행
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
