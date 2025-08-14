"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, User, Calendar } from "lucide-react";
import { useMyAcceptedExchangeRequests } from "@/features/requests/api";
import type { ExchangeRequest } from "@/features/requests/types";

export function AcceptedExchangeRequests() {
  const {
    data: requests = [],
    isLoading,
    error,
  } = useMyAcceptedExchangeRequests();

  if (isLoading) {
    return (
      <div className="glass glass-animation rounded-2xl p-6">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="text-medium">수락한 요청을 불러오는 중...</span>
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
          <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">수락한 요청이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            교환 요청을 수락하면 여기에 기록됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div key={request.id} className="glass glass-animation rounded-2xl p-6">
          {/* 헤더 - 수락 정보 */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">교환 요청 수락됨</h3>
                <p className="text-sm text-muted-foreground">
                  {request.approved_at &&
                    format(new Date(request.approved_at), "M월 d일 HH:mm")}
                  에 수락
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-green-50 border-green-200 text-green-800"
            >
              수락 완료
            </Badge>
          </div>

          {/* 요청자 정보 */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 glass-subtle rounded-full">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium">
                {request.requester?.user_metadata?.name || "이름 없음"}님의 요청
              </h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(request.created_at), "M월 d일 HH:mm")}에 요청
              </p>
            </div>
          </div>

          {/* 근무 정보 */}
          {request.shift && (
            <div className="glass-subtle rounded-xl p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">교환된 근무</h4>
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
            <div>
              <h4 className="font-medium mb-2">교환 사유</h4>
              <p className="text-sm text-muted-foreground bg-gray-50 rounded-lg p-3">
                {request.reason}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
