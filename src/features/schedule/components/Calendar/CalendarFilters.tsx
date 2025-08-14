"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarFiltersState, StaffOption } from "@/features/schedule/types";

type Props = {
  staffOptions: StaffOption[];
  value: CalendarFiltersState;
  onChange: (next: CalendarFiltersState) => void;
};

export default function CalendarFilters({
  staffOptions,
  value,
  onChange,
}: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-40">
        <Select
          value={value.staffId ?? "all"}
          onValueChange={(v) =>
            onChange({ ...value, staffId: v === "all" ? null : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="직원" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {staffOptions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-40">
        <Select
          value={value.position ?? "all"}
          onValueChange={(v) =>
            onChange({ ...value, position: v === "all" ? null : v })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="포지션" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="barista">바리스타</SelectItem>
            <SelectItem value="kitchen">주방</SelectItem>
            <SelectItem value="hall">홀</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
