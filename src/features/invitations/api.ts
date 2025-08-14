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

  const payload = {
    store_id: params.storeId,
    inviter_id: user.user.id,
    invitee_email: params.inviteeEmail ?? null,
    role: params.role ?? "staff",
    expires_at: params.expiresAt ?? null,
    max_uses: params.maxUses ?? 1,
  } as const;

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
  const supabase = createClient();
  // 초대 정보 + 매장명 조회
  const { data, error } = await supabase
    .from("invitations")
    .select("code, invitee_email, store:stores(name)")
    .eq("id", params.invitationId)
    .single();
  if (error) throw error;
  if (!data?.invitee_email) throw new Error("이메일이 없는 초대입니다.");

  // 세션 토큰으로 Edge Function 호출
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-invitation`;
  const res = await fetch(fnUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    },
    body: JSON.stringify({
      email: data.invitee_email,
      code: data.code,
      storeName:
        (data as any)?.store?.name ?? (data as any)?.stores?.name ?? null,
    }),
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
