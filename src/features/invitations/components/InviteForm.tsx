"use client";

import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createInvitation } from "../api";

const schema = z.object({
  email: z
    .string()
    .email("유효한 이메일을 입력해 주세요.")
    .optional()
    .or(z.literal("")),
  role: z.enum(["staff", "manager"]).default("staff"),
});

type FormValues = z.infer<typeof schema>;

export function InviteForm({
  storeId,
  onCreated,
}: {
  storeId: string;
  onCreated?: () => void;
}) {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "staff" },
    mode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const inv = await createInvitation({
        storeId,
        inviteeEmail: values.email || undefined,
        role: values.role,
      });
      toast({ title: "초대 생성", description: `코드: ${inv.code}` });
      onCreated?.();
    } catch (e: any) {
      toast({ title: "초대 실패", description: e.message ?? String(e) });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email">이메일(선택)</FormLabel>
              <FormControl>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">직원</SelectItem>
                  <SelectItem value="manager">관리자</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={!form.formState.isValid}
        >
          초대 생성
        </Button>
      </form>
    </Form>
  );
}
