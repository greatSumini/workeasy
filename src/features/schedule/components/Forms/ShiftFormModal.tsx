"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShiftForm } from "./ShiftForm";
import type {
  Shift,
  StaffOption,
  UpsertShiftInput,
} from "@/features/schedule/types";
import { useCreateShift, useUpdateShift } from "@/features/schedule/api";

export function ShiftFormModal({
  open,
  onOpenChange,
  title,
  defaultValues,
  staffOptions,
  readOnly,
  onRequestDelete,
  onCreated,
  onUpdated,
  hideUnassignedOption,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  defaultValues: Partial<Shift> & { store_id: string };
  staffOptions: StaffOption[];
  readOnly?: boolean;
  onRequestDelete?: () => void;
  onCreated?: (shift: Shift) => void;
  onUpdated?: (shift: Shift) => void;
  hideUnassignedOption?: boolean;
}) {
  const { toast } = useToast();
  const createMutation = useCreateShift(defaultValues.store_id);
  const updateMutation = useUpdateShift(defaultValues.store_id);
  const submitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (values: UpsertShiftInput) => {
    try {
      if (values.id) {
        const updated = (await updateMutation.mutateAsync(
          values as any
        )) as unknown as Shift;
        onUpdated?.(updated);
      } else {
        const created = (await createMutation.mutateAsync(
          values as any
        )) as unknown as Shift;
        onCreated?.(created);
      }
      toast({ title: "저장 완료", description: "근무가 저장되었습니다." });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "오류", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {title}
            </DialogTitle>
            {!!onRequestDelete && !!defaultValues.id && !readOnly && (
              <button
                className="text-sm text-red-600 hover:underline"
                onClick={onRequestDelete}
                disabled={submitting}
              >
                삭제
              </button>
            )}
          </div>
        </DialogHeader>
        <ShiftForm
          defaultValues={defaultValues}
          staffOptions={staffOptions}
          readOnly={readOnly}
          onSubmit={handleSubmit}
          hideUnassignedOption={hideUnassignedOption}
        />
      </DialogContent>
    </Dialog>
  );
}
