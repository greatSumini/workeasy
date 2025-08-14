"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, User } from "lucide-react";
import {
  useMyIncomingExchangeRequests,
  useAcceptExchangeRequest,
  useRejectExchangeRequest,
} from "@/features/requests/api";
import { useToast } from "@/hooks/use-toast";
import type { ExchangeRequest } from "@/features/requests/types";

export function IncomingExchangeRequests() {
  const {
    data: requests = [],
    isLoading,
    error,
  } = useMyIncomingExchangeRequests();
  const acceptRequest = useAcceptExchangeRequest();
  const rejectRequest = useRejectExchangeRequest();
  const { toast } = useToast();

  const handleAccept = async (request: ExchangeRequest) => {
    try {
      await acceptRequest.mutateAsync(request.id);
      toast({
        title: "교환 요청 수락",
        description: "교환 요청을 수락했습니다.",
      });
    } catch (error) {
      toast({
        title: "수락 실패",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (request: ExchangeRequest) => {
    try {
      await rejectRequest.mutateAsync(request.id);
      toast({
        title: "교환 요청 거절",
        description: "교환 요청을 거절했습니다.",
      });
    } catch (error) {
      toast({
        title: "거절 실패",
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
          <span className="text-medium">수락 가능한 요청을 불러오는 중...</span>
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
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            수락할 수 있는 요청이 없습니다
          </h3>
          <p className="text-sm text-muted-foreground">
            다른 직원이 교환 요청을 보내면 여기에 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="glass glass-animation rounded-2xl p-6">
          {/* 요청자 정보 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 glass-subtle rounded-full">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium">
                  {request.requester?.user_metadata?.name || "이름 없음"}님의
                  교환 요청
                </h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.created_at), "M월 d일 HH:mm")}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="glass-subtle">
              {request.target_user_id ? "개인 요청" : "전체 공개"}
            </Badge>
          </div>

          {/* 근무 정보 */}
          {request.shift && (
            <div className="glass-subtle rounded-xl p-4 mb-4">
              <h4 className="font-medium mb-2">교환 대상 근무</h4>
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

          {/* 액션 버튼 */}
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReject(request)}
              disabled={rejectRequest.isPending}
              className="hover:bg-red-50 hover:border-red-200"
            >
              <X className="h-4 w-4 mr-2" />
              거절
            </Button>
            <Button
              size="sm"
              onClick={() => handleAccept(request)}
              disabled={acceptRequest.isPending}
              className="glass-subtle hover:glass"
            >
              <Check className="h-4 w-4 mr-2" />
              {acceptRequest.isPending ? "수락 중..." : "수락"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
