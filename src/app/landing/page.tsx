"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) {
        router.replace("/dashboard");
      }
    })();

    const supabase2 = createClient();
    const { data: sub } = supabase2.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace("/dashboard");
        }
      }
    );
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header className="glass-strong glass-animation rounded-2xl p-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          workeasy
        </h1>
        <p className="text-muted-foreground mt-2">
          소규모 F&B 매장을 위한 교대근무 관리 SaaS. 실시간 교환, 채팅, 푸시
          알림까지 한 번에.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-6 items-stretch">
        <div className="glass glass-animation rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              지금 바로 시작하세요
            </h2>
            <p className="text-muted-foreground mt-2">
              1분 만에 가입하고 모바일 PWA로 편리하게 사용해 보세요.
            </p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button asChild className="w-full">
              <Link href="/signup" aria-label="회원가입으로 이동">
                무료로 시작하기
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/login" aria-label="로그인으로 이동">
                로그인
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border">
          <img
            src="https://picsum.photos/seed/workeasy-landing/800/480"
            alt="workeasy 미리보기"
            className="w-full h-auto"
          />
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass glass-animation rounded-2xl p-5 hover:scale-105">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            실시간
          </div>
          <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
            교환/채팅
          </div>
        </div>
        <div className="glass glass-animation rounded-2xl p-5 hover:scale-105">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            PWA
          </div>
          <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-orange-600 to-pink-600 bg-clip-text text-transparent">
            설치형 앱
          </div>
        </div>
        <div className="glass glass-animation rounded-2xl p-5 hover:scale-105">
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            관리자
          </div>
          <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
            대시보드
          </div>
        </div>
      </section>

      <footer className="glass-subtle glass-animation rounded-xl p-4 text-xs text-muted-foreground text-center">
        © {new Date().getFullYear()} workeasy. 모든 권리 보유.
      </footer>
    </div>
  );
}
