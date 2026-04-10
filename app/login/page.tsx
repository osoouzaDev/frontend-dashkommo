"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  User2,
} from "lucide-react";

import { login } from "@/services/users";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();

  const [userLogin, setUserLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuario = localStorage.getItem("usuario");

    if (token && usuario) {
      router.push("/dashboard");
    }
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLoading(true);
      setErro("");

      const response = await login({ userLogin, senha });

      localStorage.setItem("token", response.token);
      localStorage.setItem("usuario", JSON.stringify(response.usuario));

      router.push("/dashboard");
    } catch (error: any) {
      setErro(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/40">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(120,119,198,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_32%)]" />

      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden lg:flex lg:flex-col lg:justify-between lg:border-r lg:bg-background/60 lg:p-10 xl:p-14">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight">DashKommo</h1>
                <p className="text-sm text-muted-foreground">
                  Painel moderno para sua operação
                </p>
              </div>
            </div>

            <div className="max-w-xl space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Acesso seguro ao sistema
              </span>

              <h2 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
                Controle sua operação com mais clareza, velocidade e presença.
              </h2>

              <p className="text-base leading-7 text-muted-foreground">
                Acompanhe usuários, leads, relatórios e resultados do funil em
                uma interface mais elegante, organizada e profissional.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Segurança e controle</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Acesso autenticado, proteção por perfil e integração com seu
                    backend.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-sm">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Experiência profissional</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Uma interface mais limpa, moderna e preparada para crescer
                    junto com o sistema.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">DashKommo</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Faça login para acessar o painel
              </p>
            </div>

            <Card className="rounded-3xl border-0 bg-background/95 shadow-2xl backdrop-blur">
              <CardContent className="p-6 sm:p-8">
                <div className="mb-8">
                  <div className="mb-3 inline-flex rounded-full border bg-primary/5 px-3 py-1 text-xs text-primary">
                    Acesso ao sistema
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">Entrar</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Informe suas credenciais para continuar no painel.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="userLogin">Login</Label>
                    <div className="relative">
                      <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="userLogin"
                        value={userLogin}
                        onChange={(e) => setUserLogin(e.target.value)}
                        placeholder="Digite seu login"
                        className="h-12 rounded-xl pl-10"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="senha"
                        type={mostrarSenha ? "text" : "password"}
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Digite sua senha"
                        className="h-12 rounded-xl pl-10 pr-12"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha((valor) => !valor)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {mostrarSenha ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {erro ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {erro}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl text-sm font-semibold shadow-md"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Entrando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn className="h-4 w-4" />
                        Entrar
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 rounded-2xl border bg-muted/30 p-4 text-xs text-muted-foreground">
                  Seu acesso é protegido e vinculado ao perfil configurado no
                  backend.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}