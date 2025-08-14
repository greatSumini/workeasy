"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Shift } from "@/features/schedule/types";
import ShiftCard from "./ShiftCard";

type Props = {
  date: Date;
  shifts: Shift[];
};

export default function MonthView({ date, shifts }: Props) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => (
        <div key={d.toISOString()} className="rounded border p-2 min-h-28">
          <div className="mb-2 text-xs font-medium opacity-80">
            {format(d, "d")}
            {!isSameMonth(d, date) && (
              <span className="ml-1 opacity-50">•</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {shifts
              .filter((s) => isSameDay(new Date(s.startAt), d))
              .map((s) => (
                <ShiftCard key={s.id} shift={s} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
