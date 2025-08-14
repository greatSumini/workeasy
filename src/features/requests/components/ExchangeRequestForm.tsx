"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateExchangeRequest } from "@/features/requests/api";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useToast } from "@/hooks/use-toast";
import type { Shift } from "@/features/schedule/types";
import type { StaffOption } from "@/features/schedule/types";
import { format } from "date-fns";

const schema = z.object({
  target_user_id: z.string().optional(),
  reason: z
    .string()
    .min(1, "교환 사유를 입력해주세요.")
    .max(500, "교환 사유는 500자 이내로 입력해주세요."),
});

type FormData = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift;
  staffOptions: StaffOption[];
};

export function ExchangeRequestForm({
  open,
  onOpenChange,
  shift,
  staffOptions,
}: Props) {
  const { data: store } = useCurrentStore();
  const { toast } = useToast();
  const createExchangeRequest = useCreateExchangeRequest();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      target_user_id: undefined,
      reason: "",
    },
  });

  const targetUserId = watch("target_user_id");

  const onSubmit = async (data: FormData) => {
    if (!store?.id) {
      toast({
        title: "오류",
        description: "매장 정보를 불러올 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await createExchangeRequest.mutateAsync({
        store_id: store.id,
        shift_id: shift.id,
        target_user_id: data.target_user_id || null,
        reason: data.reason,
      });

      toast({
        title: "교환 요청 생성 완료",
        description: "교환 요청이 성공적으로 생성되었습니다.",
      });

      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "교환 요청 생성 실패",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startTime = new Date(shift.start_time);
  const endTime = new Date(shift.end_time);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            교환 요청 생성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 근무 정보 */}
          <div className="glass-subtle glass-animation rounded-xl p-4">
            <h3 className="font-medium mb-2">교환하려는 근무</h3>
            <div className="text-sm space-y-1">
              <div>
                <span className="text-muted-foreground">일시:</span>{" "}
                {format(startTime, "yyyy년 M월 d일 HH:mm")} -{" "}
                {format(endTime, "HH:mm")}
              </div>
              {shift.position && (
                <div>
                  <span className="text-muted-foreground">포지션:</span>{" "}
                  {shift.position}
                </div>
              )}
              {shift.notes && (
                <div>
                  <span className="text-muted-foreground">메모:</span>{" "}
                  {shift.notes}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 대상 직원 선택 */}
            <div className="space-y-2">
              <Label htmlFor="target_user_id">교환 대상 직원 (선택사항)</Label>
              <Select
                value={targetUserId ?? "any"}
                onValueChange={(value) =>
                  setValue(
                    "target_user_id",
                    value === "any" ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="특정 직원을 선택하거나 비워두세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">아무나 (매장 전체 공지)</SelectItem>
                  {staffOptions
                    .filter((staff) => staff.id !== shift.user_id) // 자기 자신 제외
                    .map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 교환 사유 */}
            <div className="space-y-2">
              <Label htmlFor="reason">교환 사유 *</Label>
              <Textarea
                id="reason"
                placeholder="교환이 필요한 이유를 간단히 적어주세요. (예: 개인 일정, 수업 등)"
                className="min-h-[100px]"
                {...register("reason")}
              />
              {errors.reason && (
                <p className="text-sm text-red-500">{errors.reason.message}</p>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="glass-subtle hover:glass"
              >
                {isSubmitting ? "요청 중..." : "교환 요청 보내기"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
