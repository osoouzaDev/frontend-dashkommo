# Frontend DashKommo

Frontend em Next.js para autenticação, dashboard, usuários, leads e relatórios.

## Requisitos

- Node.js 20+
- Backend DashKommo ativo

## Configuração de ambiente

1. Copie `.env.example` para `.env.local`.
2. Ajuste a URL da API:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Produção

- `NEXT_PUBLIC_API_URL` deve usar HTTPS.
- Exemplo:

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

## Executar localmente

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Segurança aplicada no frontend

- Headers de segurança (`CSP`, `X-Frame-Options`, `nosniff`, `Permissions-Policy`).
- Sessão centralizada (`token`, `refreshToken`, `usuario`).
- Refresh automático de access token em `401/403` via `/auth/refresh`.
- Logout com tentativa de revogação no backend e limpeza local garantida.

## Observações importantes

- O frontend já está preparado para enviar credenciais (`credentials: include`), facilitando migração para cookies `HttpOnly` no backend.
- O nível máximo de segurança depende de mudança no backend para autenticação por cookie seguro.
