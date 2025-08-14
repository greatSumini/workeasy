"use client";

import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
} from "date-fns";
import { Shift } from "@/features/schedule/types";
import ShiftCard from "./ShiftCard";

type Props = {
  date: Date;
  shifts: Shift[];
  userNameMap?: Record<string, string>;
};

export default function WeekView({ date, shifts, userNameMap }: Props) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((d) => (
        <div key={d.toISOString()} className="rounded border p-2">
          <div className="mb-2 text-sm font-medium">
            {format(d, "M/d (EEE)")}
          </div>
          <div className="flex flex-col gap-2">
            {shifts
              .filter(
                (s) =>
                  isSameDay(new Date(s.start_time), d) ||
                  isSameDay(new Date(s.end_time), d)
              )
              .map((s) => (
                <ShiftCard key={s.id} shift={s} userNameMap={userNameMap} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
