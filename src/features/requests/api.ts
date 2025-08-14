"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/hooks/use-user-role";
import type {
  RequestListItem,
  ExchangeRequest,
  CreateExchangeRequestInput,
  UpdateExchangeRequestInput,
} from "./types";
import { getProfilesByIds } from "@/features/schedule/api";

async function tryCount(
  table: string,
  filters: Record<string, unknown>
): Promise<number> {
  const supabase = createClient();
  // Build query dynamically
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value as any);
  }
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function getPendingCountForManager(userId: string): Promise<number> {
  const supabase = createClient();
  // Find first owned store
  const { data: stores } = await supabase
    .from("stores")
    .select("id, owner_id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);

  const storeId = stores?.[0]?.id;
  if (!storeId) return 0;

  const candidates = [
    { table: "requests", storeKey: "store_id", statusKey: "status" },
    { table: "shift_requests", storeKey: "store_id", statusKey: "status" },
    { table: "exchange_requests", storeKey: "store_id", statusKey: "status" },
  ];

  for (const c of candidates) {
    try {
      const count = await tryCount(c.table, {
        [c.storeKey]: storeId,
        [c.statusKey]: "pending",
      });
      return count;
    } catch (_e) {
      // try next candidate table silently
      continue;
    }
  }
  return 0;
}

async function getPendingCountForStaff(userId: string): Promise<number> {
  const candidates = [
    { table: "requests", userKey: "to_user_id", statusKey: "status" },
    { table: "shift_requests", userKey: "to_user_id", statusKey: "status" },
    { table: "exchange_requests", userKey: "receiver_id", statusKey: "status" },
  ];
  for (const c of candidates) {
    try {
      const count = await tryCount(c.table, {
        [c.userKey]: userId,
        [c.statusKey]: "pending",
      });
      return count;
    } catch (_e) {
      continue;
    }
  }
  return 0;
}

export function usePendingRequestCount(role: UserRole | null) {
  return useQuery<number>({
    queryKey: ["pending-request-count", role],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;
      if (role === "manager") return getPendingCountForManager(user.id);
      if (role === "staff") return getPendingCountForStaff(user.id);
      return 0;
    },
    staleTime: 30_000,
  });
}

async function fetchRequestsList(
  role: UserRole | null,
  storeId?: string
): Promise<RequestListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const candidates =
    role === "manager"
      ? [
          { table: "requests", filterKey: "store_id" },
          { table: "shift_requests", filterKey: "store_id" },
          { table: "exchange_requests", filterKey: "store_id" },
        ]
      : [
          { table: "requests", filterKey: "to_user_id" },
          { table: "shift_requests", filterKey: "to_user_id" },
          { table: "exchange_requests", filterKey: "receiver_id" },
        ];

  for (const c of candidates) {
    try {
      let query = supabase
        .from(c.table)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (role === "manager") {
        if (!storeId) return [];
        query = query.eq(c.filterKey, storeId);
      } else if (role === "staff") {
        query = query.eq(c.filterKey, user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const items: RequestListItem[] = (data as any[]).map((row) => ({
        id: String(row.id ?? row.request_id ?? row.uuid ?? ""),
        status: String(
          row.status ?? row.state ?? row.request_status ?? "unknown"
        ),
        createdAt: String(
          row.created_at ??
            row.inserted_at ??
            row.createdAt ??
            new Date().toISOString()
        ),
      }));

      return items;
    } catch (_e) {
      continue;
    }
  }
  return [];
}

export function useRequestsList(role: UserRole | null, storeId?: string) {
  return useQuery<RequestListItem[]>({
    queryKey: ["requests-list", role, storeId ?? "no-store"],
    queryFn: () => fetchRequestsList(role, storeId),
    enabled: role !== null && (role !== "manager" || !!storeId),
    staleTime: 15_000,
  });
}

// Exchange Request API Functions
export async function createExchangeRequest(
  input: CreateExchangeRequestInput
): Promise<ExchangeRequest> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("exchange_requests")
    .insert({
      store_id: input.store_id,
      requester_id: (await supabase.auth.getUser()).data.user?.id,
      shift_id: input.shift_id,
      target_user_id: input.target_user_id,
      reason: input.reason,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(`교환 요청 생성에 실패했습니다: ${error.message}`);
  }

  return data as ExchangeRequest;
}

export async function updateExchangeRequest(
  input: UpdateExchangeRequestInput
): Promise<ExchangeRequest> {
  const supabase = createClient();

  const updateData: any = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.status === "approved") {
    updateData.approved_by =
      input.approved_by || (await supabase.auth.getUser()).data.user?.id;
    updateData.approved_at = input.approved_at || new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("exchange_requests")
    .update(updateData)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`교환 요청 업데이트에 실패했습니다: ${error.message}`);
  }

  return data as ExchangeRequest;
}

