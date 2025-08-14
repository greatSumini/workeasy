"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import HeroSection from "@/features/landing/components/HeroSection";
import FeaturesSection from "@/features/landing/components/FeaturesSection";
import HowItWorksSection from "@/features/landing/components/HowItWorksSection";
import TestimonialSection from "@/features/landing/components/TestimonialSection";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Clock,
  Users,
  Calendar,
  TrendingUp,
  Zap,
  Shield,
  MessageSquare,
  Smartphone,
  Check,
} from "lucide-react";

// 통계 데이터
const STATS = [
  { label: "활성 매장", value: "500+", icon: Users },
  { label: "월간 교환 처리", value: "15,000+", icon: Zap },
  { label: "평균 처리 시간", value: "1.2초", icon: Clock },
  { label: "고객 만족도", value: "98%", icon: TrendingUp },
];

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
    <>
      {/* 네비게이션 바 */}
      <nav className="sticky top-0 z-50 glass-strong border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              workeasy
            </h1>
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="#features"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                기능
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                작동 방식
              </Link>
              <Link
                href="#pricing"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                가격
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">로그인</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">무료 시작</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* 히어로 섹션 - 풀스크린 레이아웃 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* 반응형 배경 이미지 */}
        <div className="absolute inset-0 -z-10">
          {/* 데스크톱 배경 */}
          <div
            className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://static.flex.team/v2/landing-2024/main/hero-desktop.jpg')",
            }}
          />
          {/* 모바일 배경 */}
          <div
            className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://static.flex.team/v2/landing-2024/main/hero-desktop.jpg')",
            }}
          />
          {/* 배경 오버레이 */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-900/40 to-gray-900/60"></div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="relative z-10 w-full">
          <div className="max-w-4xl mx-auto px-6 py-20">
            <HeroSection />
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-20 border-y bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              매일 수백 개 매장이 workeasy로 시간을 절약합니다
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="glass glass-animation rounded-2xl p-6 text-center hover:scale-105"
              >
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600" />
                <div className="text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 문제/해결 섹션 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  아직도 엑셀과 카톡으로
                </span>
                <br />
                <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  시간을 낭비하고 계신가요?
                </span>
              </h2>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>매주 3시간씩 스케줄 짜고 수정하고...</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>카톡으로 교환 요청 받고 일일이 확인하고...</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 mt-1">✗</span>
                  <span>갑작스런 결근으로 매장 운영 차질...</span>
                </li>
              </ul>
            </div>
            <div className="glass glass-animation rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-4">workeasy가 해결합니다</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">
                    자동 스케줄링으로 시간 절약
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">모든 소통을 한 곳에서</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <span className="text-gray-700">근무 공백 사전 방지</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 섹션 */}
      <section id="features" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              필요한 모든 기능을 한 곳에
            </h2>
            <p className="text-lg text-gray-600">
              복잡한 교대근무 관리를 단순하고 효율적으로
            </p>
          </div>
          <FeaturesSection />
        </div>
      </section>

      {/* 작동 방식 */}
      <HowItWorksSection />

      {/* 고객 후기 */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              현장의 목소리
            </h2>
            <p className="text-gray-600">
              실제 매장에서 workeasy를 사용하는 분들의 이야기입니다
            </p>
          </div>

          {/* 스토리텔링형 후기 컴포넌트 */}
          <TestimonialSection />
        </div>
      </section>

      {/* 가격 섹션 */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
              투명하고 합리적인 가격
            </h2>
            <p className="text-lg text-gray-600">
              14일 무료 체험 후 결정하세요
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "스타터",
                price: "29,000",
                features: [
                  "직원 10명까지",
                  "기본 스케줄링",
                  "모바일 앱",
                  "이메일 지원",
                ],
                popular: false,
              },
              {
                name: "프로",
                price: "49,000",
                features: [
                  "직원 30명까지",
                  "고급 자동화",
                  "실시간 채팅",
                  "우선 지원",
                  "데이터 분석",
                ],
                popular: true,
              },
              {
                name: "엔터프라이즈",
                price: "맞춤",
                features: [
                  "무제한 직원",
                  "멀티 지점 관리",
                  "API 연동",
                  "전담 매니저",
                  "맞춤 개발",
                ],
                popular: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`glass glass-animation rounded-2xl p-8 ${
                  plan.popular ? "ring-2 ring-blue-600" : ""
                }`}
              >
                {plan.popular && (
                  <div className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full w-fit mx-auto mb-4">
                    가장 인기
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.price !== "맞춤" && (
                    <span className="text-gray-600">원/월</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check className="h-4 w-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                >
                  {plan.price === "맞춤" ? "문의하기" : "무료 체험 시작"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            지금 시작하면 매주 3시간을 아낄 수 있습니다
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            500개 이상의 매장이 이미 workeasy로 시간을 절약하고 있습니다
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">14일 무료 체험 시작하기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#demo">데모 예약하기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">workeasy</h3>
              <p className="text-sm text-gray-600">
                소규모 F&B 매장을 위한
                <br />
                스마트한 교대근무 관리 솔루션
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">제품</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="#features" className="hover:text-gray-900">
                    기능
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-gray-900">
                    가격
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900">
                    업데이트
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">회사</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="#" className="hover:text-gray-900">
                    소개
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900">
                    블로그
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900">
                    채용
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">지원</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <Link href="#" className="hover:text-gray-900">
                    도움말
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900">
                    문의하기
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-gray-900">
                    개인정보처리방침
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-600">
            © {new Date().getFullYear()} workeasy. 모든 권리 보유.
          </div>
        </div>
      </footer>
    </>
  );
}
