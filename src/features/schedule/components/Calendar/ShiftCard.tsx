"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Shift } from "@/features/schedule/types";
import { cn } from "@/lib/utils";

type Props = {
  shift: Shift;
  className?: string;
  userNameMap?: Record<string, string>;
};

export default function ShiftCard({ shift, className, userNameMap }: Props) {
  const start = new Date(shift.start_time);
  const end = new Date(shift.end_time);
  const staffName =
    (shift.user_id && userNameMap?.[shift.user_id]) ||
    (shift.user_id ? "구성원" : "미배정");
  return (
    <Card className={cn("p-2 text-sm", className)}>
      <div className="font-medium">{staffName}</div>
      <div className="text-xs text-muted-foreground">
        {format(start, "HH:mm")} - {format(end, "HH:mm")}
      </div>
      {shift.position && <div className="mt-1 text-xs">{shift.position}</div>}
    </Card>
  );
}
