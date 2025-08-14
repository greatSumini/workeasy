"use client";

import { useMemo, useRef, useState } from "react";
import { addDays, addMonths, addWeeks } from "date-fns";
import {
  CalendarFiltersState,
  CalendarViewMode,
  Shift,
  StaffOption,
} from "@/features/schedule/types";
import CalendarHeader from "./CalendarHeader";
import CalendarFilters from "./CalendarFilters";
import DayView from "./DayView";
import WeekView from "./WeekView";
import MonthView from "./MonthView";

type Props = {
  initialDate?: Date;
  shifts: Shift[];
  staffOptions: StaffOption[];
};

export default function CalendarView({
  initialDate,
  shifts,
  staffOptions,
}: Props) {
  const [date, setDate] = useState<Date>(initialDate ?? new Date());
  const [mode, setMode] = useState<CalendarViewMode>("week");
  const [filters, setFilters] = useState<CalendarFiltersState>({
    staffId: null,
    position: null,
  });
  const touchStartXRef = useRef<number | null>(null);

  const filtered = useMemo(() => {
    return shifts.filter((s) => {
      if (filters.staffId && s.staffId !== filters.staffId) return false;
      if (filters.position && s.position !== filters.position) return false;
      return true;
    });
  }, [shifts, filters]);

  const shiftByMode = (direction: 1 | -1) => {
    if (mode === "day") setDate((d) => addDays(d, 1 * direction));
    else if (mode === "week") setDate((d) => addWeeks(d, 1 * direction));
    else setDate((d) => addMonths(d, 1 * direction));
  };

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartXRef.current = e.changedTouches[0]?.clientX ?? null;
  };
  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = (e) => {
    const startX = touchStartXRef.current;
    touchStartXRef.current = null;
    if (startX == null) return;
    const deltaX = (e.changedTouches[0]?.clientX ?? startX) - startX;
    const THRESHOLD = 40;
    if (Math.abs(deltaX) < THRESHOLD) return;
    if (deltaX < 0)
      shiftByMode(1); // swipe left → next
    else shiftByMode(-1); // swipe right → prev
  };

  return (
    <section
      className="space-y-4"
      id="calendar-container"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <CalendarHeader
        currentDate={date}
        onChangeDate={setDate}
        mode={mode}
        onChangeMode={setMode}
      />
      <CalendarFilters
        staffOptions={staffOptions}
        value={filters}
        onChange={setFilters}
      />
      <div>
        {mode === "day" && <DayView date={date} shifts={filtered} />}
        {mode === "week" && <WeekView date={date} shifts={filtered} />}
        {mode === "month" && <MonthView date={date} shifts={filtered} />}
      </div>
    </section>
  );
}
