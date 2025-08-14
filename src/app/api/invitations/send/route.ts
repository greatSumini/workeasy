import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitationId } = body as { invitationId?: string };
    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("invitations")
      .select("code, invitee_email, store:stores(name)")
      .eq("id", invitationId)
      .single();
    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data?.invitee_email) {
      return NextResponse.json(
        { error: "이메일이 없는 초대입니다." },
        { status: 400 }
      );
    }

    // TODO: 실제 이메일 발송 연동 (Resend/SendGrid 등)
    console.log(
      "[send-invitation] to=",
      data.invitee_email,
      "code=",
      data.code,
      "store=",
      (data as any)?.store?.name
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message ?? String(e) },
      { status: 500 }
    );
  }
}
