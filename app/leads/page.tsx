"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Filter,
  Home,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  buscarRelatorio,
  type RelatorioItem,
  type UsuarioLogin,
} from "@/services/users";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: Users, label: "Usuários", href: "/usuarios" },
  { icon: FileText, label: "Leads", href: "/leads" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

type FiltroEtapa = "todos" | "ganhos" | "perdidos" | "andamento";

const STATUS_GANHO = 142;
const STATUS_PERDIDO = 143;

export default function LeadsPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogin | null>(null);
  const [leads, setLeads] = useState<RelatorioItem[]>([]);
  const [filtro, setFiltro] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<FiltroEtapa>("todos");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const usuarioStorage = localStorage.getItem("usuario");

    if (!token || !usuarioStorage) {
      router.push("/login");
      return;
    }

    try {
      const usuarioParse: UsuarioLogin = JSON.parse(usuarioStorage);

      if (usuarioParse.acesso !== "administrador") {
        router.push("/dashboard");
        return;
      }

      setUsuario(usuarioParse);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    async function carregarLeads() {
      if (!usuario) return;

      try {
        setLoading(true);
        setErro("");
        const data = await buscarRelatorio();
        setLeads(data);
      } catch (error: any) {
        setErro(error.message || "Erro ao carregar leads");
      } finally {
        setLoading(false);
      }
    }

    carregarLeads();
  }, [usuario]);

  function ehGanho(lead: RelatorioItem) {
    return Number(lead.status_id) === STATUS_GANHO;
  }

  function ehPerdido(lead: RelatorioItem) {
    return Number(lead.status_id) === STATUS_PERDIDO;
  }

  function ehAndamento(lead: RelatorioItem) {
    const statusId = Number(lead.status_id);
    return statusId !== STATUS_GANHO && statusId !== STATUS_PERDIDO;
  }

  const leadsFiltrados = useMemo(() => {
    const termo = filtro.toLowerCase().trim();

    return leads.filter((lead) => {
      const bateTexto =
        !termo ||
        lead.lead_nome?.toLowerCase().includes(termo) ||
        lead.consultor_nome?.toLowerCase().includes(termo) ||
        lead.origem?.toLowerCase().includes(termo) ||
        lead.etapa?.toLowerCase().includes(termo) ||
        String(lead.status_id ?? "").includes(termo);

      const bateEtapa =
        filtroEtapa === "todos"
          ? true
          : filtroEtapa === "ganhos"
          ? ehGanho(lead)
          : filtroEtapa === "perdidos"
          ? ehPerdido(lead)
          : ehAndamento(lead);

      return Boolean(bateTexto && bateEtapa);
    });
  }, [leads, filtro, filtroEtapa]);

  const metricas = useMemo(() => {
    const total = leads.length;
    const ganhos = leads.filter(ehGanho).length;
    const perdidos = leads.filter(ehPerdido).length;
    const andamento = leads.filter(ehAndamento).length;

    const valorGanho = leads
      .filter(ehGanho)
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const consultores = new Set(
      leads.map((item) => item.consultor_nome).filter(Boolean)
    ).size;

    return {
      total,
      ganhos,
      perdidos,
      andamento,
      valorGanho,
      consultores,
    };
  }, [leads]);

  const leadsOrdenados = useMemo(() => {
    return [...leadsFiltrados].sort((a, b) => {
      const dataA = a.data_criacao ? new Date(a.data_criacao).getTime() : 0;
      const dataB = b.data_criacao ? new Date(b.data_criacao).getTime() : 0;
      return dataB - dataA;
    });
  }, [leadsFiltrados]);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function badgeEtapa(lead: RelatorioItem) {
    if (ehGanho(lead)) {
      return "default";
    }

    if (ehPerdido(lead)) {
      return "destructive";
    }

    return "secondary";
  }

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
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

  function porcentagem(valor: number, total: number) {
    if (!total) return 0;
    return (valor / total) * 100;
  }

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
                    Central de leads
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
                    <p className="truncate text-sm font-semibold">{usuario.nome}</p>
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
                  {item.label}
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
                  <h2 className="text-lg font-semibold tracking-tight">Leads</h2>
                  <p className="text-xs text-muted-foreground">
                    Gestão visual e estratégica do funil
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
                        Funil inteligente
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                        {saudacao()}, {usuario.nome}
                      </h1>
                      <p className="max-w-2xl text-sm text-muted-foreground">
                        Acompanhe os leads do sistema com mais clareza, aplique
                        filtros rápidos e visualize o andamento do funil em uma
                        central mais moderna e profissional.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge className="rounded-full px-4 py-2">
                        {loading ? "..." : `${metricas.total} leads`}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-4 py-2">
                        {loading ? "..." : `${metricas.consultores} consultores`}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de leads
                    </CardTitle>
                    <CardDescription>visão geral</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <Briefcase className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.total}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Registros processados pelo backend
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ganhos
                    </CardTitle>
                    <CardDescription>conversão positiva</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.ganhos}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Leads com status de ganho
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Perdidos
                    </CardTitle>
                    <CardDescription>oportunidades encerradas</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-destructive/10 p-2 text-destructive">
                    <TrendingDown className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.perdidos}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Leads com status de perdido
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Valor ganho
                    </CardTitle>
                    <CardDescription>resultado acumulado</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <CircleDollarSign className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {loading ? "..." : formatarMoeda(metricas.valorGanho)}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Soma financeira apenas dos ganhos
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Explorar leads</CardTitle>
                  <CardDescription>
                    Busque por lead, consultor, origem ou etapa
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Digite para filtrar leads..."
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      className="h-12 rounded-xl pl-10"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={filtroEtapa === "todos" ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setFiltroEtapa("todos")}
                    >
                      Todos
                    </Button>

                    <Button
                      type="button"
                      variant={filtroEtapa === "ganhos" ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setFiltroEtapa("ganhos")}
                    >
                      Ganhos
                    </Button>

                    <Button
                      type="button"
                      variant={filtroEtapa === "perdidos" ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setFiltroEtapa("perdidos")}
                    >
                      Perdidos
                    </Button>

                    <Button
                      type="button"
                      variant={filtroEtapa === "andamento" ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setFiltroEtapa("andamento")}
                    >
                      Em andamento
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Resumo do funil</CardTitle>
                  <CardDescription>Distribuição atual</CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Ganhos
                      </span>
                      <span className="font-medium">{metricas.ganhos}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{
                          width: `${porcentagem(metricas.ganhos, metricas.total)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-destructive" />
                        Perdidos
                      </span>
                      <span className="font-medium">{metricas.perdidos}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-destructive"
                        style={{
                          width: `${porcentagem(metricas.perdidos, metricas.total)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-amber-500" />
                        Em andamento
                      </span>
                      <span className="font-medium">{metricas.andamento}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-amber-500"
                        style={{
                          width: `${porcentagem(metricas.andamento, metricas.total)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="mb-1 text-sm font-medium">Leitura rápida</p>
                    <p className="text-xs text-muted-foreground">
                      A listagem é baseada nos dados processados pelo endpoint de
                      relatório do backend.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {erro ? (
              <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-sm">
                {erro}
              </div>
            ) : null}

            <section className="mt-6">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription>
                      Total encontrado: {loading ? "..." : leadsOrdenados.length}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    {filtroEtapa === "todos"
                      ? "Sem filtro de etapa"
                      : filtroEtapa === "ganhos"
                      ? "Filtrando ganhos"
                      : filtroEtapa === "perdidos"
                      ? "Filtrando perdidos"
                      : "Filtrando em andamento"}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="rounded-2xl border p-4 shadow-sm"
                      >
                        <div className="mb-3 h-4 w-48 animate-pulse rounded bg-muted" />
                        <div className="mb-2 h-3 w-32 animate-pulse rounded bg-muted" />
                        <div className="mb-2 h-3 w-28 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                      </div>
                    ))
                  ) : leadsOrdenados.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-10 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium">Nenhum lead encontrado</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Tente ajustar o texto da busca ou trocar o filtro de etapa.
                      </p>
                    </div>
                  ) : (
                    leadsOrdenados.map((lead) => (
                      <div
                        key={lead.lead_id}
                        className="group rounded-2xl border p-4 shadow-sm transition hover:border-primary/30 hover:bg-muted/30"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold tracking-tight">
                                {lead.lead_nome}
                              </p>
                              <Badge
                                variant={badgeEtapa(lead) as any}
                                className="rounded-full"
                              >
                                {lead.etapa || "Sem etapa"}
                              </Badge>
                            </div>

                            <div className="grid gap-1 text-sm text-muted-foreground">
                              <p>
                                <span className="font-medium text-foreground/80">
                                  Consultor:
                                </span>{" "}
                                {lead.consultor_nome || "Não definido"}
                              </p>
                              <p>
                                <span className="font-medium text-foreground/80">
                                  Origem:
                                </span>{" "}
                                {lead.origem || "Não informado"}
                              </p>
                              <p>
                                <span className="font-medium text-foreground/80">
                                  Pipeline:
                                </span>{" "}
                                {lead.pipeline_id ?? "-"}{" "}
                                <span className="mx-1">•</span>
                                <span className="font-medium text-foreground/80">
                                  Status:
                                </span>{" "}
                                {lead.status_id ?? "-"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-start gap-2 lg:items-end">
                            <p className="text-base font-semibold">
                              {formatarMoeda(Number(lead.valor || 0))}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Criação:{" "}
                              {lead.data_criacao
                                ? new Date(lead.data_criacao).toLocaleString("pt-BR")
                                : "-"}
                            </p>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 rounded-xl px-3"
                              onClick={() => router.push("/relatorios")}
                            >
                              Ver análise
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>
          </main>

          <footer className="border-t bg-background/80 px-4 py-4 backdrop-blur lg:px-6">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
              <p>© DashKommo. Gestão de leads do sistema.</p>
              <p>Developed by soouzaDev</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}