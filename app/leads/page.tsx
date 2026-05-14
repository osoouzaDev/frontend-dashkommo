"use client";

import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Briefcase,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Filter,
  Home,
  Search,
  Settings,
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
import { Input } from "@/components/ui/input";
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

type FiltroEtapa = "todos" | "ganhos" | "perdidos" | "andamento";

const STATUS_GANHO = 142;
const STATUS_PERDIDO = 143;

function obterDataReferencia(lead: RelatorioItem) {
  const dataBase =
    Number(lead.status_id) === STATUS_GANHO
      ? lead.data_venda || lead.data_atualizacao || lead.data_criacao
      : lead.data_criacao;

  if (!dataBase) {
    return null;
  }

  const data = new Date(dataBase);
  return Number.isNaN(data.getTime()) ? null : data;
}

export default function LeadsPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioLogin | null>(null);
  const [leads, setLeads] = useState<RelatorioItem[]>([]);
  const [filtro, setFiltro] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState<FiltroEtapa>("todos");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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
    async function carregarLeads() {
      if (!usuario) return;

      try {
        setLoading(true);
        setErro("");
        const data = await buscarRelatorio();
        setLeads(data);
      } catch (error: unknown) {
        setErro(getErrorMessage(error, "Erro ao carregar leads"));
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
      const dataA = obterDataReferencia(a)?.getTime() ?? 0;
      const dataB = obterDataReferencia(b)?.getTime() ?? 0;
      return dataB - dataA;
    });
  }, [leadsFiltrados]);

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function badgeEtapa(lead: RelatorioItem): ComponentProps<typeof Badge>["variant"] {
    if (ehGanho(lead)) {
      return "default";
    }

    if (ehPerdido(lead)) {
      return "destructive";
    }

    return "secondary";
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

  function porcentagem(valor: number, total: number) {
    if (!total) return 0;
    return (valor / total) * 100;
  }

  if (!usuario) return null;

  return (
    <AppShell
      user={usuario}
      menuItems={menuItems}
      title="Leads"
      subtitle="Gestão visual e estratégica do funil"
      eyebrow="Funil inteligente"
      heroTitle={`${saudacao()}, ${usuario.nome}`}
      heroDescription="Acompanhe os leads do sistema com muito mais clareza, aplique filtros rápidos e visualize o andamento do funil em uma central muito mais sofisticada e profissional."
      footerLabel="© DashKommo. Gestão de leads do sistema."
      onLogout={handleLogout}
      heroBadges={
        <>
          <Badge className="rounded-full px-4 py-2">
            {loading ? "..." : `${metricas.total} leads`}
          </Badge>
          <Badge variant="outline" className="rounded-full px-4 py-2">
            {loading ? "..." : `${metricas.consultores} consultores`}
          </Badge>
        </>
      }
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de leads"
          description="visão geral"
          value={metricas.total}
          hint="Registros processados pelo backend"
          icon={Briefcase}
          loading={loading}
        />
        <StatCard
          title="Ganhos"
          description="conversão positiva"
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
        <StatCard
          title="Valor ganho"
          description="resultado acumulado"
          value={formatarMoeda(metricas.valorGanho)}
          hint="Soma financeira apenas dos ganhos"
          icon={CircleDollarSign}
          tone="success"
          loading={loading}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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

        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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
        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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
                              <Badge variant={badgeEtapa(lead)} className="rounded-full">
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
                              {ehGanho(lead) ? "Venda: " : "Criação: "}
                              {obterDataReferencia(lead)?.toLocaleString("pt-BR") ?? "-"}
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
    </AppShell>
  );
}
