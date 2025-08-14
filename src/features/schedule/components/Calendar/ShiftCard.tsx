"use client";

import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { ShiftFormModal } from "@/features/schedule/components/Forms/ShiftFormModal";
import { ShiftDeleteDialog } from "@/features/schedule/components/Forms/ShiftDeleteDialog";
import { ExchangeRequestForm } from "@/features/requests/components/ExchangeRequestForm";
import { useUserRole } from "@/hooks/use-user-role";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useStoreStaff } from "@/features/schedule/api";
import { Shift, StaffOption } from "@/features/schedule/types";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Props = {
  shift: Shift;
  className?: string;
  userNameMap?: Record<string, string>;
  staffOptions?: StaffOption[];
};

export default function ShiftCard({
  shift,
  className,
  userNameMap,
  staffOptions,
}: Props) {
  const { data: role } = useUserRole();
  const { data: store } = useCurrentStore();
  const { data: storeStaff = [] } = useStoreStaff(store?.id || "");
  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openExchange, setOpenExchange] = useState(false);
  const start = new Date(shift.start_time);
  const end = new Date(shift.end_time);
  const staffName =
    (shift.user_id && userNameMap?.[shift.user_id]) ||
    (shift.user_id ? "구성원" : "미배정");

  // 현재 사용자가 이 근무의 담당자인지 확인
  const isMyShift = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id === shift.user_id;
  };

  const handleExchangeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (await isMyShift()) {
      setOpenExchange(true);
    }
  };
  return (
    <>
      <div className={cn("w-full relative group", className)}>
        <button onClick={() => setOpen(true)} className="w-full text-left">
          <Card
            className={cn(
              "p-2 text-sm hover:-translate-y-0.5 glass-animation",
              className
            )}
          >
            <div className="font-medium">{staffName}</div>
            <div className="text-xs text-muted-foreground">
              {format(start, "HH:mm")} - {format(end, "HH:mm")}
            </div>
            {shift.position && (
              <div className="mt-1 text-xs">{shift.position}</div>
            )}
          </Card>
        </button>

        {/* 교환 요청 버튼 - staff 역할이고 자신의 근무일 때만 표시 */}
        {role === "staff" && shift.user_id && (
          <Button
            size="sm"
            variant="outline"
            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 glass-subtle hover:glass"
            onClick={handleExchangeClick}
            title="교환 요청"
          >
            <ArrowRightLeft className="h-3 w-3" />
          </Button>
        )}
      </div>

      <ShiftFormModal
        open={open}
        onOpenChange={setOpen}
        title={role === "manager" ? "근무 편집" : "근무 보기"}
        defaultValues={shift}
        staffOptions={staffOptions ?? []}
        readOnly={role !== "manager"}
        onRequestDelete={() => setOpenDelete(true)}
      />

      <ShiftDeleteDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        storeId={shift.store_id}
        shiftId={shift.id}
      />

      <ExchangeRequestForm
        open={openExchange}
        onOpenChange={setOpenExchange}
        shift={shift}
        staffOptions={storeStaff}
      />
    </>
  );
}
