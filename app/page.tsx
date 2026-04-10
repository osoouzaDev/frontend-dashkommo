"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (!token || !usuario) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(usuario);

      if (user.acesso === "administrador") {
        router.replace("/dashboard");
      } else {
        router.replace("/dashboard");
      }
    } catch (error) {
      console.error("Erro ao ler usuário:", error);
      localStorage.clear();
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