"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  buscarRelatorio,
  type RelatorioItem,
  type UsuarioLogin,
} from "@/services/users";
import { clearSession, getAccessToken, getStoredUser } from "@/services/authSession";
import { performLogout } from "@/services/logout";
import { getErrorMessage } from "@/lib/error-message";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const menuItems = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: Users, label: "Usuários", href: "/usuarios" },
  { icon: FileText, label: "Leads", href: "/leads" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

const meses = [
  { label: "Todos os meses", value: "todos" },
  { label: "Janeiro", value: "1" },
  { label: "Fevereiro", value: "2" },
  { label: "Março", value: "3" },
  { label: "Abril", value: "4" },
  { label: "Maio", value: "5" },
  { label: "Junho", value: "6" },
  { label: "Julho", value: "7" },
  { label: "Agosto", value: "8" },
  { label: "Setembro", value: "9" },
  { label: "Outubro", value: "10" },
  { label: "Novembro", value: "11" },
  { label: "Dezembro", value: "12" },
];

const PIE_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#84cc16",
  "#f97316",
];

const STATUS_GANHO = 142;
const STATUS_PERDIDO = 143;

export default function RelatoriosPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogin | null>(null);
  const [relatorio, setRelatorio] = useState<RelatorioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [mesSelecionado, setMesSelecionado] = useState("todos");
  const [anoSelecionado, setAnoSelecionado] = useState(
    String(new Date().getFullYear())
  );

  useEffect(() => {
    const token = getAccessToken();
    const usuarioStorage = getStoredUser();

    if (!token || !usuarioStorage) {
      router.push("/login");
      return;
    }

    if (usuarioStorage.acesso !== "administrador") {
      router.push("/dashboard");
      return;
    }

    if (!usuarioStorage.id) {
      clearSession();
      router.push("/login");
      return;
    }

    setUsuario(usuarioStorage);
  }, [router]);

  useEffect(() => {
    async function carregar() {
      if (!usuario) return;

      try {
        setLoading(true);
        setErro("");
        const data = await buscarRelatorio();
        setRelatorio(data);
      } catch (error: unknown) {
        setErro(getErrorMessage(error, "Erro ao carregar relatório"));
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, [usuario]);

  const anosDisponiveis = useMemo(() => {
    const anos = relatorio
      .map((item) => {
        if (!item.data_criacao) return null;
        const data = new Date(item.data_criacao);
        const ano = data.getFullYear();
        return Number.isNaN(ano) ? null : ano;
      })
      .filter((ano): ano is number => ano !== null);

    const anosUnicos = Array.from(new Set(anos)).sort((a, b) => b - a);

    return anosUnicos.map((ano) => ({
      label: String(ano),
      value: String(ano),
    }));
  }, [relatorio]);

  useEffect(() => {
    if (anosDisponiveis.length > 0) {
      const anoExiste = anosDisponiveis.some(
        (ano) => ano.value === anoSelecionado
      );

      if (!anoExiste) {
        setAnoSelecionado(anosDisponiveis[0].value);
      }
    }
  }, [anosDisponiveis, anoSelecionado]);

  const relatorioFiltrado = useMemo(() => {
    return relatorio.filter((item) => {
      if (!item.data_criacao) return false;

      const data = new Date(item.data_criacao);

      if (Number.isNaN(data.getTime())) {
        return false;
      }

      const mesItem = data.getMonth() + 1;
      const anoItem = data.getFullYear();

      if (anoItem !== Number(anoSelecionado)) {
        return false;
      }

      if (mesSelecionado === "todos") {
        return true;
      }

      return mesItem === Number(mesSelecionado);
    });
  }, [relatorio, mesSelecionado, anoSelecionado]);

  const metricas = useMemo(() => {
    const totalLeads = relatorioFiltrado.length;

    const ganhos = relatorioFiltrado.filter(
      (item) => Number(item.status_id) === STATUS_GANHO
    );

    const perdidos = relatorioFiltrado.filter(
      (item) => Number(item.status_id) === STATUS_PERDIDO
    );

    const emAndamento = relatorioFiltrado.filter((item) => {
      const statusId = Number(item.status_id);
      return statusId !== STATUS_GANHO && statusId !== STATUS_PERDIDO;
    });

    const valorTotal = ganhos.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    const porOrigem = relatorioFiltrado.reduce<Record<string, number>>(
      (acc, item) => {
        const chave = item.origem || "Não informado";
        acc[chave] = (acc[chave] || 0) + 1;
        return acc;
      },
      {}
    );

    const porConsultor = relatorioFiltrado.reduce<Record<string, number>>(
      (acc, item) => {
        const chave = item.consultor_nome || "Não definido";
        acc[chave] = (acc[chave] || 0) + 1;
        return acc;
      },
      {}
    );

    return {
      totalLeads,
      valorTotal,
      ganhos: ganhos.length,
      perdidos: perdidos.length,
      emAndamento: emAndamento.length,
      porOrigem,
      porConsultor,
    };
  }, [relatorioFiltrado]);

  const dadosOrigem = useMemo(() => {
    return Object.entries(metricas.porOrigem)
      .map(([origem, total]) => ({
        origem,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [metricas.porOrigem]);

  const dadosConsultor = useMemo(() => {
    return Object.entries(metricas.porConsultor)
      .map(([consultor, total]) => ({
        consultor,
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }, [metricas.porConsultor]);

  const taxaConversao = useMemo(() => {
    if (!metricas.totalLeads) return 0;
    return (metricas.ganhos / metricas.totalLeads) * 100;
  }, [metricas.ganhos, metricas.totalLeads]);

  const mesAtualLabel = useMemo(() => {
    return meses.find((mes) => mes.value === mesSelecionado)?.label || "Período";
  }, [mesSelecionado]);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
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
                    Central analítica
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
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
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
                    Relatórios
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Métricas consolidadas e visão estratégica do funil
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  {anosDisponiveis.map((ano) => (
                    <option key={ano.value} value={ano.value}>
                      {ano.label}
                    </option>
                  ))}
                </select>

                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm"
                >
                  {meses.map((mes) => (
                    <option key={mes.value} value={mes.value}>
                      {mes.label}
                    </option>
                  ))}
                </select>

                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(usuario.nome)}</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-6">
            {erro ? (
              <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-sm">
                {erro}
              </div>
            ) : null}

            <section className="mb-6">
              <Card className="overflow-hidden border-0 bg-gradient-to-r from-primary/15 via-primary/10 to-transparent shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-primary">
                        <Sparkles className="h-4 w-4" />
                        Painel executivo
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                        {saudacao()}, {usuario.nome}
                      </h1>
                      <p className="max-w-2xl text-sm text-muted-foreground">
                        Analise a performance do período com mais clareza,
                        identifique padrões por origem e acompanhe a distribuição
                        dos leads por consultor e resultado.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge className="rounded-full px-4 py-2">
                        {mesAtualLabel}
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-4 py-2">
                        {anoSelecionado}
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
                    <CardDescription>no período</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <FileText className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.totalLeads}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Registros considerados no filtro
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Valor total
                    </CardTitle>
                    <CardDescription>leads ganhos</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <Wallet className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {loading ? "..." : formatarMoeda(metricas.valorTotal)}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Soma apenas dos ganhos
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ganhos
                    </CardTitle>
                    <CardDescription>conversões positivas</CardDescription>
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
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Visão geral do período</CardTitle>
                  <CardDescription>
                    Indicadores rápidos para {mesAtualLabel.toLowerCase()} de{" "}
                    {anoSelecionado}
                  </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Target className="h-4 w-4 text-primary" />
                      Conversão
                    </div>
                    <p className="text-2xl font-bold">{taxaConversao.toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Percentual de leads ganhos
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4 text-primary" />
                      Consultores
                    </div>
                    <p className="text-2xl font-bold">{dadosConsultor.length}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Com participação no período
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <CalendarRange className="h-4 w-4 text-primary" />
                      Filtro ativo
                    </div>
                    <p className="text-base font-semibold">
                      {mesAtualLabel} / {anoSelecionado}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Recorte atual do relatório
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Distribuição rápida</CardTitle>
                  <CardDescription>Ganhos x perdidos x em andamento</CardDescription>
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
                          width: `${
                            metricas.totalLeads
                              ? (metricas.ganhos / metricas.totalLeads) * 100
                              : 0
                          }%`,
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
                          width: `${
                            metricas.totalLeads
                              ? (metricas.perdidos / metricas.totalLeads) * 100
                              : 0
                          }%`,
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
                      <span className="font-medium">{metricas.emAndamento}</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted">
                      <div
                        className="h-3 rounded-full bg-amber-500"
                        style={{
                          width: `${
                            metricas.totalLeads
                              ? (metricas.emAndamento / metricas.totalLeads) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <p className="mb-1 text-sm font-medium">Leitura do período</p>
                    <p className="text-xs text-muted-foreground">
                      Os dados abaixo respeitam os filtros de ano e mês
                      selecionados no topo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Leads por origem</CardTitle>
                  <CardDescription>
                    Distribuição por origem cadastrada
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {loading ? (
                    <p className="text-sm text-muted-foreground">
                      Carregando gráfico...
                    </p>
                  ) : dadosOrigem.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Nenhum dado encontrado.
                    </div>
                  ) : (
                    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dadosOrigem}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                              dataKey="origem"
                              tickLine={false}
                              axisLine={false}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={90}
                            />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="total" radius={[10, 10, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="h-[360px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dadosOrigem}
                              dataKey="total"
                              nameKey="origem"
                              innerRadius={60}
                              outerRadius={110}
                              paddingAngle={3}
                            >
                              {dadosOrigem.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Leads por consultor</CardTitle>
                  <CardDescription>
                    Ranking por responsável no período
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-2xl border p-4"
                      >
                        <div className="space-y-2">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
                        </div>
                        <div className="h-6 w-12 animate-pulse rounded-full bg-muted" />
                      </div>
                    ))
                  ) : dadosConsultor.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Nenhum dado encontrado.
                    </div>
                  ) : (
                    dadosConsultor.map((item, index) => (
                      <div
                        key={item.consultor}
                        className="flex items-center justify-between rounded-2xl border p-4 transition hover:bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{item.consultor}</p>
                            <p className="text-sm text-muted-foreground">
                              Leads vinculados
                            </p>
                          </div>
                        </div>

                        <Badge className="rounded-full">{item.total}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="mt-6">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Resumo analítico</CardTitle>
                    <CardDescription>
                      Uma leitura consolidada do período selecionado
                    </CardDescription>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => router.push("/leads")}
                  >
                    Abrir leads
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border p-4">
                    <p className="text-sm font-medium">Melhor leitura financeira</p>
                    <p className="mt-2 text-2xl font-bold">
                      {formatarMoeda(metricas.valorTotal)}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Valor acumulado dos ganhos do período.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-sm font-medium">Performance comercial</p>
                    <p className="mt-2 text-2xl font-bold">
                      {taxaConversao.toFixed(1)}%
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Taxa de conversão baseada nos leads filtrados.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-sm font-medium">Volume operacional</p>
                    <p className="mt-2 text-2xl font-bold">{metricas.totalLeads}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Total de registros considerados na análise.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>

          <footer className="border-t bg-background/80 px-4 py-4 backdrop-blur lg:px-6">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
              <p>© DashKommo. Relatórios do sistema.</p>
              <p>Developed by soouzaDev</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
