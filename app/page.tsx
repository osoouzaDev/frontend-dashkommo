"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, getStoredUser, hasSession } from "@/services/authSession";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSession()) {
      router.replace("/login");
      return;
    }

    try {
      const user = getStoredUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      if (user.acesso === "administrador") {
        router.replace("/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Erro ao ler usuário:", error);
      clearSession();
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
        <div className="glass-card gradient-border w-full max-w-md rounded-[2rem] border-0 p-8 text-center shadow-[0_30px_80px_rgba(17,24,39,0.18)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/15">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">DashKommo</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preparando seu workspace e redirecionando para o painel.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
