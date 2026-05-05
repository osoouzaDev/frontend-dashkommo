import { authFetch } from "./authFetch";

export type TipoAcesso = "administrador" | "usuario";

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  acesso: TipoAcesso;
  setor: string;
  userLogin: string;
}

export interface UsuarioLogin {
  id: number;
  nome: string;
  email?: string;
  acesso: TipoAcesso;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  usuario: UsuarioLogin;
}

export interface LoginPayload {
  userLogin: string;
  senha: string;
}

export interface CreateUserPayload {
  nome: string;
  email: string;
  acesso: TipoAcesso;
  setor: string;
  userLogin: string;
  senha: string;
}

export interface UpdateUserPayload {
  nome: string;
  email: string;
  acesso: TipoAcesso;
  setor: string;
  userLogin: string;
  senha?: string;
}

export interface RelatorioItem {
  lead_id: number;
  lead_nome: string;
  consultor_id: number | null;
  consultor_nome: string | null;
  origem: string;
  pipeline_id: number | null;
  status_id: number | null;
  etapa: string;
  valor: number;
  data_criacao: string | null;
  data_atualizacao: string | null;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return await authFetch("/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export async function listarUsuarios(): Promise<Usuario[]> {
  return await authFetch("/usuarios");
}

export async function buscarUsuario(id: string | number): Promise<Usuario> {
  return await authFetch(`/usuarios/${id}`);
}

export async function criarUsuario(payload: CreateUserPayload) {
  return await authFetch("/usuarios", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function atualizarUsuario(
  id: string | number,
  payload: UpdateUserPayload
) {
  return await authFetch(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function excluirUsuario(id: string | number) {
  return await authFetch(`/usuarios/${id}`, {
    method: "DELETE",
  });
}

export async function buscarRelatorio(): Promise<RelatorioItem[]> {
  return await authFetch("/relatorio");
}

export async function logout(refreshToken?: string) {
  return await authFetch("/logout", {
    method: "POST",
    body: JSON.stringify(
      refreshToken
        ? {
            refreshToken,
          }
        : {}
    ),
  });
}
