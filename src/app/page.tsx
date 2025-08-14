"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role === "manager") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard?reason=staff");
      }
    };
    run();
  }, [router]);

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6 max-w-xl mx-auto text-center">
        <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            workeasy
          </h1>
          <p className="text-muted-foreground mt-2">
            결제 데모로 이동할 수 있습니다.
          </p>
        </header>
        <div className="glass glass-animation rounded-2xl p-6 space-y-4">
          <div>
            <Link href="/billing" className="underline">
              자동결제(빌링) 등록 데모
            </Link>
          </div>
          <div>
            <Link href="/billing/normal" className="underline">
              일반결제 데모
            </Link>
          </div>
        </div>
        <div className="rounded-xl overflow-hidden border">
          <img
            src="https://picsum.photos/seed/workeasy/800/480"
            alt="workeasy preview"
            className="w-full h-auto"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="w-full">
            <Link href="/login" aria-label="로그인으로 이동">
              로그인
            </Link>
          </Button>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/signup" aria-label="회원가입으로 이동">
              회원가입
            </Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          홈 화면에 추가하여 PWA로 사용해 보세요.
        </p>
      </div>
    </main>
  );
}
