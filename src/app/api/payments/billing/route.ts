import { NextRequest, NextResponse } from "next/server";
import {
  TOSS_API_BASE,
  getBasicAuthHeader,
  getTossSecretKey,
} from "@/lib/toss";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";

// POST /api/payments/billing
// Body: { customerKey: string, authKey: string }
export async function POST(req: NextRequest) {
  try {
    const { customerKey, authKey } = await req.json();
    if (!customerKey || !authKey) {
      return NextResponse.json(
        { message: "customerKey, authKey 필요" },
        { status: 400 }
      );
    }
    const secretKey = getTossSecretKey();
    if (!secretKey) {
      return NextResponse.json(
        { message: "서버 시크릿 키 미설정 (TOSS_SECRET_KEY)" },
        { status: 500 }
      );
    }

    const res = await fetch(
      `${TOSS_API_BASE}/v1/billing/authorizations/issue`,
      {
        method: "POST",
        headers: {
          Authorization: getBasicAuthHeader(secretKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerKey, authKey }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // DB 저장 (T-020): 로그인 사용자 기준으로 billing_profiles upsert
    try {
      const supabase = await createSupabaseServer();
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (userId && data?.billingKey) {
        const cardMasked = data?.card?.number ?? data?.cardNumber ?? null;
        const issuer = data?.card?.issuerCode ?? null;
        const acquirer = data?.card?.acquirerCode ?? null;
        const owner = data?.card?.ownerType ?? null;
        await supabase.rpc("insert_billing_profile", {
          p_user: userId,
          p_customer_key: customerKey,
          p_billing_key: data.billingKey as string,
          p_card_masked: cardMasked,
          p_issuer: issuer,
          p_acquirer: acquirer,
          p_owner: owner,
        });
      }
    } catch {}

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "UNKNOWN" },
      { status: 500 }
    );
  }
}
