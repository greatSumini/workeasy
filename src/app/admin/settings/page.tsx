"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

const schema = z.object({
  name: z.string().min(2, "매장명은 2자 이상 입력해 주세요."),
  address: z
    .string()
    .max(255, "주소는 255자 이하여야 합니다.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || v === "" || phoneRegex.test(v),
      "유효한 전화번호를 입력해 주세요."
    ),
});

type FormValues = z.infer<typeof schema>;

export default function AdminSettingsPage() {
  return (
    <AuthGuard>
      <Content />
    </AuthGuard>
  );
}

function Content() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", address: "", phone: "" },
    mode: "onChange",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // AuthGuard will redirect

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (error) {
        router.replace("/dashboard?reason=not_manager");
        return;
      }
      if (active) {
        if (!data || data.role !== "manager") {
          router.replace("/dashboard?reason=not_manager");
        } else {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const onSubmit = async (values: FormValues) => {
    const supabase = createClient();
    try {
      const { error } = await supabase.rpc("create_store_as_owner", {
        store_name: values.name,
        store_address: values.address || null,
        store_phone: values.phone || null,
      });
      if (error) throw error;
      toast({ title: "매장 생성 완료", description: "대시보드로 이동합니다." });
      router.replace("/admin/dashboard");
    } catch (e: any) {
      toast({ title: "매장 생성 실패", description: e.message ?? String(e) });
    }
  };

  if (loading) return <main className="p-6">로딩중...</main>;

  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold">매장 설정</h1>
      <p className="text-sm text-muted-foreground mt-2">
        매장이 없으신 경우 새로운 매장을 생성하세요.
      </p>

      <div className="mt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="name">매장명</FormLabel>
                  <FormControl>
                    <Input id="name" placeholder="워크이지 카페" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="address">주소 (선택)</FormLabel>
                  <FormControl>
                    <Input id="address" placeholder="서울시 ..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="phone">전화번호 (선택)</FormLabel>
                  <FormControl>
                    <Input id="phone" placeholder="010-1234-5678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={!form.formState.isValid}
            >
              매장 만들기
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
