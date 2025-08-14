"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

const schema = z.object({
  email: z.string().email("유효한 이메일을 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  storeName: z.string().min(2, "매장명은 2자 이상 입력해 주세요."),
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

function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      storeName: "",
      address: "",
      phone: "",
    },
    mode: "onChange",
  });

  const onSubmit = async (values: FormValues) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast({ title: "회원가입 실패", description: error.message });
      return;
    }

    if (!data.session) {
      toast({
        title: "이메일 확인 필요",
        description: "이메일로 전송된 링크를 확인해 주세요.",
      });
      return;
    }

    const { error: rpcError } = await supabase.rpc("create_store_as_owner", {
      store_name: values.storeName,
      store_address: values.address || null,
      store_phone: values.phone || null,
    });
    if (rpcError) {
      toast({ title: "매장 생성 실패", description: rpcError.message });
      return;
    }

    toast({
      title: "회원가입 완료",
      description: "관리자 대시보드로 이동합니다.",
    });
    const redirect = params.get("redirect") || "/admin/dashboard";
    router.replace(redirect);
  };

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold">회원가입</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        매장 관리자만 가입할 수 있습니다. 알바생은 초대 링크로 가입해 주세요.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="email">이메일</FormLabel>
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="password">비밀번호</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="storeName">매장명</FormLabel>
                <FormControl>
                  <Input
                    id="storeName"
                    placeholder="워크이지 카페"
                    {...field}
                  />
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
            회원가입
          </Button>

          <div className="text-sm text-muted-foreground">
            이미 계정이 있으신가요?{" "}
            <Link className="underline" href="/login">
              로그인
            </Link>
          </div>
        </form>
      </Form>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-sm p-6">로딩중...</div>}>
      <SignupContent />
    </Suspense>
  );
}
