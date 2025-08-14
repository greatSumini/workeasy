"use client";

import AuthGuard from "@/components/auth/AuthGuard";
import { useUserProfile } from "@/features/settings/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { data, isLoading, error } = useUserProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const onLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      queryClient.clear();
      toast({ title: "로그아웃됨", description: "다음에 또 만나요." });
      window.location.href = "/login";
    } catch (_e) {
      toast({
        title: "로그아웃 실패",
        description: "잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen ios-gradient flex items-center justify-center">
        <div className="glass glass-animation rounded-2xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="text-lg font-medium">프로필을 불러오는 중...</span>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen ios-gradient flex items-center justify-center">
        <div className="glass glass-animation rounded-2xl p-8 text-center">
          <div className="text-red-600 mb-2">프로필 로드 실패</div>
          <div className="text-sm text-gray-600">{error.message}</div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen ios-gradient">
      <div className="fixed inset-0 ios-gradient-mesh opacity-30" />
      <div className="relative z-10 p-6 space-y-6">
        <header className="glass-strong glass-animation rounded-2xl p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            프로필
          </h1>
          <p className="text-muted-foreground mt-2">
            내 계정 정보를 확인하고 관리하세요
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass glass-animation rounded-2xl p-6">
            <CardContent className="p-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src={
                      data.avatarUrl ||
                      "https://picsum.photos/seed/workeasy-profile/128/128"
                    }
                    alt="avatar"
                  />
                  <AvatarFallback>WE</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-semibold">
                    {data.fullName || "이름 없음"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.email}
                  </div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="glass-subtle glass-animation rounded-xl p-4">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    역할
                  </div>
                  <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {data.role === "manager" ? "관리자" : "직원"}
                  </div>
                </div>
                <div className="glass-subtle glass-animation rounded-xl p-4">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    소속 매장
                  </div>
                  <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-orange-600 to-pink-600 bg-clip-text text-transparent">
                    {data.storeName || "미지정"}
                  </div>
                </div>
                <div className="glass-subtle glass-animation rounded-xl p-4">
                  <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    가입일
                  </div>
                  <div className="mt-2 text-3xl font-bold bg-gradient-to-br from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {format(new Date(data.joinedAt), "yyyy.MM.dd")}
                  </div>
                </div>
                <div className="glass-subtle glass-animation rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      상태
                    </div>
                    <div className="mt-2">
                      <Badge className="glass-subtle">활성</Badge>
                    </div>
                  </div>
                  <Button
                    className="glass-subtle hover:glass"
                    onClick={onLogout}
                  >
                    로그아웃
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="glass glass-animation rounded-2xl p-6">
              <div className="text-sm text-muted-foreground">
                향후 업데이트에서 프로필 편집, 알림 설정 바로가기를 제공할
                예정입니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
