"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useRequestsList } from "@/features/requests/api";

function formatStatusKorean(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "pending") return "대기";
  if (s === "approved" || s === "accepted") return "승인";
  if (s === "rejected" || s === "declined") return "거절";
  return status || "알수없음";
}

function formatIdShort(id: string): string {
  if (!id) return "-";
  return id.length > 10 ? `${id.slice(0, 8)}…` : id;
}

export default function RequestsList() {
  const { data: role } = useUserRole();
  const { data: store } = useCurrentStore();
  const { data, isLoading, error } = useRequestsList(role ?? null, store?.id);

  if (isLoading) {
    return (
      <div className="glass glass-animation rounded-2xl p-8">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          <span className="text-medium">요청을 불러오는 중...</span>
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

  const items = data ?? [];

  if (items.length === 0) {
    return (
      <div className="glass glass-animation rounded-2xl p-6">
        <div className="text-sm text-muted-foreground text-center py-6">
          표시할 요청이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="glass glass-animation rounded-2xl p-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/requests/${item.id}`}
              className="block glass-subtle glass-animation rounded-xl p-4 hover:glass"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    요청 #{formatIdShort(item.id)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(item.createdAt), "yyyy-MM-dd HH:mm")}
                  </div>
                </div>
                <div className="text-xs px-2 py-1 rounded-full glass-subtle">
                  {formatStatusKorean(item.status)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
