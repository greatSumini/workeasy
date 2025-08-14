"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

type HeroSectionProps = {
  className?: string;
};

const BENEFITS = [
  "스케줄 작성 시간 70% 단축",
  "근무 교환 승인 1탭으로 완료",
  "실시간 푸시 알림으로 공백 제로",
];

export default function HeroSection({ className }: HeroSectionProps) {
  return (
    <section
      className={`relative flex flex-col items-center text-center gap-8 ${className ?? ""}`}
      aria-label="workeasy 메인 가치 제안"
    >
      {/* 신뢰도 뱃지 */}
      <div className="relative z-10 inline-flex items-center gap-2 glass-strong rounded-full px-4 py-2 text-xs w-fit text-white/90">
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="font-medium">500+ 매장이 사용 중</span>
      </div>

      {/* 메인 헤드라인 */}
      <div className="relative z-10 space-y-6">
        <h1
          className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight"
          style={{ textWrap: "balance" } as any}
        >
          <span className="bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent block drop-shadow-lg">
            매주 3시간 걸리던
          </span>
          <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent block drop-shadow-lg">
            스케줄 관리를 10분으로
          </span>
        </h1>

        <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
          엑셀과 카톡으로 관리하던 교대근무를 자동화하세요.
          <br />
          직원 가능 시간 기반 자동 배치, 1초 교환 승인, 실시간 알림까지.
        </p>
      </div>

      {/* 혜택 리스트 */}
      <ul className="space-y-3">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-center justify-center gap-3">
            <div className="glass-strong rounded-full p-2">
              <Check className="h-5 w-5 text-green-400" />
            </div>
            <span className="text-white/90 text-lg drop-shadow-sm">
              {benefit}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA 버튼 */}
      <div className="relative z-10 flex flex-col sm:flex-row gap-4">
        <Button
          asChild
          size="lg"
          className="group glass-animation hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white shadow-xl hover:shadow-2xl"
        >
          <Link href="/signup">
            무료로 시작하기
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="glass-animation hover:scale-105 backdrop-blur-xl bg-white/20 border-white/30 text-white hover:bg-white/30 shadow-lg"
        >
          <Link href="#demo">3분 데모 영상 보기</Link>
        </Button>
      </div>

      {/* 신뢰 구축 텍스트 */}
      <p className="relative z-10 text-sm text-white/70 drop-shadow-sm">
        신용카드 없이 14일 무료 체험 • 언제든 취소 가능
      </p>
    </section>
  );
}
