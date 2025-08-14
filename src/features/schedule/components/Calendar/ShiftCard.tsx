"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Shift } from "@/features/schedule/types";
import { cn } from "@/lib/utils";

type Props = {
  shift: Shift;
  className?: string;
};

export default function ShiftCard({ shift, className }: Props) {
  const start = new Date(shift.startAt);
  const end = new Date(shift.endAt);
  return (
    <Card className={cn("p-2 text-sm", className)}>
      <div className="font-medium">{shift.staffName}</div>
      <div className="text-xs text-muted-foreground">
        {format(start, "HH:mm")} - {format(end, "HH:mm")}
      </div>
      {shift.position && <div className="mt-1 text-xs">{shift.position}</div>}
    </Card>
  );
}
