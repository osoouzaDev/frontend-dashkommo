"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  FileText,
  Home,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  User,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import {
  criarUsuario,
  excluirUsuario,
  listarUsuarios,
  atualizarUsuario,
  type Usuario,
  type CreateUserPayload,
  type UpdateUserPayload,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

const initialForm = {
  nome: "",
  email: "",
  acesso: "usuario" as "administrador" | "usuario",
  setor: "",
  userLogin: "",
  senha: "",
};

const menuItems = [
  { icon: Home, label: "Início", href: "/dashboard" },
  { icon: Users, label: "Usuários", href: "/usuarios" },
  { icon: FileText, label: "Leads", href: "/leads" },
  { icon: BarChart3, label: "Relatórios", href: "/relatorios" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
];

export default function UsuariosPage() {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogin | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [filtro, setFiltro] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editandoId, setEditandoId] = useState<number | null>(null);

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

      setUsuarioLogado(usuarioParse);
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("usuario");
      router.push("/login");
    }
  }, [router]);

  async function carregarUsuarios() {
    try {
      setLoading(true);
      setErro("");
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (error: any) {
      setErro(error.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (usuarioLogado) {
      carregarUsuarios();
    }
  }, [usuarioLogado]);

  function limparMensagens() {
    setErro("");
    setSucesso("");
  }

  function resetForm() {
    setForm(initialForm);
    setEditandoId(null);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function iniciarEdicao(usuario: Usuario) {
    limparMensagens();
    setEditandoId(usuario.id);
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      acesso: usuario.acesso,
      setor: usuario.setor,
      userLogin: usuario.userLogin,
      senha: "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    limparMensagens();

    try {
      setSaving(true);

      if (editandoId) {
        const payload: UpdateUserPayload = {
          nome: form.nome,
          email: form.email,
          acesso: form.acesso,
          setor: form.setor,
          userLogin: form.userLogin,
          ...(form.senha ? { senha: form.senha } : {}),
        };

        await atualizarUsuario(editandoId, payload);
        setSucesso("Usuário atualizado com sucesso.");
      } else {
        const payload: CreateUserPayload = {
          nome: form.nome,
          email: form.email,
          acesso: form.acesso,
          setor: form.setor,
          userLogin: form.userLogin,
          senha: form.senha,
        };

        await criarUsuario(payload);
        setSucesso("Usuário cadastrado com sucesso.");
      }

      resetForm();
      await carregarUsuarios();
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(id: number) {
    limparMensagens();

    const confirmar = window.confirm("Deseja realmente excluir este usuário?");
    if (!confirmar) return;

    try {
      await excluirUsuario(id);
      setSucesso("Usuário excluído com sucesso.");
      await carregarUsuarios();
    } catch (error: any) {
      setErro(error.message || "Erro ao excluir usuário");
    }
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

  const usuariosFiltrados = useMemo(() => {
    const termo = filtro.toLowerCase().trim();

    return usuarios.filter((usuario) => {
      if (!termo) return true;

      return (
        usuario.nome?.toLowerCase().includes(termo) ||
        usuario.email?.toLowerCase().includes(termo) ||
        usuario.userLogin?.toLowerCase().includes(termo) ||
        usuario.setor?.toLowerCase().includes(termo) ||
        usuario.acesso?.toLowerCase().includes(termo)
      );
    });
  }, [usuarios, filtro]);

  const metricas = useMemo(() => {
    const total = usuarios.length;
    const administradores = usuarios.filter(
      (usuario) => usuario.acesso === "administrador"
    ).length;
    const usuariosComuns = usuarios.filter(
      (usuario) => usuario.acesso === "usuario"
    ).length;
    const setores = new Set(usuarios.map((usuario) => usuario.setor).filter(Boolean))
      .size;

    return {
      total,
      administradores,
      usuariosComuns,
      setores,
    };
  }, [usuarios]);

  if (!usuarioLogado) return null;

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
                    Gestão de usuários
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
                    <AvatarFallback>
                      {getInitials(usuarioLogado.nome)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {usuarioLogado.nome}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Perfil: {usuarioLogado.acesso}
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
                  <h2 className="text-lg font-semibold tracking-tight">
                    Usuários
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Gerencie acessos, perfis e estrutura do sistema
                  </p>
                </div>
              </div>

              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(usuarioLogado.nome)}</AvatarFallback>
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
                        Central administrativa
                      </div>
                      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
                        {saudacao()}, {usuarioLogado.nome}
                      </h1>
                      <p className="max-w-2xl text-sm text-muted-foreground">
                        Cadastre, edite e acompanhe os usuários do sistema em uma
                        interface mais organizada, elegante e preparada para uso
                        real.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Badge className="rounded-full px-4 py-2">
                        {metricas.total} usuários
                      </Badge>
                      <Badge variant="outline" className="rounded-full px-4 py-2">
                        {metricas.setores} setores
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {erro ? (
              <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive shadow-sm">
                {erro}
              </div>
            ) : null}

            {sucesso ? (
              <div className="mb-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700 shadow-sm">
                {sucesso}
              </div>
            ) : null}

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total de usuários
                    </CardTitle>
                    <CardDescription>cadastros ativos</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.total}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Total registrado no backend
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Administradores
                    </CardTitle>
                    <CardDescription>acesso elevado</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <Shield className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.administradores}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Perfis com acesso administrativo
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Usuários comuns
                    </CardTitle>
                    <CardDescription>operação diária</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.usuariosComuns}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Perfis sem privilégio administrativo
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Setores
                    </CardTitle>
                    <CardDescription>distribuição interna</CardDescription>
                  </div>
                  <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                    <UserCog className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {loading ? "..." : metricas.setores}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Áreas presentes na base
                  </p>
                </CardContent>
              </Card>
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>
                    {editandoId ? "Editar usuário" : "Novo usuário"}
                  </CardTitle>
                  <CardDescription>
                    {editandoId
                      ? "Atualize os dados do usuário selecionado."
                      : "Cadastre um novo usuário no sistema."}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        className="h-11 rounded-xl"
                        placeholder="Digite o nome do usuário"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="h-11 rounded-xl pl-10"
                          placeholder="Digite o e-mail"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="setor">Setor</Label>
                      <Input
                        id="setor"
                        name="setor"
                        value={form.setor}
                        onChange={handleChange}
                        className="h-11 rounded-xl"
                        placeholder="Informe o setor"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="userLogin">Login</Label>
                      <Input
                        id="userLogin"
                        name="userLogin"
                        value={form.userLogin}
                        onChange={handleChange}
                        className="h-11 rounded-xl"
                        placeholder="Defina o login"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="acesso">Acesso</Label>
                      <select
                        id="acesso"
                        name="acesso"
                        value={form.acesso}
                        onChange={handleChange}
                        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="usuario">Usuário</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="senha">
                        {editandoId ? "Nova senha (opcional)" : "Senha"}
                      </Label>
                      <Input
                        id="senha"
                        name="senha"
                        type="password"
                        value={form.senha}
                        onChange={handleChange}
                        className="h-11 rounded-xl"
                        placeholder={
                          editandoId
                            ? "Informe apenas se quiser alterar"
                            : "Digite a senha"
                        }
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="submit"
                        className="flex-1 rounded-xl"
                        disabled={saving}
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        {saving
                          ? "Salvando..."
                          : editandoId
                          ? "Atualizar"
                          : "Cadastrar"}
                      </Button>

                      {editandoId ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={resetForm}
                        >
                          Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-3xl shadow-sm">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Lista de usuários</CardTitle>
                    <CardDescription>
                      Base atual cadastrada no backend
                    </CardDescription>
                  </div>

                  <div className="relative w-full md:max-w-xs">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      placeholder="Buscar usuário..."
                      className="h-11 rounded-xl pl-10"
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="flex flex-col gap-3 rounded-2xl border p-4"
                      >
                        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-52 animate-pulse rounded bg-muted" />
                        <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                      </div>
                    ))
                  ) : usuariosFiltrados.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado.
                    </div>
                  ) : (
                    usuariosFiltrados.map((usuario) => (
                      <div
                        key={usuario.id}
                        className="rounded-2xl border p-4 shadow-sm transition hover:bg-muted/30"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-11 w-11">
                              <AvatarFallback>
                                {getInitials(usuario.nome)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold tracking-tight">
                                  {usuario.nome}
                                </p>

                                <Badge
                                  variant={
                                    usuario.acesso === "administrador"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="rounded-full"
                                >
                                  {usuario.acesso}
                                </Badge>
                              </div>

                              <p className="text-sm text-muted-foreground">
                                {usuario.email}
                              </p>

                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                <span>Login: {usuario.userLogin}</span>
                                <span>Setor: {usuario.setor}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => iniciarEdicao(usuario)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="destructive"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => handleExcluir(usuario.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="mt-6">
              <Card className="rounded-3xl shadow-sm">
                <CardHeader>
                  <CardTitle>Resumo da administração</CardTitle>
                  <CardDescription>
                    Visão rápida da estrutura de acesso atual
                  </CardDescription>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border p-4">
                    <p className="text-sm font-medium">Controle de acesso</p>
                    <p className="mt-2 text-2xl font-bold">
                      {metricas.administradores}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Administradores com privilégios elevados.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-sm font-medium">Base operacional</p>
                    <p className="mt-2 text-2xl font-bold">
                      {metricas.usuariosComuns}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Usuários com acesso comum ao sistema.
                    </p>
                  </div>

                  <div className="rounded-2xl border p-4">
                    <p className="text-sm font-medium">Cobertura interna</p>
                    <p className="mt-2 text-2xl font-bold">{metricas.setores}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Setores distintos representados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </main>

          <footer className="border-t bg-background/80 px-4 py-4 backdrop-blur lg:px-6">
            <div className="flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground md:flex-row">
              <p>© DashKommo. Gestão de usuários do sistema.</p>
              <p>Developed by soouzaDev</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}