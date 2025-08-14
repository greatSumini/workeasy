import { NextRequest, NextResponse } from "next/server";
import {
  TOSS_API_BASE,
  getBasicAuthHeader,
  getTossSecretKey,
} from "@/lib/toss";
import { createClient as createSupabaseServer } from "@/lib/supabase/server";

// POST /api/billing/charge
// Body: { customerKey: string, orderId: string, amount: number, orderName?: string }
export async function POST(req: NextRequest) {
  try {
    const { customerKey, orderId, amount, orderName } = await req.json();
    if (!customerKey || !orderId || typeof amount !== "number") {
      return NextResponse.json(
        { message: "customerKey, orderId, amount 필요" },
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

    const supabase = await createSupabaseServer();
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) {
      return NextResponse.json({ message: "인증 필요" }, { status: 401 });
    }

    const { data: keyRes, error: keyErr } = await supabase.rpc(
      "get_billing_key",
      { p_user: userId, p_customer_key: customerKey }
    );
    if (keyErr || !keyRes) {
      return NextResponse.json(
        { message: "빌링키 조회 실패" },
        { status: 404 }
      );
    }
    const billingKey: string = keyRes as unknown as string;

    // create pending record (best-effort)
    await supabase
      .from("payment_intents")
      .insert({
        order_id: orderId,
        user_id: userId,
        amount,
        status: "PENDING" as any,
      })
      .catch(() => undefined);

    const res = await fetch(
      `${TOSS_API_BASE}/v1/billing/${encodeURIComponent(billingKey)}`,
      {
        method: "POST",
        headers: {
          Authorization: getBasicAuthHeader(secretKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerKey,
          orderId,
          amount,
          orderName: orderName || "workeasy 구독",
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      await supabase
        .from("payment_intents")
        .update({
          status: "FAILED",
          failure_message: data?.message ?? null,
          failure_code: data?.code ?? null,
        })
        .eq("order_id", orderId)
        .catch(() => undefined);
      return NextResponse.json(data, { status: res.status });
    }
    await supabase
      .from("payment_intents")
      .update({
        status: "SUCCEEDED",
        payment_key: data?.paymentKey ?? null,
        approved_at: data?.approvedAt ?? null,
      })
      .eq("order_id", orderId)
      .catch(() => undefined);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "UNKNOWN" },
      { status: 500 }
    );
  }
}
