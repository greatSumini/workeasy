export type ShiftStatus = "pending" | "confirmed";

export type Shift = {
  id: string;
  store_id: string;
  user_id: string | null;
  start_time: string; // ISO string
  end_time: string; // ISO string
  position?: string | null;
  status: ShiftStatus;
  notes?: string | null;
  original_shift_id?: string | null;
  replacement_user_id?: string | null;
  created_at: string;
  updated_at: string;
  // Join된 사용자 정보
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
  };
};

export type ShiftFilters = {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  userId?: string;
  position?: string;
  status?: ShiftStatus;
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

// API 응답 타입
export type GetShiftsResponse = {
  data: Shift[];
  count?: number;
};
