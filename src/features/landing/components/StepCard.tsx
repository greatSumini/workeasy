"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

export type StepItem = {
  step: number;
  icon: LucideIcon;
  title: string;
  description: string;
  timeIndicator?: string;
};

type StepCardProps = StepItem & {
  isLast?: boolean;
  className?: string;
};

export default function StepCard({
  step,
  icon: Icon,
  title,
  description,
  timeIndicator,
  isLast = false,
  className,
}: StepCardProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* 연결선 (데스크톱) */}
      {!isLast && (
        <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent -translate-y-1/2 z-0" />
      )}

      {/* 카드 본체 */}
      <div className="relative z-10 glass-subtle glass-animation rounded-2xl p-6 hover:glass text-center md:text-left">
        {/* 스텝 번호 */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg mb-4">
          {step}
        </div>

        {/* 아이콘과 제목 */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 mb-3">
          <div className="glass rounded-xl p-3">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{title}</h3>
            {timeIndicator && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                {timeIndicator}
              </span>
            )}
          </div>
        </div>

        {/* 설명 */}
        <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      </div>

      {/* 연결선 (모바일) */}
      {!isLast && (
        <div className="md:hidden absolute left-1/2 top-full h-8 w-0.5 bg-gradient-to-b from-gray-300 to-transparent -translate-x-1/2" />
      )}
    </div>
  );
}
