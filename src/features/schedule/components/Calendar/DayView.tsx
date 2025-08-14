"use client";

import {
  eachHourOfInterval,
  endOfDay,
  format,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { Shift } from "@/features/schedule/types";
import ShiftCard from "./ShiftCard";

type Props = {
  date: Date;
  shifts: Shift[];
};

export default function DayView({ date, shifts }: Props) {
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
                  start: new Date(s.startAt),
                  end: new Date(s.endAt),
                })
              )
              .map((s) => (
                <ShiftCard key={s.id} shift={s} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
