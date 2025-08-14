"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export type UserProfile = {
  userId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: "manager" | "staff";
  storeName: string | null;
  joinedAt: string; // ISO from auth user
};

async function fetchUserProfile(): Promise<UserProfile> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  const role = (profile?.role as "manager" | "staff") ?? "staff";

  let storeName: string | null = null;
  if (role === "manager") {
    const { data: stores } = await supabase
      .from("stores")
      .select("name")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1);
    storeName = stores?.[0]?.name ?? null;
  } else {
    const { data: storeUsers } = await supabase
      .from("store_users")
      .select(
        `
        stores!inner(
          name
        )
      `
      )
      .eq("user_id", user.id)
      .limit(1)
      .single();
    // @ts-expect-error - supabase join typing
    storeName = storeUsers?.stores?.name ?? null;
  }

  const avatarUrl =
    profile?.avatar_url ?? (user.user_metadata?.avatar_url || null);
  const fullName = profile?.full_name ?? (user.user_metadata?.name || null);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName,
    avatarUrl,
    role,
    storeName,
    joinedAt: user.created_at,
  };
}

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: fetchUserProfile,
    staleTime: 1000 * 60 * 5,
  });
}
