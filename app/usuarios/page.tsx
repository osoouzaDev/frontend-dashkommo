"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  FileText,
  Home,
  Mail,
  Pencil,
  Search,
  Settings,
  Shield,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";

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

    setUsuarioLogado(usuarioStorage);
  }, [router]);

  async function carregarUsuarios() {
    try {
      setLoading(true);
      setErro("");
      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (error: unknown) {
      setErro(getErrorMessage(error, "Erro ao carregar usuários"));
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
    } catch (error: unknown) {
      setErro(getErrorMessage(error, "Erro ao salvar usuário"));
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
    } catch (error: unknown) {
      setErro(getErrorMessage(error, "Erro ao excluir usuário"));
    }
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
    <AppShell
      user={usuarioLogado}
      menuItems={menuItems}
      title="Usuários"
      subtitle="Gerencie acessos, perfis e estrutura do sistema"
      eyebrow="Central administrativa"
      heroTitle={`${saudacao()}, ${usuarioLogado.nome}`}
      heroDescription="Cadastre, edite e acompanhe os usuários do sistema em uma experiência mais organizada, elegante e preparada para uso real, com foco em administração e clareza operacional."
      footerLabel="© DashKommo. Gestão de usuários do sistema."
      onLogout={handleLogout}
      heroBadges={
        <>
          <Badge className="rounded-full px-4 py-2">
            {metricas.total} usuários
          </Badge>
          <Badge variant="outline" className="rounded-full px-4 py-2">
            {metricas.setores} setores
          </Badge>
        </>
      }
    >
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
        <StatCard
          title="Total de usuários"
          description="cadastros ativos"
          value={metricas.total}
          hint="Total registrado no backend"
          icon={Users}
          loading={loading}
        />
        <StatCard
          title="Administradores"
          description="acesso elevado"
          value={metricas.administradores}
          hint="Perfis com acesso administrativo"
          icon={Shield}
          loading={loading}
        />
        <StatCard
          title="Usuários comuns"
          description="operação diária"
          value={metricas.usuariosComuns}
          hint="Perfis sem privilégio administrativo"
          icon={User}
          tone="warning"
          loading={loading}
        />
        <StatCard
          title="Setores"
          description="distribuição interna"
          value={metricas.setores}
          hint="Áreas presentes na base"
          icon={UserCog}
          tone="success"
          loading={loading}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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

        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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
        <Card className="glass-card rounded-[1.9rem] border-0 shadow-sm">
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
    </AppShell>
  );
}
