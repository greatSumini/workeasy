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
import { CalendarViewMode } from "@/features/schedule/types";

type Props = {
  currentDate: Date;
  onChangeDate: (next: Date) => void;
  mode: CalendarViewMode;
  onChangeMode: (mode: CalendarViewMode) => void;
};

export default function CalendarHeader({
  currentDate,
  onChangeDate,
  mode,
  onChangeMode,
}: Props) {
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
      <div className="w-32">
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
      </div>
    </div>
  );
}
