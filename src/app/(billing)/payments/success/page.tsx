"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = params.get("amount");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paymentKey && orderId && amount) {
      void approve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentKey, orderId, amount]);

  const approve = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/payments/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "결제 승인 실패");
      setData(json);
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
            결제 성공
          </h1>
          <p className="text-muted-foreground mt-2">
            서버 승인 결과를 확인했습니다.
          </p>
        </header>
        <div className="glass glass-animation rounded-2xl p-6 space-y-4">
          <div className="text-sm break-all">
            paymentKey: <code>{paymentKey}</code>
          </div>
          <div className="text-sm">orderId: {orderId}</div>
          <div className="text-sm">amount: {amount}</div>
          {loading && <div className="text-sm">승인 중...</div>}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {data && (
            <div className="glass-subtle rounded-xl p-4 text-sm break-all">
              {JSON.stringify(data)}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => router.push("/billing/normal")}
            >
              다시 결제하기
            </Button>
            <Button onClick={() => router.push("/dashboard")}>대시보드</Button>
          </div>
        </div>
      </div>
    </main>
  );
}
