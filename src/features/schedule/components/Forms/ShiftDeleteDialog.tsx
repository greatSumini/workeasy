"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useDeleteShift } from "@/features/schedule/api";

export function ShiftDeleteDialog({
  open,
  onOpenChange,
  storeId,
  shiftId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  storeId: string;
  shiftId: string;
}) {
  const { toast } = useToast();
  const mutation = useDeleteShift(storeId);
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    try {
      setLoading(true);
      await mutation.mutateAsync({ id: shiftId, store_id: storeId });
      toast({ title: "삭제 완료", description: "근무가 삭제되었습니다." });
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "삭제 실패",
        description: e.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl">
        <DialogHeader>
          <DialogTitle className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            근무 삭제
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <DialogFooter className="gap-2">
          <Button
            variant="secondary"
            className="glass-subtle"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            취소
          </Button>
          <Button variant="destructive" onClick={onDelete} disabled={loading}>
            삭제
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
