"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type {
  UpsertShiftInput,
  Shift,
  StaffOption,
} from "@/features/schedule/types";
import { checkShiftOverlap } from "@/features/schedule/api";

const schema = z
  .object({
    user_id: z.string().uuid().nullable().optional(),
    start_time: z.string().min(1, "시작 시간을 선택하세요"),
    end_time: z.string().min(1, "종료 시간을 선택하세요"),
    position: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (
      new Date(val.end_time).getTime() <= new Date(val.start_time).getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_time"],
        message: "종료 시간은 시작 시간 이후여야 합니다",
      });
    }
  });

export type ShiftFormValues = z.infer<typeof schema>;

export function ShiftForm({
  defaultValues,
  staffOptions,
  readOnly,
  onSubmit,
  hideUnassignedOption,
}: {
  defaultValues: Partial<Shift> & { store_id: string };
  staffOptions: StaffOption[];
  readOnly?: boolean;
  onSubmit: (values: UpsertShiftInput) => Promise<void> | void;
  hideUnassignedOption?: boolean;
}) {
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      user_id: defaultValues.user_id ?? null,
      start_time: defaultValues.start_time ?? "",
      end_time: defaultValues.end_time ?? "",
      position: defaultValues.position ?? "",
      notes: defaultValues.notes ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      user_id: defaultValues.user_id ?? null,
      start_time: defaultValues.start_time ?? "",
      end_time: defaultValues.end_time ?? "",
      position: defaultValues.position ?? "",
      notes: defaultValues.notes ?? "",
    });
  }, [defaultValues, form]);

  // 실시간 중복 경고
  const watchedUser = form.watch("user_id");
  const watchedStart = form.watch("start_time");
  const watchedEnd = form.watch("end_time");

  useEffect(() => {
    if (readOnly) return;
    if (!watchedStart || !watchedEnd) return;
    const start = new Date(watchedStart);
    const end = new Date(watchedEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
    if (end <= start) return;

    const handle = setTimeout(async () => {
      try {
        const overlap = await checkShiftOverlap(
          defaultValues.store_id,
          watchedUser ?? null,
          watchedStart,
          watchedEnd,
          defaultValues.id
        );
        if (overlap) {
          form.setError("end_time", {
            type: "validate",
            message: "동일 시간대에 겹치는 근무가 있습니다.",
          });
        } else {
          form.clearErrors(["start_time", "end_time"]);
        }
      } catch (e) {
        // 네트워크 오류는 무시 (제출 시 재검증)
      }
    }, 350);

    return () => clearTimeout(handle);
  }, [
    watchedUser,
    watchedStart,
    watchedEnd,
    readOnly,
    defaultValues.store_id,
    defaultValues.id,
    form,
  ]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      id: defaultValues.id,
      store_id: defaultValues.store_id,
      user_id: values.user_id ?? null,
      start_time: values.start_time,
      end_time: values.end_time,
      position: values.position ?? null,
      notes: values.notes ?? null,
    });
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="user_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>담당자</FormLabel>
              <Select
                onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                value={field.value ?? undefined}
                disabled={readOnly}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="담당자 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {!hideUnassignedOption && (
                    <SelectItem value="none">미배정</SelectItem>
                  )}
                  {staffOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>시작 시간</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>종료 시간</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} disabled={readOnly} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>포지션</FormLabel>
              <FormControl>
                <Input
                  placeholder="예: 바리스타"
                  {...field}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>메모</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="메모를 입력하세요"
                  {...field}
                  disabled={readOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!readOnly && (
          <div className="flex justify-end gap-2">
            <Button type="submit" className="glass-subtle hover:glass">
              저장
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
