"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function BillingFailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const code = params.get("code");
  const message = params.get("message");

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6 max-w-xl mx-auto">
        <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            결제수단 인증 실패
          </h1>
          <p className="text-muted-foreground mt-2">
            오류 내용을 확인해주세요.
          </p>
        </header>
        <div className="glass glass-animation rounded-2xl p-6 space-y-4">
          <div className="text-sm">코드: {code}</div>
          <div className="text-sm break-all">메시지: {message}</div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push("/billing")}
              className="glass-subtle hover:glass"
            >
              다시 시도
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push("/dashboard")}
            >
              대시보드
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
