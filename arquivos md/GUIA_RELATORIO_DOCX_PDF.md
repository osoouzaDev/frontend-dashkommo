# Guia: Geração de Relatórios Dinâmicos (.docx para PDF)

Este guia explica como implementar no backend a funcionalidade de preencher um modelo `.docx` com variáveis dinâmicas e convertê-lo automaticamente para PDF.

## 1. Bibliotecas Necessárias (Node.js)

Para realizar o preenchimento e a conversão, o backend precisará destas bibliotecas:

```bash
npm install docxtemplater pizzip libreoffice-convert
```

- **pizzip**: Para ler o arquivo .docx (que é um zip).
- **docxtemplater**: Para substituir as variáveis `{{ exemplo }}`.
- **libreoffice-convert**: Para transformar o .docx final em PDF (requer LibreOffice instalado no servidor).

---

## 2. Variáveis Disponíveis para o Template

Ao criar seu arquivo `modelo.docx` no Word, você pode usar estas tags:

### Cabeçalho e Período
- `{{ data_inicio }}`: Data inicial formatada (Ex: 01/01/2024).
- `{{ data_fim }}`: Data final formatada.
- `{{ data_geracao }}`: Data em que o relatório foi gerado.

### Métricas de Leads
- `{{ total_leads }}`: Quantidade total de leads no período.
- `{{ leads_ganhos }}`: Quantidade de leads com status 'Ganho'.
- `{{ leads_perdidos }}`: Quantidade de leads com status 'Perdido'.
- `{{ leads_em_aberto }}`: Leads que ainda estão no funil.
- `{{ taxa_conversao }}`: Porcentagem de ganhos em relação ao total.

### Financeiro
- `{{ valor_total_ganho }}`: Soma dos valores dos leads ganhos (Formatado em R$).

### Tabelas (Loop)
Você pode criar uma tabela no Word e usar estas tags para listar os leads:
- `{#leads}` (Início do loop)
  - `{{ nome }}`: Nome do lead.
  - `{{ consultor }}`: Nome do consultor responsável.
  - `{{ valor }}`: Valor do lead.
  - `{{ etapa }}`: Etapa atual.
- `{{/leads}}` (Fim do loop)

---

## 3. Exemplo de Implementação no Backend

```javascript
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";
import libre from "libreoffice-convert";
import { promisify } from "util";

const convertAsync = promisify(libre.convert);

async function gerarRelatorioPdf(dados) {
    // 1. Carregar o arquivo .docx original
    const content = fs.readFileSync(
        path.resolve(__dirname, "templates", "modelo_relatorio.docx"),
        "binary"
    );

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
    });

    // 2. Preencher com os dados dinâmicos
    doc.render({
        data_inicio: dados.inicio,
        data_fim: dados.fim,
        total_leads: dados.total,
        leads_ganhos: dados.ganhos,
        valor_total_ganho: dados.valorTotal,
        leads: dados.listaLeads // Array de objetos [{nome, valor, ...}]
    });

    // 3. Gerar o buffer do .docx preenchido
    const docxBuffer = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
    });

    // 4. Converter para PDF usando LibreOffice
    const pdfBuffer = await convertAsync(docxBuffer, ".pdf", undefined);

    return pdfBuffer;
}
```

---

## 4. Como criar o modelo
1. Abra o Microsoft Word.
2. Escreva o texto fixo e, onde quiser os dados, coloque as tags (Ex: "No período de {{data_inicio}} a {{data_fim}}...").
3. Salve como `modelo_relatorio.docx` e coloque na pasta de templates do backend.
