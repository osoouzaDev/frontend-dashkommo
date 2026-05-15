"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarRange,
  ChevronRight,
  FileText,
  Home,
  Settings,
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
import {
  clearSession,
  getAccessToken,
  getStoredUser,
} from "@/services/authSession";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";

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

function obterDataReferencia(item: RelatorioItem) {
  const dataBase =
    Number(item.status_id) === STATUS_GANHO
      ? item.data_venda || item.data_criacao || item.data_atualizacao
      : item.data_criacao;

  if (!dataBase) {
    return null;
  }

  const data = new Date(dataBase);
  return Number.isNaN(data.getTime()) ? null : data;
}

export default function RelatoriosPage() {
  const router = useRouter();
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
        const data = obterDataReferencia(item);
        return data ? data.getFullYear() : null;
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
      const data = obterDataReferencia(item);
      if (!data) {
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

  function saudacao() {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }

  if (!usuario) return null;

  return (
    <AppShell
      user={usuario}
      menuItems={menuItems}
      title="Relatórios"
      subtitle="Métricas consolidadas e visão estratégica do funil"
      eyebrow="Painel analítico premium"
      heroTitle={`${saudacao()}, ${usuario.nome}`}
      heroDescription="Analise a performance do período com muito mais clareza, identifique padrões por origem, acompanhe a distribuição por consultor e enxergue os resultados com um acabamento visual muito mais executivo."
      footerLabel="© DashKommo. Relatórios do sistema."
      onLogout={handleLogout}
      headerExtras={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="h-11 rounded-2xl border border-input bg-background/80 px-4 py-2 text-sm"
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
            className="h-11 rounded-2xl border border-input bg-background/80 px-4 py-2 text-sm"
          >
            {meses.map((mes) => (
              <option key={mes.value} value={mes.value}>
                {mes.label}
              </option>
            ))}
          </select>
        </div>
      }
      heroBadges={
        <>
          <Badge className="rounded-full px-4 py-2">{mesAtualLabel}</Badge>
          <Badge variant="outline" className="rounded-full px-4 py-2">
            {anoSelecionado}
          </Badge>
        </>
      }
    >
      {erro ? (
        <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-sm">
          {erro}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de leads"
          description="no período"
          value={metricas.totalLeads}
          hint="Registros considerados no filtro"
          icon={FileText}
          loading={loading}
        />
        <StatCard
          title="Valor total"
          description="leads ganhos"
          value={formatarMoeda(metricas.valorTotal)}
          hint="Soma apenas dos ganhos"
          icon={Wallet}
          tone="success"
          loading={loading}
        />
        <StatCard
          title="Ganhos"
          description="conversões positivas"
          value={metricas.ganhos}
          hint="Leads com status de ganho"
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          title="Perdidos"
          description="oportunidades encerradas"
          value={metricas.perdidos}
          hint="Leads com status de perdido"
          icon={TrendingDown}
          tone="danger"
          loading={loading}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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

        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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
        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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

        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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
        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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
    </AppShell>
  );
}
