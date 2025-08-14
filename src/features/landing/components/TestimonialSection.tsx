"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MessageSquare,
  BarChart3,
  Shield,
  Filter,
} from "lucide-react";

type TestimonialData = {
  id: string;
  name: string;
  role: string;
  company: string;
  storeType: "cafe" | "restaurant" | "bakery" | "franchise";
  content: string;
  highlight: string;
  relatedFeature: "scheduling" | "exchange" | "analytics" | "prevention";
  metrics?: {
    label: string;
    value: string;
  };
  avatar: string;
};

const TESTIMONIALS: TestimonialData[] = [
  {
    id: "minji",
    name: "김민지",
    role: "점장",
    company: "스타벅스 DT점",
    storeType: "cafe",
    content:
      "workeasy 도입 후 매주 3시간씩 스케줄 짜느라 머리 아팠던 시간이 완전히 사라졌어요. 이제는 클릭 몇 번이면 AI가 알아서 최적의 스케줄을 만들어줍니다. 직원들도 언제든 앱으로 확인할 수 있어서 '언제 출근이에요?' 같은 질문이 완전히 없어졌죠.",
    highlight: "스케줄 작성 시간 90% 단축",
    relatedFeature: "scheduling",
    metrics: {
      label: "주간 절약 시간",
      value: "2.5시간",
    },
    avatar: "https://picsum.photos/seed/minji/120/120",
  },
  {
    id: "junho",
    name: "이준호",
    role: "사장님",
    company: "이디야커피 송파점",
    storeType: "cafe",
    content:
      "대학생 알바들이 갑자기 시험이다 수업이다 하면서 근무 바꿔달라고 할 때마다 골치 아팠는데, 이제는 푸시 알림 하나로 1초 만에 승인이 끝나네요. 다른 직원들한테도 바로 알림이 가니까 혼선도 없고요. 정말 신세계예요.",
    highlight: "교환 처리 시간 95% 단축",
    relatedFeature: "exchange",
    metrics: {
      label: "평균 처리 시간",
      value: "1.2초",
    },
    avatar: "https://picsum.photos/seed/junho/120/120",
  },
  {
    id: "seoyeon",
    name: "박서연",
    role: "매니저",
    company: "투썸플레이스 강남점",
    storeType: "cafe",
    content:
      "근무 공백 때문에 갑자기 매장 문을 못 열거나 혼자서 매장을 지켜야 하는 일이 한 달에 2-3번은 있었어요. 하지만 workeasy를 쓴 후로는 단 한 번도 그런 일이 없었습니다. 시스템이 미리 위험을 알려주니까 대체 인력을 미리 준비할 수 있거든요.",
    highlight: "근무 공백 100% 해결",
    relatedFeature: "prevention",
    metrics: {
      label: "공백 발생률",
      value: "0%",
    },
    avatar: "https://picsum.photos/seed/seoyeon/120/120",
  },
  {
    id: "hyunwoo",
    name: "정현우",
    role: "점장",
    company: "파리바게뜨 논현점",
    storeType: "bakery",
    content:
      "매월 인건비 계산하고 근무 시간 정리하는 것도 일이었는데, 이제는 대시보드에서 모든 걸 한눈에 볼 수 있어요. 어느 요일에 인력이 부족한지, 누가 오버타임을 많이 하는지 바로 파악되니까 경영 효율성이 확실히 올라갔습니다.",
    highlight: "경영 효율성 40% 개선",
    relatedFeature: "analytics",
    metrics: {
      label: "데이터 정리 시간",
      value: "80% 절약",
    },
    avatar: "https://picsum.photos/seed/hyunwoo/120/120",
  },
];

const STORE_TYPE_FILTERS = [
  { id: "all", label: "전체", icon: Filter },
  { id: "cafe", label: "카페", icon: MessageSquare },
  { id: "restaurant", label: "레스토랑", icon: Calendar },
  { id: "bakery", label: "베이커리", icon: BarChart3 },
  { id: "franchise", label: "프랜차이즈", icon: Shield },
];

const FEATURE_ICONS = {
  scheduling: Calendar,
  exchange: MessageSquare,
  analytics: BarChart3,
  prevention: Shield,
};

export default function TestimonialSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredTestimonials =
    selectedFilter === "all"
      ? TESTIMONIALS
      : TESTIMONIALS.filter((t) => t.storeType === selectedFilter);

  const mainTestimonial =
    filteredTestimonials[currentTestimonial] || TESTIMONIALS[0];
  const FeatureIcon = FEATURE_ICONS[mainTestimonial.relatedFeature];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % filteredTestimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      (prev) =>
        (prev - 1 + filteredTestimonials.length) % filteredTestimonials.length
    );
  };

  return (
    <div className="space-y-8">
      {/* 필터 버튼들 */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {STORE_TYPE_FILTERS.map((filter) => (
          <Button
            key={filter.id}
            variant={selectedFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedFilter(filter.id);
              setCurrentTestimonial(0);
            }}
            className={`flex items-center gap-2 ${
              selectedFilter === filter.id ? "" : "glass-subtle hover:glass"
            }`}
          >
            <filter.icon className="h-4 w-4" />
            {filter.label}
          </Button>
        ))}
      </div>

      {/* 메인 후기 스토리 */}
      <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
        {/* 좌측: 프로필과 메트릭 */}
        <div className="glass glass-animation rounded-2xl p-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Image
                src={mainTestimonial.avatar}
                alt={mainTestimonial.name}
                width={120}
                height={120}
                className="rounded-full glass border-4 border-white shadow-lg"
              />
              <div className="absolute -bottom-2 -right-2 glass-strong rounded-full p-2">
                <FeatureIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                {mainTestimonial.name}
              </h3>
              <p className="text-gray-600 mb-1">{mainTestimonial.role}</p>
              <p className="text-sm text-gray-500 mb-4">
                {mainTestimonial.company}
              </p>

              {/* 핵심 지표 */}
              <div className="glass-subtle rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  {mainTestimonial.metrics?.label}
                </div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {mainTestimonial.metrics?.value}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 후기 내용 */}
        <div className="glass glass-animation rounded-2xl p-8">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {mainTestimonial.highlight}
            </span>
          </div>

          <blockquote className="text-lg leading-relaxed text-gray-700 mb-6">
            &ldquo;{mainTestimonial.content}&rdquo;
          </blockquote>

          {/* 네비게이션 */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={prevTestimonial}
              disabled={filteredTestimonials.length <= 1}
              className="glass-subtle hover:glass"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2">
              {filteredTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentTestimonial
                      ? "bg-blue-600 w-6"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextTestimonial}
              disabled={filteredTestimonials.length <= 1}
              className="glass-subtle hover:glass"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 다른 후기들 미리보기 */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-center">
          다른 매장의 이야기도 궁금하다면
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {filteredTestimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`glass-subtle glass-animation rounded-xl p-4 cursor-pointer transition-all duration-300 ${
                index === currentTestimonial
                  ? "ring-2 ring-blue-500"
                  : "hover:glass"
              }`}
              onClick={() => setCurrentTestimonial(index)}
              onMouseEnter={() => setHoveredCard(testimonial.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">
                    {testimonial.company}
                  </div>
                </div>

                {/* 호버 시 관련 기능 아이콘 표시 */}
                {hoveredCard === testimonial.id && (
                  <div className="glass rounded-lg p-1">
                    <FeatureIcon className="h-4 w-4 text-blue-600" />
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600 line-clamp-2">
                {testimonial.content.slice(0, 60)}...
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
