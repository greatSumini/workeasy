export type Shift = {
  id: string;
  staffId: string;
  staffName: string;
  position?: string | null;
  startAt: string; // ISO string
  endAt: string; // ISO string
};

export type StaffOption = {
  id: string;
  name: string;
};

export type CalendarFiltersState = {
  staffId: string | null;
  position: string | null;
};

export type CalendarViewMode = "day" | "week" | "month";
