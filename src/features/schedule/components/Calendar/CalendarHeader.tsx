"use client";

import { addDays, addMonths, addWeeks, format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarViewMode, StaffOption } from "@/features/schedule/types";
import { ShiftFormModal } from "@/features/schedule/components/Forms/ShiftFormModal";
import { useUserRole } from "@/hooks/use-user-role";
import { useState } from "react";

type Props = {
  currentDate: Date;
  onChangeDate: (next: Date) => void;
  mode: CalendarViewMode;
  onChangeMode: (mode: CalendarViewMode) => void;
  storeId?: string;
  staffOptions?: StaffOption[];
};

export default function CalendarHeader({
  currentDate,
  onChangeDate,
  mode,
  onChangeMode,
  storeId,
  staffOptions,
}: Props) {
  const { data: role } = useUserRole();
  const [open, setOpen] = useState(false);
  const goPrev = () => {
    const next =
      mode === "day"
        ? addDays(currentDate, -1)
        : mode === "week"
          ? addWeeks(currentDate, -1)
          : addMonths(currentDate, -1);
    onChangeDate(next);
  };
  const goNext = () => {
    const next =
      mode === "day"
        ? addDays(currentDate, 1)
        : mode === "week"
          ? addWeeks(currentDate, 1)
          : addMonths(currentDate, 1);
    onChangeDate(next);
  };
  const goToday = () => onChangeDate(new Date());

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={goPrev} aria-label="이전">
          이전
        </Button>
        <Button variant="secondary" onClick={goToday} aria-label="오늘">
          오늘
        </Button>
        <Button variant="secondary" onClick={goNext} aria-label="다음">
          다음
        </Button>
      </div>
      <div className="text-lg font-semibold">
        {format(
          currentDate,
          mode === "month" ? "yyyy년 M월" : "yyyy년 M월 d일"
        )}
      </div>
      <div className="w-32 flex items-center gap-2">
        <Select
          value={mode}
          onValueChange={(v) => onChangeMode(v as CalendarViewMode)}
        >
          <SelectTrigger>
            <SelectValue placeholder="뷰" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">일</SelectItem>
            <SelectItem value="week">주</SelectItem>
            <SelectItem value="month">월</SelectItem>
          </SelectContent>
        </Select>
        {role === "manager" && storeId && (
          <button
            className="px-3 py-2 rounded-md glass-subtle hover:glass text-sm"
            onClick={() => setOpen(true)}
          >
            근무 추가
          </button>
        )}
      </div>
      <ShiftFormModal
        open={open}
        onOpenChange={setOpen}
        title="근무 추가"
        defaultValues={{ store_id: storeId ?? "" }}
        staffOptions={staffOptions ?? []}
      />
    </div>
  );
}
