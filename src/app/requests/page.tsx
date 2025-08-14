"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useUserRole } from "@/hooks/use-user-role";
import { usePendingRequestCount } from "@/features/requests/api";
import RequestsList from "@/features/requests/components/RequestsList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ExchangeRequestForm } from "@/features/requests/components/ExchangeRequestForm";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useMyShifts } from "@/features/schedule/api";
import { useStoreStaff } from "@/features/schedule/api";
import { format, addDays } from "date-fns";
import { useMemo } from "react";
import { useEffect } from "react";
import { ShiftFormModal } from "@/features/schedule/components/Forms/ShiftFormModal";
import { createClient } from "@/lib/supabase/client";

export default function RequestsPage() {
  return (
    <AuthGuard>
      <RequestsContent />
    </AuthGuard>
  );
}

function RequestsContent() {
  const { data: role } = useUserRole();
  const { data: store } = useCurrentStore();
  const { data: pending = 0 } = usePendingRequestCount(role ?? null);
  const { data: storeStaff = [] } = useStoreStaff(store?.id || "");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [showNewShiftModal, setShowNewShiftModal] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [authUserName, setAuthUserName] = useState<string | null>(null);
  const [authUserEmail, setAuthUserEmail] = useState<string | null>(null);

  // 향후 7일간의 내 근무 가져오기 (staff 역할일 때만)
  // 현재 날짜를 안정적으로 처리
  const todayStr = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const nextWeekStr = useMemo(
    () => format(addDays(new Date(), 7), "yyyy-MM-dd"),
    []
  );

  const { data: myShiftsResp } = useMyShifts(
    role === "staff" ? "current-user" : "",
    role === "staff"
      ? {
          start: todayStr + "T00:00:00.000Z",
          end: nextWeekStr + "T23:59:59.999Z",
        }
      : undefined
  );
  const myShifts = myShiftsResp?.data ?? [];

  // 현재 사용자 ID 조회
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthUserId(data.user?.id ?? null);
      const metaName = (data.user as any)?.user_metadata?.name as
        | string
        | undefined;
      setAuthUserName(metaName ?? null);
      setAuthUserEmail(data.user?.email ?? null);
    });
  }, []);

  const staffOptionsForSelf = useMemo(() => {
    if (!authUserId) return [];
    const mine = storeStaff.filter((s) => s.id === authUserId);
    if (mine.length > 0) return mine;
    return [
      {
        id: authUserId,
        name: authUserName || authUserEmail || "내 계정",
      },
    ];
  }, [storeStaff, authUserId, authUserName, authUserEmail]);

  const defaultStartLocal = useMemo(() => {
    const now = new Date();
    return format(now, "yyyy-MM-dd'T'HH:mm");
  }, []);

  const defaultEndLocal = useMemo(() => {
    const base = new Date(defaultStartLocal);
    base.setHours(base.getHours() + 2);
    return format(base, "yyyy-MM-dd'T'HH:mm");
  }, [defaultStartLocal]);

  const handleCreateRequest = (shift: any) => {
    setSelectedShift(shift);
    setShowCreateForm(true);
  };

  return (
    <main className="min-h-screen">
      <header className="glass-strong glass-animation rounded-2xl p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              교환 요청
            </h1>
            <p className="text-muted-foreground mt-2">대기 중: {pending}건</p>
          </div>

          {/* staff 역할일 때 교환 요청 생성 버튼 */}
          {role === "staff" && (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="glass-subtle hover:glass"
              >
                <Plus className="h-4 w-4 mr-2" />
                교환 요청 만들기
              </Button>
              {store?.id && (
                <Button
                  onClick={() => setShowNewShiftModal(true)}
                  className="glass-subtle hover:glass"
                  variant="secondary"
                  disabled={!authUserId}
                >
                  근무 추가
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 내 근무 목록 (staff 역할일 때만) */}
      {role === "staff" && !selectedShift && showCreateForm && (
        <div className="glass glass-animation rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            교환하고 싶은 근무를 선택하세요
          </h2>
          {myShifts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              향후 7일간 예정된 근무가 없습니다.
            </p>
          ) : (
            <div className="grid gap-3">
              {myShifts.map((shift) => (
                <button
                  key={shift.id}
                  onClick={() => handleCreateRequest(shift)}
                  className="glass-subtle glass-animation rounded-xl p-4 text-left hover:glass"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {format(new Date(shift.start_time), "M월 d일 (E)")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(shift.start_time), "HH:mm")} -{" "}
                        {format(new Date(shift.end_time), "HH:mm")}
                      </div>
                      {shift.position && (
                        <div className="text-sm text-muted-foreground mt-1">
                          포지션: {shift.position}
                        </div>
                      )}
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full glass-subtle">
                      {shift.status === "confirmed" ? "확정" : "대기"}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              취소
            </Button>
          </div>
        </div>
      )}

      <RequestsList />

      {/* 교환 요청 생성 폼 */}
      {selectedShift && (
        <ExchangeRequestForm
          open={!!selectedShift}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedShift(null);
              setShowCreateForm(false);
            }
          }}
          shift={selectedShift}
          staffOptions={storeStaff}
        />
      )}

      {/* 근무 생성 모달 (staff 전용) */}
      {role === "staff" && store?.id && (
        <ShiftFormModal
          open={showNewShiftModal}
          onOpenChange={(v) => setShowNewShiftModal(v)}
          title="내 근무 추가"
          defaultValues={
            {
              store_id: store.id,
              user_id: authUserId ?? undefined,
              start_time: defaultStartLocal,
              end_time: defaultEndLocal,
              status: "pending",
            } as any
          }
          staffOptions={staffOptionsForSelf}
          hideUnassignedOption
          onCreated={(created) => {
            setShowNewShiftModal(false);
            // 새로 만든 근무로 바로 교환 요청 작성 가능하도록 연결
            setSelectedShift(created);
            setShowCreateForm(true);
          }}
        />
      )}
    </main>
  );
}
