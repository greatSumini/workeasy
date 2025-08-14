"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";

export default function SettingsIndexPage() {
  return (
    <AuthGuard>
      <Redirector />
    </AuthGuard>
  );
}

function Redirector() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/settings/profile");
  }, [router]);
  return (
    <main className="min-h-screen ios-gradient flex items-center justify-center">
      <div className="glass glass-animation rounded-2xl p-8">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="text-lg font-medium">이동 중...</span>
        </div>
      </div>
    </main>
  );
}
