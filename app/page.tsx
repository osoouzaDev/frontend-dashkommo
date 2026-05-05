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
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return null;
}
