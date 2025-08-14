"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, Zap } from "lucide-react";

type SandboxProps = {
  type: "scheduling" | "exchange" | "analytics";
  title: string;
  description: string;
};

const SANDBOX_CONTENT = {
  scheduling: {
    initialCode: `// AI 자동 스케줄링 시뮬레이션
const staff = [
  { name: "김지수", skills: ["바리스타", "캐셔"], availability: ["09:00-17:00"] },
  { name: "이현우", skills: ["바리스타"], availability: ["14:00-22:00"] },
  { name: "박서연", skills: ["캐셔", "청소"], availability: ["06:00-14:00"] }
];

function generateOptimalSchedule() {
  // Tab을 눌러 AI 자동완성을 체험해보세요!
  
}`,
    suggestions: [
      "return staff.map(person => ({",
      "  name: person.name,",
      "  shift: assignOptimalShift(person),",
      "  position: selectBestPosition(person.skills)",
      "}));",
    ],
    result: "✅ 최적 스케줄 생성 완료! 노동법 준수 100%",
  },
  exchange: {
    initialCode: `// 1초 교환 시스템 시뮬레이션
function handleShiftExchange() {
  const request = {
    from: "김지수",
    to: "이현우", 
    date: "2024-03-15",
    shift: "14:00-22:00"
  };
  
  // Tab을 눌러 1초 승인 프로세스를 확인하세요!
  
}`,
    suggestions: [
      "sendPushNotification(manager);",
      "await managerApproval(); // 평균 1.2초",
      "updateAllCalendars();",
      "notifyTeamMembers();",
    ],
    result: "⚡ 교환 승인 완료! 모든 팀원에게 실시간 동기화",
  },
  analytics: {
    initialCode: `// 실시간 분석 대시보드
const weeklyData = {
  totalHours: 340,
  laborCost: 2890000,
  efficiency: 94,
  gapRisk: 0
};

function generateInsights() {
  // Tab을 눌러 AI 인사이트를 확인하세요!
  
}`,
    suggestions: [
      "const insights = analyzePattern(weeklyData);",
      "return {",
      "  recommendation: '화요일 오후 인력 1명 추가 권장',",
      "  costOptimization: '월 15% 절약 가능'",
    ],
    result: "📊 경영 인사이트 생성! 다음 주 예상 매출 12% 증가",
  },
};

export default function InteractiveSandbox({
  type,
  title,
  description,
}: SandboxProps) {
  const [code, setCode] = useState(SANDBOX_CONTENT[type].initialCode);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [typedSuggestion, setTypedSuggestion] = useState("");
  const codeRef = useRef<HTMLTextAreaElement>(null);

  const handleTabCompletion = () => {
    if (showResult) return;

    setIsTyping(true);
    const suggestions = SANDBOX_CONTENT[type].suggestions;
    const suggestion = suggestions[currentSuggestion];

    let index = 0;
    const typeInterval = setInterval(() => {
      setTypedSuggestion(suggestion.slice(0, index + 1));
      index++;

      if (index >= suggestion.length) {
        clearInterval(typeInterval);
        setTimeout(() => {
          const newCode = code + "\n  " + suggestion;
          setCode(newCode);
          setTypedSuggestion("");

          if (currentSuggestion < suggestions.length - 1) {
            setCurrentSuggestion((prev) => prev + 1);
          } else {
            setShowResult(true);
          }
          setIsTyping(false);
        }, 500);
      }
    }, 50);
  };

  const resetDemo = () => {
    setCode(SANDBOX_CONTENT[type].initialCode);
    setCurrentSuggestion(0);
    setShowResult(false);
    setTypedSuggestion("");
    setIsTyping(false);
  };

  return (
    <div className="glass glass-animation rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={resetDemo}
          className="glass-subtle hover:glass"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* 미니 코드 에디터 */}
      <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm mb-4">
        <div className="text-green-400 mb-2">// workeasy 시뮬레이터</div>
        <textarea
          ref={codeRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full bg-transparent text-gray-100 resize-none outline-none"
          rows={12}
          placeholder="코드를 입력하세요..."
        />

        {/* 실시간 자동완성 표시 */}
        {isTyping && typedSuggestion && (
          <div className="text-blue-400 animate-pulse">
            {"  " + typedSuggestion}
            <span className="animate-pulse">|</span>
          </div>
        )}
      </div>

      {/* 인터랙션 버튼 */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          onClick={handleTabCompletion}
          disabled={isTyping || showResult}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          Tab으로 AI 완성
        </Button>

        <div className="text-xs text-gray-500">
          {showResult
            ? "완료!"
            : `${currentSuggestion + 1}/${SANDBOX_CONTENT[type].suggestions.length} 단계`}
        </div>
      </div>

      {/* 결과 표시 */}
      {showResult && (
        <div className="glass-subtle rounded-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              {SANDBOX_CONTENT[type].result}
            </span>
          </div>
        </div>
      )}

      {/* 사용법 안내 */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        💡 실제 workeasy에서는 더욱 강력한 AI 기능을 제공합니다
      </div>
    </div>
  );
}
