"use client";

import { type ComponentProps, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Home,
  LogOut,
  Menu,
  Settings,
  Shield,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  Sparkles,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import confetti from "canvas-confetti";
import { getAccessToken, getStoredUser } from "@/services/authSession";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  buscarRelatorio,
  listarUsuarios,
  type RelatorioItem,
  type Usuario as UsuarioType,
  type UsuarioLogin,
} from "@/services/users";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
};

type KanbanColumn = {
  etapa: string;
  leads: RelatorioItem[];
  total: number;
};

const STATUS_GANHO = 142;

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

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogin | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioType[]>([]);
  const [relatorio, setRelatorio] = useState<RelatorioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [colunasAbertas, setColunasAbertas] = useState<Record<string, boolean>>(
    {}
  );
  const [prevGanhos, setPrevGanhos] = useState<number | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const usuarioStorage = getStoredUser();

    if (!token || !usuarioStorage) {
      router.push("/login");
      return;
    }

    setUsuario(usuarioStorage);
  }, [router]);

  useEffect(() => {
    async function carregarDados() {
      if (!usuario) return;

      try {
        setLoading(true);
        setErro("");

        if (usuario.acesso === "administrador") {
          const [usuariosData, relatorioData] = await Promise.all([
            listarUsuarios(),
            buscarRelatorio(),
          ]);

          setUsuarios(usuariosData);
          setRelatorio(relatorioData);
        }
      } catch (error: unknown) {
        setErro(getErrorMessage(error, "Erro ao carregar dashboard"));
      } finally {
        setLoading(false);
      }
    }

    carregarDados();

    const intervalId = setInterval(carregarDados, 30000); // Poll a cada 30 segundos
    return () => clearInterval(intervalId);
  }, [usuario]);

  useEffect(() => {
    if (!relatorio.length) return;

    const ganhosAtuais = relatorio.filter(
      (item) =>
        item.etapa?.toLowerCase() === "venda" ||
        item.etapa?.toLowerCase() === "ganho"
    ).length;

    if (prevGanhos !== null && ganhosAtuais > prevGanhos) {
      // Nova venda detectada!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#00FF00", "#FFFFFF"], // Cores festivas
      });

      // Som opcional (pode ser adicionado se desejar)
      // const audio = new Audio('/sounds/victory.mp3');
      // audio.play();
    }

    setPrevGanhos(ganhosAtuais);
  }, [relatorio, prevGanhos]);

  const metricas = useMemo(() => {
    const totalLeads = relatorio.length;
    const totalUsuarios = usuarios.length;

    const totalValor = relatorio
      .filter((item) => Number(item.status_id) === 142)
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const ganhos = relatorio.filter(
      (item) =>
        item.etapa?.toLowerCase() === "venda" ||
        item.etapa?.toLowerCase() === "ganho"
    ).length;

    const perdidos = relatorio.filter(
      (item) => item.etapa?.toLowerCase() === "perdido"
    ).length;

    const consultoresUnicos = new Set(
      relatorio.map((item) => item.consultor_nome).filter(Boolean)
    ).size;

    return {
      totalLeads,
      totalUsuarios,
      totalValor,
      ganhos,
      perdidos,
      consultoresUnicos,
    };
  }, [relatorio, usuarios]);

  const kanbanEtapas = useMemo(() => {
    const ordemEtapas = [
      "Lead novo",
      "Tenho que descobrir",
      "Qualificado - Em conversa",
      "Conversa",
      "Fazer Ligação",
      "Reunião",
      "Negociação",
      "Envio de Proposta",
      "Proposta",
      "Fechamento",
      "Movido para Cadência",
      "Funil Nutrição a Longo Prazo",
      "Gerar Forms",
      "Venda",
      "Ganho",
      "Perdido",
    ];

    const mapa = new Map<string, RelatorioItem[]>();

    for (const item of relatorio) {
      const etapa = item.etapa?.trim() || "Sem etapa";

      if (!mapa.has(etapa)) {
        mapa.set(etapa, []);
      }

      mapa.get(etapa)!.push(item);
    }

    const colunas: KanbanColumn[] = Array.from(mapa.entries()).map(
      ([etapa, leads]) => ({
        etapa,
        leads: [...leads].sort((a, b) => {
          const dataA = obterDataReferencia(a)?.getTime() ?? 0;
          const dataB = obterDataReferencia(b)?.getTime() ?? 0;
          return dataB - dataA;
        }),
        total: leads.reduce((acc, item) => acc + Number(item.valor || 0), 0),
      })
    );

    return colunas.sort((a, b) => {
      const indexA = ordemEtapas.indexOf(a.etapa);
      const indexB = ordemEtapas.indexOf(b.etapa);

      if (indexA === -1 && indexB === -1) {
        return b.leads.length - a.leads.length;
      }

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }, [relatorio]);

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

  async function handleLogout() {
    await performLogout();
    router.push("/login");
  }

  function formatarMoeda(valor: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }

  function getInitials(nome?: string) {
    if (!nome) return "US";

    return nome
      .split(" ")
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase())
      .join("");
  }

  function badgeEtapa(etapa?: string): ComponentProps<typeof Badge>["variant"] {
    const etapaNormalizada = etapa?.toLowerCase();

    if (etapaNormalizada === "venda" || etapaNormalizada === "ganho") {
      return "default";
    }

    if (etapaNormalizada === "perdido") {
      return "destructive";
    }

    return "secondary";
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

  function cardMetricLoading() {
    return (
      <div className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!usuario) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
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
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight">
                      DashKommo
                    </h1>
                    <p className="text-xs text-muted-foreground">
                      Painel inteligente
                    </p>
                  </div>
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
              const ativo = pathname === item.href;

              return (
                <Button
                  key={item.label}
                  variant={ativo ? "default" : "ghost"}
                  className={`h-11 w-full justify-start gap-3 rounded-xl ${
                    ativo ? "shadow-sm" : ""
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
                    Dashboard
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Visão geral da operação
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    usuario.acesso === "administrador" ? "default" : "secondary"
                  }
                  className="rounded-full px-3 py-1"
                >
                  {usuario.acesso === "administrador"
                    ? "Administrador"
                    : "Usuário"}
                </Badge>

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
                        Painel atualizado
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                        {saudacao()}, {usuario.nome}
                      </h1>
                      <p className="max-w-2xl text-sm text-muted-foreground">
                        Acompanhe usuários, leads, consultores e resultados do
                        funil em um só lugar, com uma visão clara e moderna da
                        operação.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="rounded-xl"
                        onClick={() => router.push("/relatorios")}
                      >
                        Ver relatórios
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() =>
                          router.push(
                            usuario.acesso === "administrador"
                              ? "/usuarios"
                              : "/configuracoes"
                          )
                        }
                      >
                        {usuario.acesso === "administrador"
                          ? "Gerenciar usuários"
                          : "Abrir configurações"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {usuario.acesso !== "administrador" ? (
              <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Bem-vindo ao seu painel</CardTitle>
                    <CardDescription>
                      Seu acesso está ativo e seu ambiente já está pronto para
                      uso.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      Você está autenticado com sucesso. Aqui você pode evoluir
                      o painel para exibir perfil, solicitações, reservas e
                      outras funcionalidades específicas do usuário.
                    </p>

                    <div className="grid gap-3 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => router.push("/dashboard")}
                        className="rounded-2xl border p-4 text-left transition hover:bg-muted/60"
                      >
                        <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                          <Home className="h-4 w-4" />
                          Meu painel
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Visualize seu ambiente principal.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push("/configuracoes")}
                        className="rounded-2xl border p-4 text-left transition hover:bg-muted/60"
                      >
                        <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                          <Settings className="h-4 w-4" />
                          Configurações
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Atualize suas preferências e dados.
                        </p>
                      </button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl shadow-sm">
                  <CardHeader>
                    <CardTitle>Seu perfil</CardTitle>
                    <CardDescription>Informações atuais</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 rounded-2xl border p-4">
                      <Avatar className="h-14 w-14">
                        <AvatarFallback>
                          {getInitials(usuario.nome)}
                        </AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="font-semibold">{usuario.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          Perfil: {usuario.acesso}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
                      Seu acesso atual é ideal para páginas operacionais e
                      pessoais. Recursos administrativos permanecem protegidos.
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <>
                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="rounded-3xl border-0 shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Usuários
                        </CardTitle>
                        <CardDescription>cadastrados</CardDescription>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <Users className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        cardMetricLoading()
                      ) : (
                        <>
                          <div className="text-3xl font-bold tracking-tight">
                            {metricas.totalUsuarios}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Quantidade total no sistema
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-0 shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Leads
                        </CardTitle>
                        <CardDescription>registrados</CardDescription>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        cardMetricLoading()
                      ) : (
                        <>
                          <div className="text-3xl font-bold tracking-tight">
                            {metricas.totalLeads}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Total no funil de vendas
                          </p>
                        </>
                      )}
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
                      {loading ? (
                        cardMetricLoading()
                      ) : (
                        <>
                          <div className="text-3xl font-bold tracking-tight">
                            {formatarMoeda(metricas.totalValor)}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Soma apenas dos ganhos
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-0 shadow-md">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                      <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Consultores
                        </CardTitle>
                        <CardDescription>ativos no funil</CardDescription>
                      </div>
                      <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                        <Shield className="h-4 w-4" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        cardMetricLoading()
                      ) : (
                        <>
                          <div className="text-3xl font-bold tracking-tight">
                            {metricas.consultoresUnicos}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Com leads vinculados
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </section>

                <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                  <Card className="rounded-3xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Kanban do funil</CardTitle>
                        <CardDescription>
                          Leads agrupados por etapa
                        </CardDescription>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => router.push("/leads")}
                      >
                        Ver todos
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardHeader>

                    <CardContent>
                      {loading ? (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <div
                              key={index}
                              className="min-w-[300px] rounded-2xl border p-4"
                            >
                              <div className="mb-4 h-5 w-40 animate-pulse rounded bg-muted" />
                              <div className="mb-3 h-4 w-24 animate-pulse rounded bg-muted" />
                              <div className="space-y-3">
                                <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                                <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                                <div className="h-20 animate-pulse rounded-2xl bg-muted" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : kanbanEtapas.length === 0 ? (
                        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                          Nenhum lead encontrado.
                        </div>
                      ) : (
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {kanbanEtapas.map((coluna) => {
                            const expandida = Boolean(
                              colunasAbertas[coluna.etapa]
                            );
                            const limiteInicial = 4;
                            const leadsVisiveis = expandida
                              ? coluna.leads
                              : coluna.leads.slice(0, limiteInicial);
                            const quantidadeOculta = Math.max(
                              0,
                              coluna.leads.length - limiteInicial
                            );

                            return (
                              <div
                                key={coluna.etapa}
                                className="min-w-[320px] max-w-[320px] rounded-3xl border bg-muted/20 p-4"
                              >
                                <div className="mb-4 border-b pb-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-sm font-bold uppercase tracking-wide">
                                        {coluna.etapa}
                                      </h3>
                                      <p className="mt-1 text-xs text-muted-foreground">
                                        {coluna.leads.length} lead
                                        {coluna.leads.length !== 1 ? "s" : ""}
                                      </p>
                                    </div>

                                    <Badge variant={badgeEtapa(coluna.etapa)} className="rounded-full">
                                      {coluna.leads.length}
                                    </Badge>
                                  </div>

                                  <p className="mt-3 text-sm font-semibold">
                                    {formatarMoeda(coluna.total)}
                                  </p>
                                </div>

                                <div className="space-y-3">
                                  {leadsVisiveis.map((lead) => (
                                    <div
                                      key={lead.lead_id}
                                      className="rounded-2xl border bg-background p-4 shadow-sm transition hover:border-primary/30"
                                    >
                                      <div className="mb-2 flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="truncate font-semibold">
                                            {lead.lead_nome}
                                          </p>
                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {lead.consultor_nome ||
                                              "Não definido"}
                                          </p>
                                        </div>

                                        <span className="shrink-0 text-xs text-muted-foreground">
                                          {obterDataReferencia(lead)?.toLocaleDateString("pt-BR") ??
                                            "--"}
                                        </span>
                                      </div>

                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground">
                                          Origem:{" "}
                                          {lead.origem || "Não informado"}
                                        </p>
                                        <p className="text-sm font-medium">
                                          {formatarMoeda(
                                            Number(lead.valor || 0)
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {coluna.leads.length > limiteInicial && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="mt-3 w-full rounded-2xl"
                                    onClick={() =>
                                      setColunasAbertas((prev) => ({
                                        ...prev,
                                        [coluna.etapa]: !prev[coluna.etapa],
                                      }))
                                    }
                                  >
                                    {expandida
                                      ? "Ver menos"
                                      : `Ver mais${
                                          quantidadeOculta > 0
                                            ? ` (${quantidadeOculta})`
                                            : ""
                                        }`}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card className="rounded-3xl shadow-sm">
                      <CardHeader>
                        <CardTitle>Resumo do funil</CardTitle>
                        <CardDescription>Visão rápida</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="rounded-2xl border p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              Ganhos
                            </div>
                            <span className="text-sm font-semibold">
                              {metricas.ganhos}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-muted">
                            <div
                              className="h-3 rounded-full bg-primary transition-all"
                              style={{
                                width: `${porcentagem(
                                  metricas.ganhos,
                                  metricas.totalLeads
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="rounded-2xl border p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <TrendingDown className="h-4 w-4 text-destructive" />
                              Perdidos
                            </div>
                            <span className="text-sm font-semibold">
                              {metricas.perdidos}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-muted">
                            <div
                              className="h-3 rounded-full bg-destructive transition-all"
                              style={{
                                width: `${porcentagem(
                                  metricas.perdidos,
                                  metricas.totalLeads
                                )}%`,
                              }}
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="rounded-2xl border bg-muted/30 p-4">
                          <p className="mb-1 text-sm font-medium">
                            Leitura do dashboard
                          </p>
                          <p className="text-xs text-muted-foreground">
                            As etapas exibidas aqui refletem o mapeamento de
                            status configurado no backend.
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-sm">
                      <CardHeader>
                        <CardTitle>Atalhos rápidos</CardTitle>
                        <CardDescription>Acesso direto</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3">
                        <button
                          type="button"
                          onClick={() => router.push("/usuarios")}
                          className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="h-4 w-4" />
                            <div>
                              <p className="font-medium">Usuários</p>
                              <p className="text-xs text-muted-foreground">
                                Gerenciar cadastros
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <button
                          type="button"
                          onClick={() => router.push("/leads")}
                          className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <Briefcase className="h-4 w-4" />
                            <div>
                              <p className="font-medium">Leads</p>
                              <p className="text-xs text-muted-foreground">
                                Explorar o funil
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>

                        <button
                          type="button"
                          onClick={() => router.push("/relatorios")}
                          className="flex items-center justify-between rounded-2xl border p-4 text-left transition hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3">
                            <BarChart3 className="h-4 w-4" />
                            <div>
                              <p className="font-medium">Relatórios</p>
                              <p className="text-xs text-muted-foreground">
                                Análises detalhadas
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
                  <Card className="rounded-3xl shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Usuários cadastrados</CardTitle>
                        <CardDescription>
                          Primeiros registros do sistema
                        </CardDescription>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => router.push("/usuarios")}
                      >
                        Abrir usuários
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {loading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-2xl border p-4"
                          >
                            <div className="space-y-2">
                              <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                              <div className="h-3 w-44 animate-pulse rounded bg-muted" />
                            </div>
                            <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                          </div>
                        ))
                      ) : (
                        usuarios.slice(0, 6).map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {item.nome}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {item.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Login: {item.userLogin}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <Badge
                                variant={
                                  item.acesso === "administrador"
                                    ? "default"
                                    : "secondary"
                                }
                                className="rounded-full"
                              >
                                {item.acesso}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {item.setor}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl shadow-sm">
                    <CardHeader>
                      <CardTitle>Resumo técnico</CardTitle>
                      <CardDescription>Baseado na API atual</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="rounded-2xl border p-4">
                        <p className="font-medium">Login</p>
                        <p className="mt-1 text-muted-foreground">
                          POST /login com autenticação via token JWT.
                        </p>
                      </div>

                      <div className="rounded-2xl border p-4">
                        <p className="font-medium">Usuários</p>
                        <p className="mt-1 text-muted-foreground">
                          CRUD disponível apenas para administradores.
                        </p>
                      </div>

                      <div className="rounded-2xl border p-4">
                        <p className="font-medium">Relatórios</p>
                        <p className="mt-1 text-muted-foreground">
                          Dados consumidos do endpoint /relatorio.
                        </p>
                      </div>

                      <div className="rounded-2xl border p-4">
                        <p className="font-medium">Funil</p>
                        <p className="mt-1 text-muted-foreground">
                          Etapas exibidas com base no mapeamento feito no
                          backend.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </section>
              </>
            )}
          </main>

          <footer className="border-t bg-background/80 px-4 py-4 backdrop-blur lg:px-6">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
              <p>© DashKommo. Dashboard do sistema.</p>
              <p>Developed by soouzaDev</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
