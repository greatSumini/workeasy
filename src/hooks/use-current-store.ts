"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type CurrentStore = {
  id: string;
  name: string;
  owner_id: string;
};

export function useCurrentStore() {
  return useQuery({
    queryKey: ["current-store"],
    queryFn: async (): Promise<CurrentStore | null> => {
      const supabase = createClient();

      // 현재 사용자 가져오기
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("인증이 필요합니다.");
      }

      // 사용자 프로필에서 역할 확인
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "manager") {
        // 매니저인 경우 소유한 매장 조회
        const { data: stores, error } = await supabase
          .from("stores")
          .select("id, name, owner_id")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (error) {
          throw new Error(`매장 정보 조회 실패: ${error.message}`);
        }

        return stores?.[0] || null;
      } else {
        // 직원인 경우 속한 매장 조회
        const { data: storeUsers, error } = await supabase
          .from("store_users")
          .select(
            `
            stores!inner(
              id,
              name,
              owner_id
            )
          `
          )
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (error) {
          throw new Error(`매장 정보 조회 실패: ${error.message}`);
        }

        if (storeUsers?.stores) {
          return storeUsers.stores as unknown as CurrentStore;
        }

        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    retry: (failureCount, error) => {
      if (error.message.includes("인증")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("인증이 필요합니다.");
      }

      return user;
    },
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 10, // 10분
    retry: false,
  });
}
