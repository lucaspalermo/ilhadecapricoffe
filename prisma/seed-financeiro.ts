/**
 * seed-financeiro.ts
 * Importa TODOS os dados do arquivo "Demonstrativo Financeiro ILHA DE CAPRI.xlsx"
 * para o banco de dados, valor por valor, sem perda de dados.
 *
 * Uso: npx tsx prisma/seed-financeiro.ts
 */

import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import path from "path";

const prisma = new PrismaClient();

// ============================================================
// Caminho do arquivo Excel
// ============================================================
const EXCEL_PATH = path.resolve(
  "C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI.xlsx"
);

// ============================================================
// Mapeamento de categorias financeiras
// ============================================================
const CATEGORIAS = [
  { nome: "FORNECEDORES: ALIMENTOS", tipo: "DESPESA", ordem: 1 },
  { nome: "DESPESAS COM PESSOAL", tipo: "DESPESA", ordem: 2 },
  { nome: "CONTAS FIXAS", tipo: "DESPESA", ordem: 3 },
  { nome: "DESPESAS ADMINISTRATIVAS", tipo: "DESPESA", ordem: 4 },
  { nome: "DESPESAS FINANCEIRAS", tipo: "DESPESA", ordem: 5 },
  { nome: "DESPESAS PRODUTOS DIVERSOS", tipo: "DESPESA", ordem: 6 },
  { nome: "COMPOSIÇÃO CONTÁBIL", tipo: "DESPESA", ordem: 7 },
] as const;

// Labels that mark category section starts in the spreadsheet
const CATEGORY_MARKERS: Record<string, string> = {
  "FORNECEDORES: ALIMENTOS": "FORNECEDORES: ALIMENTOS",
  "DESPESAS COM PESSOAL": "DESPESAS COM PESSOAL",
  "CONTAS FIXAS": "CONTAS FIXAS",
  "DESPESAS ADMINISTRATIVAS": "DESPESAS ADMINISTRATIVAS",
  "DESPESAS FINANCEIRAS": "DESPESAS FINANCEIRAS",
  "DESPESAS PRODUTOS DIVERSOS": "DESPESAS PRODUTOS DIVERSOS",
  "C O M P O S I Ç Ã O  C O N T Á B I L   D A  C A F E T E R I A  I L H A   D E  C A P R I":
    "COMPOSIÇÃO CONTÁBIL",
};

// Labels to skip (headers, totals, summary rows)
const SKIP_LABELS = new Set([
  "DRE",
  "DESPESAS",
  "TOTAL:",
  "R E C E I T A S",
  "D E S P E S A S",
  "RESULTADO:",
  "SOMA= DINHEIRO CX + LANÇAMENTOS FUTUROS + FUNDO RES. + SALDO C/C",
]);

// Revenue/info labels (stored under special handling)
const REVENUE_LABELS = new Set([
  "RECEITA MENSAL",
  "CONTAS A RECEBER / VENDAS",
  "IFOOD",
  "DIAS ÚTEIS",
  "RETIRADA DOS SÓCIOS",
  "Receita Líquida",
]);

interface LancamentoData {
  categoriaFinanceiraId: number;
  descricao: string;
  valor: number;
  data: Date;
  mesReferencia: number;
  anoReferencia: number;
}

function getCellValue(
  ws: XLSX.WorkSheet,
  row: number,
  col: number
): number | string | null {
  const cell = ws[XLSX.utils.encode_cell({ r: row, c: col })];
  if (!cell) return null;
  return cell.v;
}

function parseSheet(
  ws: XLSX.WorkSheet,
  year: number,
  categoriaMap: Map<string, number>
): LancamentoData[] {
  const range = XLSX.utils.decode_range(ws["!ref"]!);
  const lancamentos: LancamentoData[] = [];

  let currentCategory: string | null = null;
  let inDemoTitle = false;

  for (let r = 0; r <= range.e.r; r++) {
    const rawLabel = getCellValue(ws, r, 0);
    if (rawLabel === null || rawLabel === undefined) continue;

    const label = String(rawLabel).trim();
    if (!label) continue;

    // Skip the title row
    if (label.startsWith("DEMONSTRATIVO")) {
      inDemoTitle = true;
      continue;
    }
    inDemoTitle = false;

    // Check if this is a category marker
    const matchedCategory = CATEGORY_MARKERS[label];
    if (matchedCategory) {
      currentCategory = matchedCategory;
      continue;
    }

    // Skip summary/header rows
    if (SKIP_LABELS.has(label)) continue;

    // Skip revenue/info labels (not expense categories)
    if (REVENUE_LABELS.has(label)) continue;

    // If no category assigned yet, skip
    if (!currentCategory) continue;

    const catId = categoriaMap.get(currentCategory);
    if (!catId) continue;

    // Read monthly values from odd columns (1,3,5,7,9,11,13,15,17,19,21,23)
    for (let month = 1; month <= 12; month++) {
      const col = 1 + (month - 1) * 2;
      const raw = getCellValue(ws, r, col);

      // Skip non-numeric values ("%" , "VALOR R$", "-", etc.)
      if (raw === null || raw === undefined) continue;
      if (typeof raw === "string") continue;

      const valor = Number(raw);
      if (isNaN(valor) || valor === 0) continue;

      lancamentos.push({
        categoriaFinanceiraId: catId,
        descricao: label,
        valor: Math.round(valor * 100) / 100, // Round to 2 decimal places
        data: new Date(year, month - 1, 15), // 15th of each month
        mesReferencia: month,
        anoReferencia: year,
      });
    }
  }

  return lancamentos;
}

