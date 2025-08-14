"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Calendar,
} from "lucide-react";
import {
  useMySentExchangeRequests,
  useCancelExchangeRequest,
} from "@/features/requests/api";
import { useToast } from "@/hooks/use-toast";
import type { ExchangeRequest } from "@/features/requests/types";

// 상태 표시 함수
function getStatusInfo(status: string) {
  switch (status) {
    case "pending":
      return {
        label: "대기 중",
        icon: Clock,
        color: "bg-yellow-100 border-yellow-200 text-yellow-800",
        iconColor: "text-yellow-600",
      };
    case "approved":
      return {
        label: "승인됨",
        icon: CheckCircle,
        color: "bg-green-100 border-green-200 text-green-800",
        iconColor: "text-green-600",
      };
    case "rejected":
      return {
        label: "거절됨",
        icon: XCircle,
        color: "bg-red-100 border-red-200 text-red-800",
        iconColor: "text-red-600",
      };
    case "cancelled":
      return {
        label: "취소됨",
        icon: X,
        color: "bg-gray-100 border-gray-200 text-gray-800",
        iconColor: "text-gray-600",
      };
    default:
      return {
        label: "알 수 없음",
        icon: Clock,
        color: "bg-gray-100 border-gray-200 text-gray-800",
        iconColor: "text-gray-600",
      };
  }
}

export function SentExchangeRequests() {
  const { data: requests = [], isLoading, error } = useMySentExchangeRequests();
  const cancelRequest = useCancelExchangeRequest();
  const { toast } = useToast();

  const handleCancel = async (request: ExchangeRequest) => {
    try {
      await cancelRequest.mutateAsync(request.id);
      toast({
        title: "요청 취소",
        description: "교환 요청을 취소했습니다.",
      });
    } catch (error) {
      toast({
        title: "취소 실패",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="glass glass-animation rounded-2xl p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="text-medium">내가 보낸 요청을 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass glass-animation rounded-2xl p-6 text-center">
        <div className="text-red-600 mb-2">요청을 불러올 수 없습니다</div>
        <div className="text-sm text-gray-600">{(error as Error).message}</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="glass glass-animation rounded-2xl p-6">
        <div className="text-center py-8">
          <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">보낸 요청이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            교환 요청을 보내면 여기에 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const statusInfo = getStatusInfo(request.status);
        const StatusIcon = statusInfo.icon;

        return (
          <div
            key={request.id}
            className="glass glass-animation rounded-2xl p-6"
          >
            {/* 헤더 - 상태 및 일시 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${statusInfo.color}`}>
                  <StatusIcon className={`h-4 w-4 ${statusInfo.iconColor}`} />
                </div>
                <div>
                  <h3 className="font-medium">교환 요청</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(request.created_at), "M월 d일 HH:mm")}에
                    요청
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>

            {/* 대상자 정보 */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 glass-subtle rounded-full">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-medium">
                  {request.target_user_id
                    ? `${request.target_user?.user_metadata?.name || "이름 없음"}님에게 요청`
                    : "전체 직원에게 공개 요청"}
                </h4>
                {request.status === "approved" && request.approved_by_user && (
                  <p className="text-sm text-green-600">
                    {request.approved_by_user.user_metadata?.name ||
                      "이름 없음"}
                    님이 수락
                    {request.approved_at &&
                      ` (${format(new Date(request.approved_at), "M월 d일 HH:mm")})`}
                  </p>
                )}
              </div>
            </div>

            {/* 근무 정보 */}
            {request.shift && (
              <div className="glass-subtle rounded-xl p-4 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">교환 요청한 근무</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">일시:</span>{" "}
                    {format(
                      new Date(request.shift.start_time),
                      "M월 d일 (E) HH:mm"
                    )}{" "}
                    - {format(new Date(request.shift.end_time), "HH:mm")}
                  </div>
                  {request.shift.position && (
                    <div>
                      <span className="text-muted-foreground">포지션:</span>{" "}
                      {request.shift.position}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 교환 사유 */}
            {request.reason && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">교환 사유</h4>
                <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                  {request.reason}
                </p>
              </div>
            )}

            {/* 액션 버튼 - pending 상태일 때만 취소 가능 */}
            {request.status === "pending" && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(request)}
                  disabled={cancelRequest.isPending}
                  className="hover:bg-red-50 hover:border-red-200"
                >
                  <X className="h-4 w-4 mr-2" />
                  {cancelRequest.isPending ? "취소 중..." : "요청 취소"}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
