# Requisitos para Implementação do Relatório de Leads (Backend)

Este documento descreve as rotas e funcionalidades necessárias no backend para suportar a nova funcionalidade de geração de relatórios de leads por período implementada no frontend.

## 1. Rota de Geração de PDF (Download)

**Endpoint:** `GET /relatorios/leads/exportar` ou similar.
**Parâmetros (Query Strings):**
- `data_inicio`: Data inicial do período (formato YYYY-MM-DD).
- `data_fim`: Data final do período (formato YYYY-MM-DD).

**Comportamento esperado:**
- Validar as datas recebidas.
- Consultar o banco de dados/API da Kommo para buscar os leads criados ou atualizados no período.
- Gerar um arquivo PDF formatado com o resumo dos leads (Nome, Consultor, Valor, Etapa, Origem).
- Retornar o arquivo PDF como um `stream` ou `blob` com o header `Content-Type: application/pdf` para que o navegador inicie o download.

---

## 2. Rota de Envio de Relatório por Email

**Endpoint:** `POST /relatorios/leads/enviar-email`
**Corpo da Requisição (JSON):**
```json
{
  "data_inicio": "2024-01-01",
  "data_fim": "2024-01-31",
  "email_destino": "usuario@exemplo.com"
}
```

**Comportamento esperado:**
- Validar os dados.
- Gerar o mesmo PDF descrito na rota anterior.
- Enviar um e-mail para o `email_destino` contendo o arquivo PDF em anexo.
- O e-mail deve ter um assunto claro, como: "DashKommo - Resumo de Leads (01/01/2024 a 31/01/2024)".
- Retornar uma confirmação de sucesso (`200 OK`) ou erro.

---

## 3. Considerações de Segurança

- Ambas as rotas devem exigir o **Token de Autenticação (JWT)** no cabeçalho `Authorization`.
- Validar se o usuário que solicita o relatório tem permissões adequadas (ex: administrador ou acesso ao seu próprio relatório).

---

## Contexto do Frontend
As chamadas no frontend já estão preparadas visualmente no arquivo `app/configuracoes/page.tsx`. As funções `handleBaixarRelatorio` e `handleEnviarEmailRelatorio` estão atualmente simuladas com `setTimeout` e devem ser substituídas pelas chamadas reais a estes endpoints.
