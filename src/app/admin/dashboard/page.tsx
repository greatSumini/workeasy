"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboardPage() {
  return (
    <AuthGuard>
      <AdminContent />
    </AuthGuard>
  );
}

function AdminContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return; // AuthGuard will redirect
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        // fallback to dashboard on error
        router.replace("/dashboard");
        return;
      }

      if (active) {
        if (!data || data.role !== "manager") {
          router.replace("/dashboard");
        } else {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return <main className="p-6">로딩중...</main>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">관리자 대시보드</h1>
      <p className="text-muted-foreground mt-2">관리자 전용 페이지입니다.</p>
    </main>
  );
}
