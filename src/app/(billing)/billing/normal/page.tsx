"use client";

import { useEffect, useMemo, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NormalPaymentPage() {
  const router = useRouter();
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orderId = useMemo(() => `order_${Date.now()}`, []);
  const amount = 15000;

  useEffect(() => {
    (async () => {
      try {
        await loadTossPayments(clientKey);
        setReady(true);
      } catch (e: any) {
        setError(e?.message || "SDK 로드 실패");
      }
    })();
  }, [clientKey]);

  const onClick = async () => {
    try {
      const toss = await loadTossPayments(clientKey);
      const payment = toss.payment({ customerKey: "ANONYMOUS" as any });
      await payment.requestPayment({
        orderId,
        orderName: "워크이지 일반결제 테스트",
        successUrl: window.location.origin + "/payments/success",
        failUrl: window.location.origin + "/payments/fail",
        amount: { currency: "KRW", value: amount },
        method: "CARD",
      } as any);
    } catch (e: any) {
      setError(e?.message || "요청 실패");
    }
  };

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6 max-w-lg mx-auto">
        <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">일반결제 테스트</h1>
          <p className="text-muted-foreground mt-2">SDK v2 결제창으로 테스트합니다.</p>
        </header>
        <div className="glass glass-animation rounded-2xl p-6 space-y-4">
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button className="glass-subtle hover:glass" disabled={!ready} onClick={onClick}>
            결제창 열기
          </Button>
        </div>
      </div>
    </main>
  );
}


