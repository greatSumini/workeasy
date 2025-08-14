"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (mounted && !data.session) {
        router.replace("/login");
      }
    })();

    const supabase2 = createClient();
    const { data: sub } = supabase2.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          router.replace("/login");
        }
      }
    );
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  return <>{children}</>;
}