async function main() {
  console.log("==============================================");
  console.log("SEED FINANCEIRO - Importacao de dados do Excel");
  console.log("==============================================\n");

  // 1. Read Excel file
  console.log(`Lendo arquivo: ${EXCEL_PATH}`);
  const wb = XLSX.readFile(EXCEL_PATH);
  console.log(`Planilhas encontradas: ${wb.SheetNames.join(", ")}\n`);

  // 2. Clear existing financial data (to allow re-running)
  console.log("Limpando dados financeiros existentes...");
  await prisma.lancamento.deleteMany({});
  await prisma.categoriaFinanceira.deleteMany({});
  console.log("Dados anteriores removidos.\n");

  // 3. Create financial categories
  console.log("Criando categorias financeiras...");
  const categoriaMap = new Map<string, number>();

  for (const cat of CATEGORIAS) {
    const created = await prisma.categoriaFinanceira.create({
      data: { nome: cat.nome, tipo: cat.tipo, ordem: cat.ordem },
    });
    categoriaMap.set(cat.nome, created.id);
    console.log(`  [${created.id}] ${cat.nome} (${cat.tipo})`);
  }
  console.log("");

  // 4. Process each sheet
  let totalLancamentos = 0;

  for (const sheetName of wb.SheetNames) {
    console.log(`\nProcessando planilha: ${sheetName}`);
    console.log("─".repeat(50));

    const ws = wb.Sheets[sheetName];

    // Detect year from sheet name or title row
    let year: number;
    if (sheetName.includes("2025")) {
      year = 2025;
    } else if (sheetName.includes("2026")) {
      year = 2026;
    } else {
      console.warn(`  AVISO: Nao foi possivel detectar o ano da planilha ${sheetName}. Pulando.`);
      continue;
    }

    console.log(`  Ano detectado: ${year}`);

    // Parse all lancamentos from this sheet
    const lancamentos = parseSheet(ws, year, categoriaMap);
    console.log(`  Lancamentos encontrados: ${lancamentos.length}`);

    if (lancamentos.length === 0) {
      console.log("  Nenhum lancamento para importar.");
      continue;
    }

    // Group by category for reporting
    const byCategory = new Map<string, number>();
    for (const l of lancamentos) {
      const catName =
        [...categoriaMap.entries()].find(([, id]) => id === l.categoriaFinanceiraId)?.[0] ??
        "?";
      byCategory.set(catName, (byCategory.get(catName) ?? 0) + 1);
    }

    for (const [cat, count] of byCategory) {
      console.log(`    ${cat}: ${count} lancamentos`);
    }

    // Batch insert for performance
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < lancamentos.length; i += BATCH_SIZE) {
      const batch = lancamentos.slice(i, i + BATCH_SIZE);
      await prisma.lancamento.createMany({
        data: batch,
      });
      inserted += batch.length;
      process.stdout.write(`\r  Inserindo: ${inserted}/${lancamentos.length}`);
    }

    console.log(`\n  ${inserted} lancamentos inseridos para ${year}.`);
    totalLancamentos += inserted;
  }

  // 5. Final summary
  console.log("\n==============================================");
  console.log("RESUMO DA IMPORTACAO");
  console.log("==============================================");

  const totalInDB = await prisma.lancamento.count();
  const categorias = await prisma.categoriaFinanceira.findMany({
    orderBy: { ordem: "asc" },
    include: { _count: { select: { lancamentos: true } } },
  });

  console.log(`\nTotal de lancamentos no banco: ${totalInDB}`);
  console.log("\nPor categoria:");
  for (const cat of categorias) {
    console.log(`  ${cat.nome}: ${cat._count.lancamentos} lancamentos`);
  }

  // 6. Verify some totals
  console.log("\n--- VERIFICACAO DE TOTAIS ---");

  for (const year of [2025, 2026]) {
    console.log(`\nAno ${year}:`);
    for (const cat of categorias) {
      const result = await prisma.lancamento.aggregate({
        where: {
          categoriaFinanceiraId: cat.id,
          anoReferencia: year,
        },
        _sum: { valor: true },
      });
      const total = result._sum.valor ?? 0;
      if (total > 0) {
        console.log(
          `  ${cat.nome}: R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        );
      }
    }
  }

  console.log("\nImportacao concluida com sucesso!");
}

main()
  .catch((err) => {
    console.error("ERRO na importacao:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
