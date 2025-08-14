"use client";

import React from "react";
import StepCard, { type StepItem } from "./StepCard";
import { UserPlus, Bot, Zap } from "lucide-react";

const STEPS: StepItem[] = [
  {
    step: 1,
    icon: UserPlus,
    title: "가입 및 매장 설정",
    description:
      "30초만에 매장 정보 등록. 직원 초대 링크를 공유하면 팀 구성 완료. 복잡한 설정 없이 바로 시작하세요.",
    timeIndicator: "30초",
  },
  {
    step: 2,
    icon: Bot,
    title: "자동 스케줄 생성",
    description:
      "AI가 최적의 근무표 자동 생성. 직원 선호 시간, 숙련도, 최소 인원을 고려한 스마트한 배치.",
    timeIndicator: "즉시 생성",
  },
  {
    step: 3,
    icon: Zap,
    title: "실시간 교환/승인",
    description:
      "1탭으로 빠른 근무 교환. 푸시 알림으로 즉시 확인, 모든 변경사항이 실시간으로 동기화됩니다.",
    timeIndicator: "평균 1.2초",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-20"
      aria-label="workeasy 사용 방법"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* 섹션 헤더 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            단 3단계로 시작하는 스마트한 근무 관리
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            복잡한 설정은 없습니다. 가입 후 즉시 자동화된 스케줄 관리를
            경험하세요.
          </p>
        </div>

        {/* 스텝 카드 그리드 */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {STEPS.map((step, index) => (
            <StepCard
              key={step.step}
              {...step}
              isLast={index === STEPS.length - 1}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            지금 시작하면 14일간 무료로 모든 기능을 사용할 수 있습니다
          </p>
        </div>
      </div>
    </section>
  );
}
