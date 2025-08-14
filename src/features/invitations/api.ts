import { createClient } from "@/lib/supabase/client";

export async function createInvitation(params: {
  storeId: string;
  inviteeEmail?: string;
  role?: "manager" | "staff";
  expiresAt?: string; // ISO
  maxUses?: number;
}) {
  const supabase = createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("인증이 필요합니다.");

  const payload: Record<string, any> = {
    store_id: params.storeId,
    inviter_id: user.user.id,
    invitee_email: params.inviteeEmail ?? null,
    role: params.role ?? "staff",
    max_uses: params.maxUses ?? 1,
  };
  // expires_at은 미전달 시 DB DEFAULT를 사용해야 하므로 명시적으로 넣지 않음
  if (params.expiresAt) payload.expires_at = params.expiresAt;

  const { data, error } = await supabase
    .from("invitations")
    .insert(payload)
    .select("id, code, expires_at, max_uses, uses")
    .single();
  if (error) throw error;
  return data;
}

export async function listInvitations(storeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select(
      "id, invitee_email, role, code, expires_at, max_uses, uses, created_at"
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteInvitation(invitationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);
  if (error) throw error;
}

export async function resendInvitationEmail(params: { invitationId: string }) {
  const res = await fetch(`/api/invitations/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ invitationId: params.invitationId }),
  });
  if (!res.ok) throw new Error("이메일 발송 실패");
  return await res.json();
}

export async function acceptInvitation(code: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    invite_code: code,
  });
  if (error) throw error;
  return data as string; // store_id
}

export async function getOwnerPrimaryStore() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("인증이 필요합니다.");
  const { data, error } = await supabase
    .from("stores")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getStoreSummary(storeId: string) {
  const supabase = createClient();
  const members = await supabase
    .from("store_users")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId);
  const invites = await supabase
    .from("invitations")
    .select("uses, max_uses, expires_at")
    .eq("store_id", storeId);
  const pendingInvites = (invites.data ?? []).filter(
    (r) => r.uses < r.max_uses && new Date(r.expires_at) > new Date()
  ).length;
  return {
    memberCount: members.count ?? 0,
    pendingInvitesCount: pendingInvites,
  };
}

export async function listRecentInvitations(storeId: string, limit = 5) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("invitations")
    .select(
      "id, invitee_email, role, code, expires_at, max_uses, uses, created_at"
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
