import { NextRequest, NextResponse } from "next/server";
import { TOSS_API_BASE, getBasicAuthHeader, getTossSecretKey } from "@/lib/toss";

// POST /api/payments/billing
// Body: { customerKey: string, authKey: string }
export async function POST(req: NextRequest) {
  try {
    const { customerKey, authKey } = await req.json();
    if (!customerKey || !authKey) {
      return NextResponse.json({ message: "customerKey, authKey 필요" }, { status: 400 });
    }
    const secretKey = getTossSecretKey();
    if (!secretKey) {
      return NextResponse.json({ message: "서버 시크릿 키 미설정 (TOSS_SECRET_KEY)" }, { status: 500 });
    }

    const res = await fetch(`${TOSS_API_BASE}/v1/billing/authorizations/confirm`, {
      method: "POST",
      headers: {
        "Authorization": getBasicAuthHeader(secretKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ customerKey, authKey }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    // DB 저장 금지 지침: 응답 그대로 반환 (클라이언트 임시 저장)
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || "UNKNOWN" }, { status: 500 });
  }
}


