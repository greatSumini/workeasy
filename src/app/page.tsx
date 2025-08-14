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
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/dashboard");
      }
    };
    run();
  }, [router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">workeasy</h1>
        <p className="text-muted-foreground">
          소규모 F&B 매장을 위한 교대근무 관리 서비스. 실시간 교환, 채팅, 푸시
          알림까지 한 번에.
        </p>
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
