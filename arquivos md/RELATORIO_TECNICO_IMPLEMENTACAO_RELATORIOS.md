# Relatório Técnico: Implementação de Relatórios de Leads

Este documento detalha as funcionalidades de backend desenvolvidas para a geração e envio de relatórios de leads, atendendo aos requisitos especificados.

## 1. Requisitos Atendidos
- [x] Geração de relatório em formato PDF com dados de leads.
- [x] Endpoint para exportação (download direto) de PDF por período.
- [x] Endpoint para envio de relatório por e-mail com anexo PDF.
- [x] Validação de parâmetros de data (data_inicio, data_fim).
- [x] Proteção de rotas com autenticação JWT e autorização de administrador.
- [x] Integração com banco de dados MySQL para consulta por período.

## 2. Arquitetura da Solução
A implementação seguiu uma arquitetura baseada em serviços para separação de responsabilidades:
- **Camada de Dados (`BancoMysql`)**: Novos métodos para consulta filtrada por data.
- **Camada de Serviços (`PdfService`, `EmailService`)**: Lógicas isoladas para geração de documentos e comunicação SMTP.
- **Camada de Rotas (`Express`)**: Endpoints que coordenam a chamada aos serviços e gerenciam as respostas HTTP.

## 3. Endpoints Criados

### 3.1. Exportar Relatório (PDF)
- **Método:** `GET`
- **URL:** `/relatorios/leads/exportar`
- **Query Params:**
  - `data_inicio` (string, YYYY-MM-DD)
  - `data_fim` (string, YYYY-MM-DD)
- **Cabeçalhos:** `Authorization: Bearer <token>`
- **Resposta Sucesso:** Stream de arquivo binário (`application/pdf`).
- **Resposta Erro:** `400 Bad Request` (datas ausentes) ou `500 Internal Server Error`.

### 3.2. Enviar Relatório por E-mail
- **Método:** `POST`
- **URL:** `/relatorios/leads/enviar-email`
- **Body (JSON):**
  ```json
  {
    "data_inicio": "2024-01-01",
    "data_fim": "2024-01-31",
    "email_destino": "usuario@exemplo.com"
  }
  ```
- **Cabeçalhos:** `Authorization: Bearer <token>`
- **Resposta Sucesso:** `200 OK` com mensagem de confirmação.
- **Resposta Erro:** `400 Bad Request` (campos ausentes) ou `500 Internal Server Error`.

## 4. Estrutura do Banco de Dados
- **Tabela Utilizada:** `funil_vendas`
- **Campos Consultados:** `lead_id`, `lead_nome`, `consultor_nome`, `origem`, `valor`, `etapa`, `data_criacao`.
- **Lógica de Filtro:** `data_criacao BETWEEN 'YYYY-MM-DD 00:00:00' AND 'YYYY-MM-DD 23:59:59'`.

## 5. Lógicas de Negócio e Tratamento de Erros
- **PDF**: Gerado utilizando `jspdf` e `jspdf-autotable`. A tabela inclui formatação monetária (BRL) para o campo valor.
- **E-mail**: Utiliza `nodemailer`. Requer configuração de variáveis de ambiente SMTP.
- **Segurança**: 
  - Ambos os endpoints verificam o token JWT via `autenticarToken`.
  - Acesso restrito a administradores via `autorizarAdmin`.
- **Tratamento de Erros**: Blocos `try/catch` capturam falhas na geração do PDF, envio de e-mail ou consulta ao banco, retornando mensagens de erro apropriadas.

## 6. Variáveis de Ambiente Necessárias (SMTP)
Para o funcionamento do envio de e-mail, as seguintes variáveis devem estar no `.env`:
- `SMTP_HOST`: Servidor de e-mail (ex: smtp.gmail.com)
- `SMTP_PORT`: Porta (ex: 587)
- `SMTP_USER`: E-mail remetente
- `SMTP_PASS`: Senha ou App Password
- `SMTP_SECURE`: `true` para porta 465, `false` para outras.

## 7. Integração com Frontend
O frontend deve realizar chamadas para os endpoints acima enviando o token JWT no header. O endpoint de exportação deve ser tratado como um download de blob/stream.
