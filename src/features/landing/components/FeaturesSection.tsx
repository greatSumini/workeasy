"use client";

import React, { useState } from "react";
import FeatureCard from "./FeatureCard";
import InteractiveSandbox from "./InteractiveSandbox";
import {
  Bot,
  Repeat,
  Bell,
  Smartphone,
  Calendar,
  Shield,
  BarChart3,
  Zap,
  Play,
} from "lucide-react";

const MAIN_FEATURES = [
  {
    id: "scheduling",
    icon: Bot,
    title: "AI 자동 스케줄링",
    description:
      "직원별 가능 시간, 숙련도, 포지션을 고려한 최적 배치. 노동법 준수 자동 체크.",
    highlight: "70% 시간 절약",
    demoTitle: "AI 스케줄러 체험",
    demoDescription: "실제 알고리즘을 간단히 체험해보세요",
  },
  {
    id: "exchange",
    icon: Repeat,
    title: "1초 교환 시스템",
    description:
      "교환 요청 → 매니저 푸시 알림 → 원탭 승인. 모든 직원 캘린더 실시간 동기화.",
    highlight: "평균 처리 1.2초",
    demoTitle: "교환 프로세스 체험",
    demoDescription: "1초 승인 과정을 직접 확인하세요",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "실시간 분석",
    description:
      "주/월간 근무 시간, 예상 인건비, 효율성 지표를 한눈에. 엑셀 내보내기 지원.",
    highlight: "경영 인사이트",
    demoTitle: "AI 인사이트 체험",
    demoDescription: "스마트한 경영 분석을 체험해보세요",
  },
  {
    id: "prevention",
    icon: Shield,
    title: "근무 공백 방지",
    description:
      "최소 인원 미달 시 자동 경고. 대체 가능 직원 즉시 추천. No-show 제로 달성.",
    highlight: "공백률 0%",
    demoTitle: "공백 방지 시스템",
    demoDescription: "실시간 경고 시스템을 확인하세요",
  },
];

const ADDITIONAL_FEATURES = [
  {
    icon: Bell,
    title: "스마트 알림",
    description: "중요도별 알림 필터링",
  },
  {
    icon: Smartphone,
    title: "PWA 기술",
    description: "앱 설치 없이 네이티브 경험",
  },
  {
    icon: Calendar,
    title: "다양한 뷰",
    description: "일/주/월 단위 유연한 조회",
  },
  {
    icon: Zap,
    title: "빠른 동기화",
    description: "모든 변경사항 1초 내 반영",
  },
];

export default function FeaturesSection() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  return (
    <div className="space-y-12">
      {/* 메인 기능 그리드 */}
      <div className="grid md:grid-cols-2 gap-6">
        {MAIN_FEATURES.slice(0, 3).map((feature) => (
          <div
            key={feature.title}
            className="glass glass-animation rounded-2xl p-6 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="glass-subtle rounded-xl p-3">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {feature.highlight}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  {feature.description}
                </p>

                {/* 데모 버튼 */}
                <button
                  onClick={() => setActiveDemo(feature.id)}
                  className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Play className="h-3 w-3" />
                  체험해보기
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 인터랙티브 데모 섹션 */}
      {activeDemo && (
        <div className="mt-8">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              직접 체험해보세요!
            </h3>
            <p className="text-gray-600">
              실제 기능을 간단히 시뮬레이션으로 확인할 수 있습니다
            </p>
          </div>

          <InteractiveSandbox
            type={activeDemo as "scheduling" | "exchange" | "analytics"}
            title={
              MAIN_FEATURES.find((f) => f.id === activeDemo)?.demoTitle || ""
            }
            description={
              MAIN_FEATURES.find((f) => f.id === activeDemo)?.demoDescription ||
              ""
            }
          />

          <div className="text-center mt-6">
            <button
              onClick={() => setActiveDemo(null)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              데모 닫기
            </button>
          </div>
        </div>
      )}

      {/* 나머지 기능들 */}
      <div className="grid md:grid-cols-2 gap-6">
        {MAIN_FEATURES.slice(3).map((feature) => (
          <div
            key={feature.title}
            className="glass glass-animation rounded-2xl p-6 hover:scale-[1.02] transition-transform"
          >
            <div className="flex items-start gap-4">
              <div className="glass-subtle rounded-xl p-3">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                    {feature.highlight}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 추가 기능 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-700">
          그 외에도...
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ADDITIONAL_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="glass-subtle glass-animation rounded-xl p-4 text-center hover:glass"
            >
              <feature.icon className="h-5 w-5 mx-auto mb-2 text-gray-700" />
              <h4 className="text-sm font-medium mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
