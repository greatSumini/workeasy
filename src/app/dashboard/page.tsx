"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const params = useSearchParams();
  const reason = params.get("reason");
  const message =
    reason === "staff"
      ? "직원 권한으로 접속하여 기본 대시보드로 이동했습니다."
      : reason === "not_manager"
        ? "관리자 전용 페이지 접근으로 기본 대시보드로 이동했습니다."
        : null;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">대시보드</h1>
      <p className="text-muted-foreground mt-2">보호된 페이지입니다.</p>
      {message && (
        <div className="mt-4 rounded border bg-muted/30 p-3 text-sm">
          {message}
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<main className="p-6">로딩중...</main>}>
        <DashboardContent />
      </Suspense>
    </AuthGuard>
  );
}
