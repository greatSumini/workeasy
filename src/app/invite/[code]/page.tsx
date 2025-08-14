"use client";

import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { acceptInvitation } from "@/features/invitations/api";

export default function InviteAcceptPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      toast({
        title: "로그인이 필요합니다",
        description: "먼저 로그인해 주세요.",
      });
      router.push(`/login?redirect=/invite/${code}`);
      return;
    }
    try {
      setLoading(true);
      await acceptInvitation(code);
      toast({ title: "초대 수락", description: "팀에 참여했습니다!" });
      router.replace("/dashboard");
    } catch (e: any) {
      toast({ title: "초대 수락 실패", description: e.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold">팀 초대</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        팀에 참여하시겠습니까?
      </p>
      <Button className="mt-4 w-full" onClick={handleAccept} disabled={loading}>
        {loading ? "처리 중..." : "초대 수락"}
      </Button>
    </main>
  );
}