export async function getExchangeRequest(id: string): Promise<ExchangeRequest> {
  const supabase = createClient();

  // 기본 요청 + shift만 조인 (auth.users 조인은 스키마 파싱 이슈 회피)
  const { data, error } = await supabase
    .from("exchange_requests")
    .select(
      `
      *,
      shift:shifts(id, start_time, end_time, position)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`교환 요청 조회에 실패했습니다: ${error.message}`);
  }
  if (!data) {
    throw new Error("교환 요청을 찾을 수 없습니다.");
  }

  // 프로필 별도 조회로 이름 보강
  const ids = [data.requester_id, data.target_user_id, data.approved_by].filter(
    (v): v is string => Boolean(v)
  );
  const profiles = await getProfilesByIds(ids);
  const idToProfile = new Map(profiles.map((p) => [p.id, p]));

  const shapeUser = (uid?: string | null) => {
    if (!uid) return undefined;
    const p = idToProfile.get(uid);
    if (!p) return undefined;
    return {
      id: p.id,
      email: p.full_name ? undefined : undefined,
      user_metadata: { name: p.full_name ?? undefined },
    } as any;
  };

  const enriched: ExchangeRequest = {
    ...(data as any),
    requester: shapeUser(data.requester_id),
    target_user: shapeUser(data.target_user_id),
    approved_by_user: shapeUser(data.approved_by),
  } as ExchangeRequest;

  return enriched;
}

export async function getExchangeRequests(
  storeId: string,
  filters?: { status?: string; requesterId?: string }
): Promise<ExchangeRequest[]> {
  const supabase = createClient();

  let query = supabase
    .from("exchange_requests")
    .select(
      `
      *,
      shift:shifts(id, start_time, end_time, position)
    `
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.requesterId) {
    query = query.eq("requester_id", filters.requesterId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`교환 요청 목록 조회에 실패했습니다: ${error.message}`);
  }

  const rows = (data || []) as ExchangeRequest[];
  const uniqueIds = new Set<string>();
  for (const r of rows) {
    if (r.requester_id) uniqueIds.add(r.requester_id);
    if (r.target_user_id) uniqueIds.add(r.target_user_id);
    if ((r as any).approved_by) uniqueIds.add((r as any).approved_by);
  }
  const profiles = await getProfilesByIds(Array.from(uniqueIds));
  const idToProfile = new Map(profiles.map((p) => [p.id, p]));
  const shapeUser = (uid?: string | null) => {
    if (!uid) return undefined;
    const p = idToProfile.get(uid);
    if (!p) return undefined;
    return {
      id: p.id,
      email: undefined,
      user_metadata: { name: p.full_name ?? undefined },
    } as any;
  };

  return rows.map((r) => ({
    ...(r as any),
    requester: shapeUser(r.requester_id),
    target_user: shapeUser(r.target_user_id),
    approved_by_user: shapeUser((r as any).approved_by),
  })) as ExchangeRequest[];
}

export async function deleteExchangeRequest(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("exchange_requests")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`교환 요청 삭제에 실패했습니다: ${error.message}`);
  }
}

// React Query Hooks
export function useExchangeRequest(id: string) {
  return useQuery({
    queryKey: ["exchange-request", id],
    queryFn: () => getExchangeRequest(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

export function useExchangeRequests(
  storeId: string,
  filters?: { status?: string; requesterId?: string }
) {
  return useQuery({
    queryKey: ["exchange-requests", storeId, filters],
    queryFn: () => getExchangeRequests(storeId, filters),
    enabled: !!storeId,
    staleTime: 1000 * 60 * 2, // 2분
  });
}

export function useCreateExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExchangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests-list"] });
      queryClient.invalidateQueries({ queryKey: ["pending-request-count"] });
    },
  });
}

export function useUpdateExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExchangeRequest,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["exchange-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["exchange-request", data.id],
      });
      queryClient.invalidateQueries({ queryKey: ["requests-list"] });
      queryClient.invalidateQueries({ queryKey: ["pending-request-count"] });
    },
  });
}

export function useDeleteExchangeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExchangeRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exchange-requests"] });
      queryClient.invalidateQueries({ queryKey: ["requests-list"] });
      queryClient.invalidateQueries({ queryKey: ["pending-request-count"] });
    },
  });
}
