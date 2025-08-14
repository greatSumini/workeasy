"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "manager" | "staff" | null;

export function useUserRole() {
  return useQuery<UserRole>({
    queryKey: ["user-role"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) return null;
      return (data?.role as UserRole) ?? null;
    },
    staleTime: 60_000,
  });
}
