import { NextRequest, NextResponse } from "next/server";
import {
  TOSS_API_BASE,
  getBasicAuthHeader,
  getTossSecretKey,
} from "@/lib/toss";

// POST /api/payments/approve
// Body: { paymentKey: string, orderId: string, amount: number }
export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();
    if (!paymentKey || !orderId || typeof amount !== "number") {
      return NextResponse.json(
        { message: "paymentKey, orderId, amount 필요" },
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

    const res = await fetch(`${TOSS_API_BASE}/v1/payments/confirm`, {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "UNKNOWN" },
      { status: 500 }
    );
  }
}
