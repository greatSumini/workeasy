"use client";

import { createClient } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type {
  Shift,
  ShiftFilters,
  GetShiftsResponse,
  UpsertShiftInput,
  DeleteShiftInput,
  StaffOption,
} from "./types";

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

// 매장의 직원 목록 조회
export async function getStoreStaff(storeId: string): Promise<StaffOption[]> {
  const { data, error } = await supabase
    .from("store_users")
    .select(
      `
      user_id,
      users:auth.users!store_users_user_id_fkey(id, email, raw_user_meta_data)
    `
    )
    .eq("store_id", storeId);

  if (error) {
    throw new Error(`직원 목록 조회에 실패했습니다: ${error.message}`);
  }

  return (data || []).map((item: any) => ({
    id: item.user_id,
    name:
      item.users?.raw_user_meta_data?.name || item.users?.email || "이름 없음",
  }));
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

export function useStoreStaff(storeId: string) {
  return useQuery({
    queryKey: ["store-staff", storeId],
    queryFn: () => getStoreStaff(storeId),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
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
    queryFn: async () => {
      // 현재 사용자 ID 자동 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("사용자 인증이 필요합니다.");
      return getMyShifts(user.id, dateRange);
    },
    staleTime: 1000 * 60 * 10, // 10분으로 증가
    gcTime: 1000 * 60 * 15, // 15분으로 증가
    enabled: !!userId && userId !== "", // 빈 문자열 체크 추가
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

// ----- Mutations -----
export async function checkShiftOverlap(
  storeId: string,
  userId: string | null,
  startIso: string,
  endIso: string,
  excludeId?: string
): Promise<boolean> {
  // 같은 매장 내 같은 유저의 시간이 겹치는지 간단 체크 (userId 없으면 매장 기준으로만 확인)
  let q = supabase
    .from("shifts")
    .select("id, user_id, start_time, end_time")
    .eq("store_id", storeId)
    .lte("start_time", endIso)
    .gte("end_time", startIso);

  if (userId) q = q.eq("user_id", userId);
  if (excludeId) q = q.neq("id", excludeId);

  const { data, error } = await q;
  if (error) throw new Error(`중복 검사 실패: ${error.message}`);
  return (data ?? []).length > 0;
}

export async function upsertShift(input: UpsertShiftInput): Promise<Shift> {
  const overlap = await checkShiftOverlap(
    input.store_id,
    input.user_id,
    input.start_time,
    input.end_time,
    input.id
  );
  if (overlap) {
    throw new Error("동일 시간대에 겹치는 근무가 있습니다.");
  }

  if (input.id) {
    const { data, error } = await supabase
      .from("shifts")
      .update({
        user_id: input.user_id,
        start_time: input.start_time,
        end_time: input.end_time,
        position: input.position ?? null,
        status: input.status ?? "pending",
        notes: input.notes ?? null,
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw new Error(`근무 수정 실패: ${error.message}`);
    return data as Shift;
  }

  const { data, error } = await supabase
    .from("shifts")
    .insert({
      store_id: input.store_id,
      user_id: input.user_id,
      start_time: input.start_time,
      end_time: input.end_time,
      position: input.position ?? null,
      status: input.status ?? "pending",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(`근무 생성 실패: ${error.message}`);
  return data as Shift;
}

export async function deleteShift(input: DeleteShiftInput): Promise<void> {
  const { error } = await supabase
    .from("shifts")
    .delete()
    .eq("id", input.id)
    .eq("store_id", input.store_id);
  if (error) throw new Error(`근무 삭제 실패: ${error.message}`);
}

// ----- Convenience CRUD wrappers -----
export type CreateShiftInput = Omit<UpsertShiftInput, "id">;
export type UpdateShiftInput = UpsertShiftInput & { id: string };

export async function createShift(input: CreateShiftInput): Promise<Shift> {
  return upsertShift({ ...input });
}

export async function updateShift(input: UpdateShiftInput): Promise<Shift> {
  return upsertShift(input);
}

// ----- React Query Mutations with Optimistic Updates -----
function applyOptimisticAdd(
  old: unknown,
  optimistic: Shift,
  storeId: string
): unknown {
  if (!old || typeof old !== "object") return old;
  const anyOld = old as any;
  if (Array.isArray(anyOld)) return anyOld; // not our shape
  if (Array.isArray(anyOld.data)) {
    // 필터 일치 여부 확인 어려움 → 최소 변경: 동일 store 의 리스트에만 추가 시도
    if (optimistic.store_id === storeId) {
      return { ...anyOld, data: [optimistic, ...anyOld.data] };
    }
  }
  return old;
}

function applyOptimisticUpdate(old: unknown, updated: Shift): unknown {
  if (!old || typeof old !== "object") return old;
  const anyOld = old as any;
  if (Array.isArray(anyOld)) return anyOld;
  if (Array.isArray(anyOld.data)) {
    const idx = anyOld.data.findIndex?.((s: Shift) => s.id === updated.id);
    if (idx >= 0) {
      const next = anyOld.data.slice();
      next[idx] = { ...anyOld.data[idx], ...updated };
      return { ...anyOld, data: next };
    }
  }
  return old;
}

function applyOptimisticRemove(old: unknown, id: string): unknown {
  if (!old || typeof old !== "object") return old;
  const anyOld = old as any;
  if (Array.isArray(anyOld)) return anyOld;
  if (Array.isArray(anyOld.data)) {
    const next = anyOld.data.filter?.((s: Shift) => s.id !== id);
    return { ...anyOld, data: next };
  }
  return old;
}

export function useCreateShift(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateShiftInput) => createShift(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      const previous = queryClient.getQueriesData({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      const optimistic: Shift = {
        id: `temp-${Date.now()}`,
        store_id: input.store_id,
        user_id: input.user_id,
        start_time: input.start_time,
        end_time: input.end_time,
        position: input.position ?? null,
        status: input.status ?? "pending",
        notes: input.notes ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as Shift;
      for (const [key, data] of previous) {
        queryClient.setQueryData(key, (old) =>
          applyOptimisticAdd(old, optimistic, storeId)
        );
      }
      return { previous, tempId: optimistic.id };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.previous) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: (created, _vars, ctx) => {
      // temp 항목 교체
      const queries = queryClient.getQueriesData({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      for (const [key, data] of queries) {
        queryClient.setQueryData(key, (old) =>
          applyOptimisticUpdate(old, created)
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
    },
  });
}

export function useUpdateShift(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateShiftInput) => updateShift(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      const previous = queryClient.getQueriesData({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      // 낙관적 적용
      for (const [key, data] of previous) {
        queryClient.setQueryData(key, (old) =>
          applyOptimisticUpdate(old, input as unknown as Shift)
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.previous) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: (updated) => {
      const queries = queryClient.getQueriesData({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      for (const [key, data] of queries) {
        queryClient.setQueryData(key, (old) =>
          applyOptimisticUpdate(old, updated)
        );
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
    },
  });
}

export function useDeleteShift(storeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: DeleteShiftInput) => deleteShift(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      const previous = queryClient.getQueriesData({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
      for (const [key, data] of previous) {
        queryClient.setQueryData(key, (old) =>
          applyOptimisticRemove(old, input.id)
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [key, data] of ctx.previous) {
        queryClient.setQueryData(key, data);
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: SCHEDULE_QUERY_KEYS.shifts(),
      });
    },
  });
}
