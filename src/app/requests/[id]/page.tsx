"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useParams } from "next/navigation";
import {
  useExchangeRequest,
  useUpdateExchangeRequest,
} from "@/features/requests/api";
import { useUserRole } from "@/hooks/use-user-role";
import { useCurrentStore } from "@/hooks/use-current-store";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useMemo } from "react";

export default function RequestDetailPage() {
  return (
    <AuthGuard>
      <RequestDetailContent />
    </AuthGuard>
  );
}

function RequestDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { data: role } = useUserRole();
  const { data: store } = useCurrentStore();
  const { toast } = useToast();
  const { data, isLoading, error } = useExchangeRequest(String(id));
  const updateMutation = useUpdateExchangeRequest();

  const isPending = data?.status === "pending";
  const createdAtLabel = useMemo(() => {
    if (!data?.created_at) return "-";
    try {
      return format(new Date(data.created_at), "yyyy-MM-dd HH:mm");
    } catch {
      return data.created_at;
    }
  }, [data?.created_at]);

  function formatStatusKorean(status?: string): string {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "대기";
    if (s === "approved" || s === "accepted") return "승인";
    if (s === "rejected" || s === "declined") return "거절";
    if (s === "cancelled") return "취소";
    return status || "알수없음";
  }

  const handleApprove = async () => {
    if (!data) return;
    try {
      await updateMutation.mutateAsync({ id: data.id, status: "approved" });
      toast({ title: "승인 완료", description: "요청이 승인되었습니다." });
    } catch (e: any) {
      toast({ title: "오류", description: e.message, variant: "destructive" });
    }
  };

  const handleReject = async () => {
    if (!data) return;
    try {
      await updateMutation.mutateAsync({ id: data.id, status: "rejected" });
      toast({ title: "거절 완료", description: "요청이 거절되었습니다." });
    } catch (e: any) {
      toast({ title: "오류", description: e.message, variant: "destructive" });
    }
  };

  const handleCancel = async () => {
    if (!data) return;
    try {
      await updateMutation.mutateAsync({ id: data.id, status: "cancelled" });
      toast({ title: "취소 완료", description: "요청이 취소되었습니다." });
    } catch (e: any) {
      toast({ title: "오류", description: e.message, variant: "destructive" });
    }
  };

  return (
    <main className="min-h-screen">
      <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              요청 상세
            </h1>
            <p className="text-muted-foreground mt-2">ID: {id}</p>
          </div>
          {data && (
            <div className="text-xs px-2 py-1 rounded-full glass-subtle">
              {formatStatusKorean(data.status)}
            </div>
          )}
        </div>
      </header>

      {isLoading && (
        <div className="glass glass-animation rounded-2xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="text-medium">불러오는 중...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="glass glass-animation rounded-2xl p-6 text-center">
          <div className="text-red-600 mb-2">요청을 불러올 수 없습니다</div>
          <div className="text-sm text-gray-600">
            {(error as Error).message}
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* 요청 메타 정보 */}
          <section className="glass glass-animation rounded-2xl p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              요청 정보
            </h2>
            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">상태</div>
                <div>{formatStatusKorean(data.status)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">생성 시간</div>
                <div>{createdAtLabel}</div>
              </div>
              <div>
                <div className="text-muted-foreground">요청자</div>
                <div>
                  {data.requester?.user_metadata?.name ||
                    data.requester?.email ||
                    data.requester_id}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">대상자</div>
                <div>
                  {data.target_user?.user_metadata?.name ||
                    data.target_user?.email ||
                    "아무나"}
                </div>
              </div>
              {data.reason && (
                <div className="md:col-span-2">
                  <div className="text-muted-foreground">사유</div>
                  <div className="whitespace-pre-wrap">{data.reason}</div>
                </div>
              )}
            </div>
          </section>

          {/* 근무 정보 */}
          <section className="glass glass-animation rounded-2xl p-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              근무 정보
            </h2>
            <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">일시</div>
                <div>
                  {data.shift?.start_time
                    ? `${format(new Date(data.shift.start_time), "yyyy-MM-dd HH:mm")} - ${format(
                        new Date(data.shift.end_time),
                        "HH:mm"
                      )}`
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">포지션</div>
                <div>{data.shift?.position || "-"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Shift ID</div>
                <div className="font-mono">
                  {data.shift?.id || data.shift_id}
                </div>
              </div>
            </div>
          </section>

          {/* 액션 버튼 */}
          <section className="glass glass-animation rounded-2xl p-6">
            <div className="flex flex-wrap gap-2 justify-end">
              {role === "manager" && isPending && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={updateMutation.isPending}
                  >
                    승인
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleReject}
                    disabled={updateMutation.isPending}
                  >
                    거절
                  </Button>
                </>
              )}
              {role === "staff" && isPending && (
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateMutation.isPending}
                >
                  요청 취소
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
