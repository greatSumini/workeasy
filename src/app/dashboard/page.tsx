"use client";

import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <main className="p-6">
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-muted-foreground mt-2">보호된 페이지입니다.</p>
      </main>
    </AuthGuard>
  );
}
