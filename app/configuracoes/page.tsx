"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useCompactMode } from "@/components/compact-mode-provider";
import { getErrorMessage } from "@/lib/error-message";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  updateStoredUser,
} from "@/services/authSession";
import { performLogout } from "@/services/logout";
import { atualizarMeuPerfil } from "@/services/users";
import {
  BarChart3,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Home,
  Lock,
  LogOut,
  Menu,
  MonitorCog,
  MoonStar,
  Palette,
  Settings,
  Shield,
  Sparkles,
  SunMedium,
  User2,
  Users,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type UsuarioLogin = {
  id: number;
  nome: string;
  email?: string;
  acesso: "administrador" | "usuario";
};

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

type ToggleCardProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

function ToggleCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: ToggleCardProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-muted/40"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>

        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div
        className={`relative h-7 w-12 rounded-full transition ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-1 h-5 w-5 rounded-full bg-background shadow transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </div>
    </button>
  );
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogin | null>(() => getStoredUser());

  const [nome, setNome] = useState(() => getStoredUser()?.nome ?? "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilMensagem, setPerfilMensagem] = useState("");
  const [perfilErro, setPerfilErro] = useState("");

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const { isCompact, setIsCompact } = useCompactMode();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const token = getAccessToken();

    if (!token || !usuario) {
      clearSession();
      router.push("/login");
    }
  }, [router, usuario]);

  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();

    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
      setPerfilMensagem("");
      setPerfilErro("Informe um nome válido.");
      return;
    }

    try {
      setSalvandoPerfil(true);
      setPerfilMensagem("");
      setPerfilErro("");

      const resposta = await atualizarMeuPerfil({ nome: nomeLimpo });
      setNome(resposta.usuario.nome);
      setUsuario(resposta.usuario);
      updateStoredUser({ nome: resposta.usuario.nome });
      setPerfilMensagem(resposta.message || "Perfil atualizado com sucesso.");
    } catch (error: unknown) {
      setPerfilMensagem("");
      setPerfilErro(getErrorMessage(error, "Erro ao atualizar perfil"));
    } finally {
      setSalvandoPerfil(false);
    }
  }

  function handleSalvarSenha(e: React.FormEvent) {
    e.preventDefault();

    if (novaSenha !== confirmarSenha) {
      alert("A confirmação da senha não confere.");
      return;
    }

    alert("Seu backend ainda não possui rota para alterar senha.");
  }

  async function handleLogout() {
    await performLogout();
    router.push("/login");
  }

  function getInitials(nome?: string) {
    if (!nome) return "US";

    return nome
      .split(" ")
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("");
  }

  function saudacao() {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }

  const forcaSenha = useMemo(() => {
    let pontos = 0;

    if (novaSenha.length >= 8) pontos += 1;
    if (/[A-Z]/.test(novaSenha)) pontos += 1;
    if (/[a-z]/.test(novaSenha)) pontos += 1;
    if (/[0-9]/.test(novaSenha)) pontos += 1;
    if (/[^A-Za-z0-9]/.test(novaSenha)) pontos += 1;

    if (!novaSenha) {
      return {
        label: "Não definida",
        progresso: 0,
      };
    }

    if (pontos <= 2) {
      return {
        label: "Fraca",
        progresso: 33,
      };
    }

    if (pontos <= 4) {
      return {
        label: "Média",
        progresso: 68,
      };
    }

    return {
      label: "Forte",
      progresso: 100,
    };
  }, [novaSenha]);

  const menuAdmin: MenuItem[] = [
    { icon: Home, label: "Início", href: "/dashboard" },
    { icon: Users, label: "Usuários", href: "/usuarios" },
    { icon: FileText, label: "Leads", href: "/leads" },
    { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
  ];

  const menuUsuario: MenuItem[] = [
    { icon: Home, label: "Início", href: "/dashboard" },
    { icon: Settings, label: "Configurações", href: "/configuracoes" },
  ];

  const menuItems =
    usuario?.acesso === "administrador" ? menuAdmin : menuUsuario;

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/40">
      <div className="flex min-h-screen">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r bg-background/95 backdrop-blur transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="border-b px-6 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">DashKommo</h1>
                  <p className="text-xs text-muted-foreground">
                    Central de ajustes
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="px-4 py-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-transparent shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback>{getInitials(usuario.nome)}</AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {usuario.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Perfil: {usuario.acesso}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 space-y-2 px-4 pb-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Button
                  key={item.label}
                  variant={active ? "default" : "ghost"}
                  className={`h-11 w-full justify-start gap-3 rounded-xl ${
                    active ? "shadow-sm" : ""
                  }`}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          <div className="border-t p-4">
            <Button
              variant="destructive"
              className="h-11 w-full gap-2 rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 lg:px-6">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>

                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Configurações
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Ajustes pessoais, segurança e experiência
                  </p>
                </div>
              </div>

              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(usuario.nome)}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-6">
            <section className="mb-6">
              <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Sparkles className="h-4 w-4" />
                        Experiência personalizada
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                        {saudacao()}, {usuario.nome}
                      </h1>
                      <p className="max-w-2xl text-sm text-muted-foreground">
                        Configure seu ambiente, personalize a experiência e
                        acompanhe o estado da sua conta em uma central mais
                        elegante e funcional.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge
                        variant={
                          usuario.acesso === "administrador"
                            ? "default"
                            : "secondary"
                        }
                        className="rounded-full px-4 py-2"
                      >
                        {usuario.acesso === "administrador"
                          ? "Administrador"
                          : "Usuário"}
                      </Badge>

                      <Badge variant="outline" className="rounded-full px-4 py-2">
                        Conta ativa
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <div className="space-y-6">
                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Perfil</CardTitle>
                    <CardDescription>
                      Atualize seus dados básicos e veja uma prévia do seu perfil.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <form onSubmit={handleSalvarPerfil} className="space-y-4">
                      {perfilErro ? (
                        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                          {perfilErro}
                        </div>
                      ) : null}

                      {perfilMensagem ? (
                        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
                          {perfilMensagem}
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <Label htmlFor="nome">Nome</Label>
                        <div className="relative">
                          <User2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="nome"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="h-12 rounded-xl pl-10"
                            placeholder="Digite seu nome"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Acesso</Label>
                        <div className="relative">
                          <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            value={usuario.acesso}
                            disabled
                            className="h-12 rounded-xl pl-10 capitalize"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="rounded-xl"
                        disabled={salvandoPerfil}
                      >
                        {salvandoPerfil ? "Salvando..." : "Salvar alterações"}
                      </Button>
                    </form>

                    <div className="rounded-3xl border bg-muted/20 p-5">
                      <p className="mb-4 text-sm font-medium text-muted-foreground">
                        Prévia do perfil
                      </p>

                      <div className="rounded-3xl border bg-background p-5 shadow-sm">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarFallback>
                              {getInitials(nome || usuario.nome)}
                            </AvatarFallback>
                          </Avatar>

                          <div>
                            <p className="font-semibold">{nome || usuario.nome}</p>
                            <p className="text-sm text-muted-foreground">
                              Perfil: {usuario.acesso}
                            </p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-between">
                            <span>Status da conta</span>
                            <span className="font-medium text-foreground">
                              Ativa
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Nível de acesso</span>
                            <span className="font-medium text-foreground capitalize">
                              {usuario.acesso}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Segurança</CardTitle>
                    <CardDescription>
                      Reforce sua conta com uma senha mais segura.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <form onSubmit={handleSalvarSenha} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="senhaAtual">Senha atual</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="senhaAtual"
                            type={mostrarSenhaAtual ? "text" : "password"}
                            value={senhaAtual}
                            onChange={(e) => setSenhaAtual(e.target.value)}
                            className="h-12 rounded-xl pl-10 pr-12"
                            placeholder="Digite sua senha atual"
                          />
                          <button
                            type="button"
                            onClick={() => setMostrarSenhaAtual((valor) => !valor)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                          >
                            {mostrarSenhaAtual ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="novaSenha">Nova senha</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="novaSenha"
                            type={mostrarNovaSenha ? "text" : "password"}
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            className="h-12 rounded-xl pl-10 pr-12"
                            placeholder="Digite a nova senha"
                          />
                          <button
                            type="button"
                            onClick={() => setMostrarNovaSenha((valor) => !valor)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                          >
                            {mostrarNovaSenha ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmarSenha">Confirmar nova senha</Label>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="confirmarSenha"
                            type={mostrarConfirmarSenha ? "text" : "password"}
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            className="h-12 rounded-xl pl-10 pr-12"
                            placeholder="Confirme a nova senha"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setMostrarConfirmarSenha((valor) => !valor)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                          >
                            {mostrarConfirmarSenha ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Button type="submit" className="rounded-xl">
                        Atualizar senha
                      </Button>
                    </form>

                    <div className="space-y-4 rounded-3xl border bg-muted/20 p-5">
                      <div>
                        <p className="text-sm font-medium">Força da senha</p>
                        <p className="text-xs text-muted-foreground">
                          Quanto mais forte, melhor para sua segurança.
                        </p>
                      </div>

                      <div className="h-3 rounded-full bg-muted">
                        <div
                          className="h-3 rounded-full bg-primary transition-all"
                          style={{ width: `${forcaSenha.progresso}%` }}
                        />
                      </div>

                      <Badge variant="outline" className="rounded-full">
                        {forcaSenha.label}
                      </Badge>

                      <div className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                        Para uma senha forte, use letras maiúsculas, minúsculas,
                        números e símbolos.
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Preferências de experiência</CardTitle>
                    <CardDescription>
                      Ajustes visuais e operacionais para o seu uso diário.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-4">
                    <ToggleCard
                      icon={MonitorCog}
                      title="Modo compacto"
                      description="Reduza espaçamentos para uma visualização mais densa."
                      checked={isCompact}
                      onChange={setIsCompact}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Tema</CardTitle>
                    <CardDescription>
                      Escolha o estilo visual preferido para o painel.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => setTheme("system")}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                        theme === "system"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MonitorCog className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Sistema</p>
                          <p className="text-sm text-muted-foreground">
                            Segue o tema do dispositivo.
                          </p>
                        </div>
                      </div>
                      {theme === "system" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("light")}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                        theme === "light"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <SunMedium className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Claro</p>
                          <p className="text-sm text-muted-foreground">
                            Interface luminosa e limpa.
                          </p>
                        </div>
                      </div>
                      {theme === "light" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : null}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTheme("dark")}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                        theme === "dark"
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <MoonStar className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Escuro</p>
                          <p className="text-sm text-muted-foreground">
                            Mais conforto visual em ambientes escuros.
                          </p>
                        </div>
                      </div>
                      {theme === "dark" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : null}
                    </button>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Conta e sessão</CardTitle>
                    <CardDescription>
                      Estado atual da sua autenticação e ambiente.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-medium">Status da conta</p>
                        <Badge className="rounded-full">Ativa</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Seu acesso está funcionando normalmente.
                      </p>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-medium">Idioma</p>
                        <span className="text-sm text-muted-foreground">
                          Português (Brasil)
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        Configuração visual local
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <p className="font-medium">Personalização</p>
                        <span className="text-sm text-muted-foreground capitalize">
                          Tema {theme}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                        <Palette className="h-4 w-4" />
                        Visual configurável
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Atalhos rápidos</CardTitle>
                    <CardDescription>Navegação inteligente</CardDescription>
                  </CardHeader>

                  <CardContent className="grid gap-3">
                    <button
                      type="button"
                      onClick={() => router.push("/dashboard")}
                      className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-muted/40"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="h-4 w-4" />
                        <div>
                          <p className="font-medium">Voltar ao dashboard</p>
                          <p className="text-sm text-muted-foreground">
                            Retorne à visão geral.
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {usuario.acesso === "administrador" && (
                      <button
                        type="button"
                        onClick={() => router.push("/relatorios")}
                        className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Abrir relatórios</p>
                            <p className="text-sm text-muted-foreground">
                              Acompanhe métricas e resultados.
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          </main>

          <footer className="border-t bg-background/80 px-4 py-4 backdrop-blur lg:px-6">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
              <p>© DashKommo. Configurações do sistema.</p>
              <p>Developed by soouzaDev</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
