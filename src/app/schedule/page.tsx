"use client";

import { useMemo } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import AuthGuard from "@/components/auth/AuthGuard";
import CalendarView from "@/features/schedule/components/Calendar/CalendarView";
import { useShifts } from "@/features/schedule/api";
import { useCurrentStore } from "@/hooks/use-current-store";
import { StaffOption } from "@/features/schedule/types";

export default function SchedulePage() {
  return (
    <AuthGuard>
      <ScheduleContent />
    </AuthGuard>
  );
}

function ScheduleContent() {
  const {
    data: store,
    isLoading: storeLoading,
    error: storeError,
  } = useCurrentStore();

  // 현재 주의 시작과 끝 날짜 계산 (기본 데이터 로딩용)
  const currentDate = new Date();
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // 일요일 시작
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 }); // 토요일 끝

  const defaultFilters = useMemo(
    () => ({
      startDate: format(weekStart, "yyyy-MM-dd"),
      endDate: format(weekEnd, "yyyy-MM-dd"),
    }),
    [weekStart, weekEnd]
  );

  const {
    data: shiftsResponse,
    isLoading: shiftsLoading,
    error: shiftsError,
  } = useShifts(store?.id || "", defaultFilters);

  // 직원 옵션 생성 (근무 데이터에서 추출)
  const staffOptions: StaffOption[] = useMemo(() => {
    if (!shiftsResponse?.data) return [];

    const staffMap = new Map<string, StaffOption>();

    shiftsResponse.data.forEach((shift) => {
      if (shift.user_id && shift.user) {
        const staffName = shift.user.user_metadata?.name || shift.user.email;
        staffMap.set(shift.user_id, {
          id: shift.user_id,
          name: staffName,
        });
      }
    });

    return Array.from(staffMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [shiftsResponse?.data]);

  // 로딩 상태
  if (storeLoading) {
    return (
      <main className="min-h-screen ios-gradient flex items-center justify-center">
        <div className="glass glass-animation rounded-2xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="text-lg font-medium">
              매장 정보를 불러오는 중...
            </span>
          </div>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (storeError) {
    return (
      <main className="min-h-screen ios-gradient flex items-center justify-center">
        <div className="glass glass-animation rounded-2xl p-8 text-center">
          <div className="text-red-600 mb-4">
            매장 정보를 불러올 수 없습니다
          </div>
          <div className="text-sm text-gray-600">{storeError.message}</div>
        </div>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="min-h-screen ios-gradient flex items-center justify-center">
        <div className="glass glass-animation rounded-2xl p-8 text-center">
          <div className="text-gray-600 mb-4">매장 정보를 찾을 수 없습니다</div>
          <div className="text-sm text-gray-500">
            관리자에게 문의하거나 매장에 속해있는지 확인해 주세요.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6">
        <header className="glass-strong glass-animation rounded-2xl p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            근무 캘린더
          </h1>
          <p className="text-muted-foreground mt-2">
            {store.name} 매장의 근무 일정을 확인하고 관리하세요
          </p>
        </header>

        {shiftsLoading ? (
          <div className="glass glass-animation rounded-2xl p-8">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="text-medium">근무 일정을 불러오는 중...</span>
            </div>
          </div>
        ) : shiftsError ? (
          <div className="glass glass-animation rounded-2xl p-8 text-center">
            <div className="text-red-600 mb-2">
              근무 일정을 불러올 수 없습니다
            </div>
            <div className="text-sm text-gray-600">{shiftsError.message}</div>
          </div>
        ) : (
          <div className="glass glass-animation rounded-2xl p-6">
            <CalendarView
              shifts={shiftsResponse?.data || []}
              staffOptions={staffOptions}
              storeId={store.id}
            />
          </div>
        )}
      </div>
    </main>
  );
}
