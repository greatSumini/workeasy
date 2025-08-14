"use client";

import {
  eachHourOfInterval,
  endOfDay,
  format,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { Shift, StaffOption } from "@/features/schedule/types";
import ShiftCard from "./ShiftCard";

type Props = {
  date: Date;
  shifts: Shift[];
  userNameMap?: Record<string, string>;
  staffOptions?: StaffOption[];
};

export default function DayView({
  date,
  shifts,
  userNameMap,
  staffOptions,
}: Props) {
  const hours = eachHourOfInterval({
    start: startOfDay(date),
    end: endOfDay(date),
  });
  return (
    <div className="grid grid-cols-1">
      {hours.map((h) => (
        <div key={h.toISOString()} className="border-b py-2">
          <div className="text-xs text-muted-foreground mb-2">
            {format(h, "HH:00")}
          </div>
          <div className="flex flex-wrap gap-2">
            {shifts
              .filter((s) =>
                isWithinInterval(h, {
                  start: new Date(s.start_time),
                  end: new Date(s.end_time),
                })
              )
              .map((s) => (
                <ShiftCard
                  key={s.id}
                  shift={s}
                  userNameMap={userNameMap}
                  staffOptions={staffOptions}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
