"use client";

import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { Shift, ShiftFilters, GetShiftsResponse } from "./types";

// Supabase 클라이언트 인스턴스
const supabase = createClient();

// Query Keys
export const SCHEDULE_QUERY_KEYS = {
  all: ["schedule"] as const,
  shifts: () => [...SCHEDULE_QUERY_KEYS.all, "shifts"] as const,
  shift: (id: string) => [...SCHEDULE_QUERY_KEYS.shifts(), id] as const,
  shiftsWithFilters: (storeId: string, filters: ShiftFilters) =>
    [...SCHEDULE_QUERY_KEYS.shifts(), "filtered", storeId, filters] as const,
  myShifts: (userId: string, dateRange?: { start: string; end: string }) =>
    [...SCHEDULE_QUERY_KEYS.shifts(), "my", userId, dateRange] as const,
  shiftsByDate: (storeId: string, startDate: string, endDate: string) =>
    [
      ...SCHEDULE_QUERY_KEYS.shifts(),
      "date-range",
      storeId,
      startDate,
      endDate,
    ] as const,
};

// API Functions
export async function getShifts(
  storeId: string,
  filters: ShiftFilters = {}
): Promise<GetShiftsResponse> {
  let query = supabase
    .from("shifts")
    .select("*")
    .eq("store_id", storeId)
    .order("start_time", { ascending: true });

  // 필터 적용
  if (filters.startDate) {
    query = query.gte("start_time", filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte("start_time", filters.endDate);
  }
  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.position) {
    query = query.eq("position", filters.position);
  }
  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`근무 조회에 실패했습니다: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || undefined,
  };
}

export async function getMyShifts(
  userId: string,
  dateRange?: { start: string; end: string }
): Promise<GetShiftsResponse> {
  let query = supabase
    .from("shifts")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });

  if (dateRange) {
    query = query
      .gte("start_time", dateRange.start)
      .lte("start_time", dateRange.end);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`내 근무 조회에 실패했습니다: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || undefined,
  };
}

export async function getShiftsByDate(
  storeId: string,
  startDate: string,
  endDate: string
): Promise<GetShiftsResponse> {
  const { data, error, count } = await supabase
    .from("shifts")
    .select("*")
    .eq("store_id", storeId)
    .gte("start_time", startDate)
    .lte("end_time", endDate)
    .order("start_time", { ascending: true });

  if (error) {
    throw new Error(`기간별 근무 조회에 실패했습니다: ${error.message}`);
  }

  return {
    data: data || [],
    count: count || undefined,
  };
}

export async function getShift(shiftId: string): Promise<Shift> {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("id", shiftId)
    .single();

  if (error) {
    throw new Error(`근무 정보 조회에 실패했습니다: ${error.message}`);
  }

  if (!data) {
    throw new Error("근무 정보를 찾을 수 없습니다.");
  }

  return data;
}

// Profiles
export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export async function getProfilesByIds(ids: string[]): Promise<UserProfile[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", ids);
  if (error) {
    throw new Error(`프로필 조회에 실패했습니다: ${error.message}`);
  }
  return (data ?? []) as UserProfile[];
}

export function useProfilesByIds(ids: string[]) {
  return useQuery({
    queryKey: ["profiles-by-ids", ids.sort().join(",")],
    queryFn: () => getProfilesByIds(ids),
    enabled: ids.length > 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 20,
    retry: (failureCount, error) => {
      if (
        error.message.includes("auth") ||
        error.message.includes("permission")
      ) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

// React Query Hooks
export function useShifts(storeId: string, filters: ShiftFilters = {}) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.shiftsWithFilters(storeId, filters),
    queryFn: () => getShifts(storeId, filters),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분 (기존 cacheTime)
    enabled: !!storeId,
    retry: (failureCount, error) => {
      // 인증 오류나 권한 오류는 재시도하지 않음
      if (
        error.message.includes("auth") ||
        error.message.includes("permission")
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useMyShifts(
  userId: string,
  dateRange?: { start: string; end: string }
) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.myShifts(userId, dateRange),
    queryFn: () => getMyShifts(userId, dateRange),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    enabled: !!userId,
    retry: (failureCount, error) => {
      if (
        error.message.includes("auth") ||
        error.message.includes("permission")
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useShiftsByDate(
  storeId: string,
  startDate: string,
  endDate: string
) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.shiftsByDate(storeId, startDate, endDate),
    queryFn: () => getShiftsByDate(storeId, startDate, endDate),
    staleTime: 1000 * 60 * 3, // 3분 (날짜별 조회는 좀 더 자주 갱신)
    gcTime: 1000 * 60 * 10, // 10분
    enabled: !!storeId && !!startDate && !!endDate,
    retry: (failureCount, error) => {
      if (
        error.message.includes("auth") ||
        error.message.includes("permission")
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useShift(shiftId: string) {
  return useQuery({
    queryKey: SCHEDULE_QUERY_KEYS.shift(shiftId),
    queryFn: () => getShift(shiftId),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    enabled: !!shiftId,
    retry: (failureCount, error) => {
      if (
        error.message.includes("auth") ||
        error.message.includes("permission")
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

// Utility Hooks for Cache Management
export function useScheduleInvalidation() {
  const queryClient = useQueryClient();

  const invalidateAllShifts = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: SCHEDULE_QUERY_KEYS.shifts(),
    });
  }, [queryClient]);

  const invalidateShifts = useCallback(
    (storeId: string) => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shiftsWithFilters(storeId, {}),
      });
    },
    [queryClient]
  );

  const invalidateMyShifts = useCallback(
    (userId: string) => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.myShifts(userId),
      });
    },
    [queryClient]
  );

  const invalidateShift = useCallback(
    (shiftId: string) => {
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shift(shiftId),
      });
    },
    [queryClient]
  );

  return {
    invalidateAllShifts,
    invalidateShifts,
    invalidateMyShifts,
    invalidateShift,
  };
}

// Performance monitoring utility
export function logApiPerformance(operation: string, startTime: number) {
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 500) {
    console.warn(
      `⚠️ Schedule API 성능 경고: ${operation} 작업이 ${duration.toFixed(2)}ms 소요되었습니다.`
    );
  } else {
    console.log(
      `✅ Schedule API: ${operation} 작업이 ${duration.toFixed(2)}ms 내에 완료되었습니다.`
    );
  }
}
