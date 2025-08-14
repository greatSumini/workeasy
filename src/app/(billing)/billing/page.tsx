"use client";

import React, { useEffect, useMemo, useState } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BillingPage() {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || "";
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerKey = useMemo(() => {
    // 데모용 무작위 값; 실제로는 서버에서 발급/전달 권장
    const existing = localStorage.getItem("demoCustomerKey");
    if (existing) return existing;
    const generated = `cust_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("demoCustomerKey", generated);
    return generated;
  }, []);

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
      const payment = toss.payment({ customerKey });
      await payment.requestBillingAuth({
        method: "CARD",
        successUrl: window.location.origin + "/billing/success",
        failUrl: window.location.origin + "/billing/fail",
        customerEmail: "demo@example.com",
        customerName: "워크이지 데모",
      });
    } catch (e: any) {
      setError(e?.message || "요청 실패");
    }
  };

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6 max-w-lg mx-auto">
        <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            구독 결제수단 등록
          </h1>
          <p className="text-muted-foreground mt-2">
            자동결제용 카드 정보를 한 번 등록합니다.
          </p>
        </header>
        <div className="glass glass-animation rounded-2xl p-6 space-y-4">
          <div className="text-sm text-muted-foreground">
            고객 키: {customerKey}
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <Button
            className="glass-subtle hover:glass"
            disabled={!ready}
            onClick={onClick}
          >
            카드 등록하기
          </Button>
          <div className="text-xs text-muted-foreground">
            테스트 키 사용 시 실제 결제되지 않습니다.
          </div>
        </div>
        <div className="glass-subtle glass-animation rounded-xl p-4">
          <div className="text-sm">
            결제 등록 후에는 성공/실패 페이지로 이동합니다.
          </div>
          <div className="text-xs mt-2">
            성공: <code>/billing/success</code> / 실패:{" "}
            <code>/billing/fail</code>
          </div>
          <div className="mt-3 text-sm">
            <Link className="underline" href="/dashboard">
              대시보드로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
