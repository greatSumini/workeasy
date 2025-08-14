"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import CalendarView from "@/features/schedule/components/Calendar/CalendarView";
import { Shift, StaffOption } from "@/features/schedule/types";

export default function SchedulePage() {
  // NOTE: T-013에서 실제 API 연동 예정. 현재는 빈 상태로 UI 구성
  const shifts: Shift[] = [];
  const staffOptions: StaffOption[] = [];

  return (
    <AuthGuard>
      <main className="p-4">
        <h1 className="text-2xl font-semibold mb-4">근무 캘린더</h1>
        <CalendarView shifts={shifts} staffOptions={staffOptions} />
      </main>
    </AuthGuard>
  );
}
