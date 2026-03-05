import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

function excelDateToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000));
}

function categorizarDespesa(tipo: string): string {
  const t = tipo.toUpperCase();
  if (t.includes("RETIR") || t.includes("SOCIETÁR")) return "Retirada dos Sócios";
  if (
    t.includes("SALÁR") || t.includes("VALE ") || t.includes("FÉRIAS") ||
    t.includes("13º") || t.includes("ACERTO SALAR") || t.includes("ESTAGIÁR") ||
    t.includes("PROPORCIONAL") || t.includes("DEMISSIONAL") || t.includes("CESTA") ||
    t.includes("ADIANTAMENTO") || t.includes("RESCIS") || t.includes("VERBAS") ||
    t.includes("DÉCIMO") || t.includes("1º PARCELA") || t.includes("2º PARCELA") ||
    t.includes("SALARIAL") || t.includes("PGTO. SALARIAL") || t.includes("PAGTO. SALARIAL")
  ) return "Salários e Encargos";
  if (t.includes("INSS") || t.includes("FGTS") || t.includes("IMPOSTO") ||
      t.includes("SIMPLES") || t.includes("IRRF") || t.includes("RECEITA FEDERAL"))
    return "Impostos e Taxas";
  if (t.includes("ALUGUEL")) return "Aluguel";
  if (t.includes("INTERNET")) return "Internet e Telefone";
  if (t.includes("SEGURO")) return "Seguro Cartão";
  if (t.includes("CONTABILID")) return "Contabilidade";
  if (t.includes("SISTEMA")) return "Sistema PDV";
  if (t.includes("TRANSPORT") || t.includes("UBER")) return "Transportes";
  if (
    t.includes("FATURA DO CARTÃO") || t.includes("CARTÃO DE CRÉD") ||
    t.includes("APLICAÇÃO CDB") || t.includes("CDB") ||
    t.includes("PGTO. COMPRAS C. CRÉD") || t.includes("FATURA CARTÃO")
  ) return "Fatura Cartão";
  if (t.includes("GELADEIRA") || t.includes("MICROONDAS") || t.includes("MAQ.") ||
      t.includes("EQUIPAMENTO") || t.includes("PRATINHOS") || t.includes("CASA ORIENTE"))
    return "Equipamentos e Utensílios";
  if (t.includes("EMBALAGEM")) return "Embalagens";
  if (t.includes("MATERIAL ESCRIT")) return "Despesas Diversas";
  return "Alimentos e Insumos";
}

function lerDespesasMes(ws: XLSX.WorkSheet): { data: Date; fornecedor: string; valor: number; tipo: string }[] {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
  const despesas: { data: Date; fornecedor: string; valor: number; tipo: string }[] = [];
  for (const r of rows) {
    const debito = parseFloat(r[0]) || 0;
    const dataSerial = r[2];
    const saida = parseFloat(r[10]) || 0;
    const fornecedor = String(r[7]).trim();
    const tipo = String(r[12]).trim();
    if (debito > 0 && saida > 0 && fornecedor && fornecedor !== "FORNECEDOR" &&
        fornecedor !== "SALDO ANTERIOR" && fornecedor !== "0" && typeof dataSerial === "number") {
      despesas.push({ data: excelDateToDate(dataSerial), fornecedor, valor: saida, tipo });
    }
  }
  return despesas;
}

function lerFaturamentoDia(ws: XLSX.WorkSheet, ano: number, mes: number): { data: Date; valor: number }[] {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as any[][];
  const result: { data: Date; valor: number }[] = [];
  for (const r of rows) {
    const dia = parseInt(r[0]);
    const forma = String(r[2]).toUpperCase().trim();
    const valor = parseFloat(r[3]) || 0;
    if (!isNaN(dia) && dia > 0 && forma.includes("TOTAL") && valor > 0) {
      result.push({ data: new Date(ano, mes - 1, dia), valor });
    }
  }
  return result;
}

async function main() {
  console.log("Iniciando importação completa dos dados reais da Cafeteria Ilha de Capri...\n");

  // ============================================================
  // 1. DESATIVAR PRODUTOS FICTÍCIOS DO SEED
  // ============================================================
  console.log("1. Desativando produtos de exemplo...");
  await prisma.produto.updateMany({
    where: { id: { lte: 19 } },
    data: { ativo: false },
  });
  console.log("   Produtos antigos desativados.\n");

  // ============================================================
  // 2. CATEGORIAS E PRODUTOS REAIS
  // ============================================================
  console.log("2. Criando categorias e produtos reais...");

  const catCafes = await prisma.categoria.upsert({
    where: { id: 100 }, update: { nome: "Cafés", ordem: 1, ativo: true },
    create: { id: 100, nome: "Cafés", ordem: 1 },
  });
  const catAlmoco = await prisma.categoria.upsert({
    where: { id: 101 }, update: { nome: "Almoço", ordem: 2, ativo: true },
    create: { id: 101, nome: "Almoço", ordem: 2 },
  });
  const catMarmitas = await prisma.categoria.upsert({
    where: { id: 102 }, update: { nome: "Marmitas e Saladas", ordem: 3, ativo: true },
    create: { id: 102, nome: "Marmitas e Saladas", ordem: 3 },
  });
  const catSalgados = await prisma.categoria.upsert({
    where: { id: 103 }, update: { nome: "Salgados", ordem: 4, ativo: true },
    create: { id: 103, nome: "Salgados", ordem: 4 },
  });
  const catLanches = await prisma.categoria.upsert({
    where: { id: 104 }, update: { nome: "Lanches e Sanduíches", ordem: 5, ativo: true },
    create: { id: 104, nome: "Lanches e Sanduíches", ordem: 5 },
  });
  const catDoces = await prisma.categoria.upsert({
    where: { id: 105 }, update: { nome: "Doces e Tortas", ordem: 6, ativo: true },
    create: { id: 105, nome: "Doces e Tortas", ordem: 6 },
  });
  const catBebidas = await prisma.categoria.upsert({
    where: { id: 106 }, update: { nome: "Bebidas", ordem: 7, ativo: true },
    create: { id: 106, nome: "Bebidas", ordem: 7 },
  });

  const produtosReais = [
    // CAFÉS
    { nome: "Café Expresso", preco: 5.00, categoriaId: catCafes.id, estoque: 999 },
    { nome: "Café com Leite", preco: 7.00, categoriaId: catCafes.id, estoque: 999 },
    { nome: "Cappuccino", preco: 9.00, categoriaId: catCafes.id, estoque: 999 },
    { nome: "Café Gelado", preco: 10.00, categoriaId: catCafes.id, estoque: 999 },
    { nome: "Macchiato", preco: 8.00, categoriaId: catCafes.id, estoque: 999 },
    { nome: "Latte", preco: 9.50, categoriaId: catCafes.id, estoque: 999 },
    { nome: "Café Americano", preco: 6.00, categoriaId: catCafes.id, estoque: 999 },
    { nome: "Chocolate Quente", preco: 9.00, categoriaId: catCafes.id, estoque: 999 },
    // ALMOÇO
    { nome: "Prato Feito", preco: 25.00, categoriaId: catAlmoco.id, estoque: 999 },
    { nome: "Prato Executivo", preco: 32.00, categoriaId: catAlmoco.id, estoque: 999 },
    // MARMITAS E SALADAS
    { nome: "Marmita Fit", preco: 22.00, categoriaId: catMarmitas.id, estoque: 999 },
    { nome: "Salada Mista", preco: 16.00, categoriaId: catMarmitas.id, estoque: 999 },
    // SALGADOS
    { nome: "Coxinha", preco: 6.00, categoriaId: catSalgados.id, estoque: 999 },
    { nome: "Esfira", preco: 5.00, categoriaId: catSalgados.id, estoque: 999 },
    { nome: "Pão de Queijo", preco: 5.00, categoriaId: catSalgados.id, estoque: 999 },
    { nome: "Croissant", preco: 7.00, categoriaId: catSalgados.id, estoque: 999 },
    // LANCHES E SANDUÍCHES
    { nome: "Sanduíche Natural", preco: 14.00, categoriaId: catLanches.id, estoque: 999 },
    { nome: "Misto Quente", preco: 10.00, categoriaId: catLanches.id, estoque: 999 },
    { nome: "Baguete Recheada", preco: 13.00, categoriaId: catLanches.id, estoque: 999 },
    // DOCES E TORTAS
    { nome: "Brownie", preco: 9.00, categoriaId: catDoces.id, estoque: 999 },
    { nome: "Cookie", preco: 7.00, categoriaId: catDoces.id, estoque: 999 },
    { nome: "Bolo de Pote", preco: 11.00, categoriaId: catDoces.id, estoque: 999 },
    { nome: "Pão de Mel", preco: 7.00, categoriaId: catDoces.id, estoque: 999 },
    { nome: "Torta (fatia)", preco: 13.00, categoriaId: catDoces.id, estoque: 999 },
    { nome: "Açaí 300ml", preco: 17.00, categoriaId: catDoces.id, estoque: 999 },
    // BEBIDAS
    { nome: "Suco Natural", preco: 9.00, categoriaId: catBebidas.id, estoque: 999 },
    { nome: "Água Mineral", preco: 3.50, categoriaId: catBebidas.id, estoque: 999 },
    { nome: "Refrigerante Lata", preco: 6.00, categoriaId: catBebidas.id, estoque: 999 },
    { nome: "Chá Gelado", preco: 7.00, categoriaId: catBebidas.id, estoque: 999 },
    { nome: "Vitamina", preco: 12.00, categoriaId: catBebidas.id, estoque: 999 },
  ];

  for (const p of produtosReais) {
    const exists = await prisma.produto.findFirst({ where: { nome: p.nome, ativo: true } });
    if (!exists) {
      await prisma.produto.create({ data: p });
    }
  }
  console.log(`   ${produtosReais.length} produtos reais criados (${Object.values([catCafes, catAlmoco, catMarmitas, catSalgados, catLanches, catDoces, catBebidas]).map(c => c.nome).join(", ")}).\n`);

  // ============================================================
  // 3. CATEGORIAS FINANCEIRAS (DRE)
  // ============================================================
  console.log("3. Criando categorias financeiras do DRE...");

  const categoriasFinanceiras = [
    { nome: "Alimentos e Insumos", tipo: "DESPESA", ordem: 1 },
    { nome: "Salários e Encargos", tipo: "DESPESA", ordem: 2 },
    { nome: "Aluguel", tipo: "DESPESA", ordem: 3 },
    { nome: "Impostos e Taxas", tipo: "DESPESA", ordem: 4 },
    { nome: "Embalagens", tipo: "DESPESA", ordem: 5 },
    { nome: "Internet e Telefone", tipo: "DESPESA", ordem: 6 },
    { nome: "Seguro Cartão", tipo: "DESPESA", ordem: 7 },
    { nome: "Contabilidade", tipo: "DESPESA", ordem: 8 },
    { nome: "Sistema PDV", tipo: "DESPESA", ordem: 9 },
    { nome: "Transportes", tipo: "DESPESA", ordem: 10 },
    { nome: "Fatura Cartão", tipo: "DESPESA", ordem: 11 },
    { nome: "Equipamentos e Utensílios", tipo: "DESPESA", ordem: 12 },
    { nome: "Retirada dos Sócios", tipo: "DESPESA", ordem: 13 },
    { nome: "Despesas Diversas", tipo: "DESPESA", ordem: 14 },
    { nome: "Receita Histórica", tipo: "RECEITA", ordem: 1 },
  ];

  const catFinMap: Record<string, number> = {};
  for (const cf of categoriasFinanceiras) {
    const existing = await prisma.categoriaFinanceira.findFirst({ where: { nome: cf.nome } });
    let id: number;
    if (existing) {
      id = existing.id;
    } else {
      const created = await prisma.categoriaFinanceira.create({ data: cf });
      id = created.id;
    }
    catFinMap[cf.nome] = id;
  }
  console.log(`   ${categoriasFinanceiras.length} categorias financeiras configuradas.\n`);

  // ============================================================
  // 4. IMPORTAR DESPESAS (Nov 25, Dez 25, Jan 26, Fev 26, Mar 26)
  // ============================================================
  console.log("4. Importando lançamentos de despesas...");

  const wbFin = XLSX.readFile("C:/Users/lsimp/Downloads/PLANILHA FINANCEIRA.xlsx");

  const mesesPlanilha: { sheetName: string; mes: number; ano: number }[] = [
    { sheetName: "NOVEMBRO 25",  mes: 11, ano: 2025 },
    { sheetName: "DEZEMBRO 25",  mes: 12, ano: 2025 },
    { sheetName: "JANEIRO 26",   mes: 1,  ano: 2026 },
    { sheetName: "FEVEREIRO 26", mes: 2,  ano: 2026 },
    { sheetName: "MARÇO 26",     mes: 3,  ano: 2026 },
  ];

  let totalDespesas = 0;
  for (const { sheetName, mes, ano } of mesesPlanilha) {
    const ws = wbFin.Sheets[sheetName];
    if (!ws) { console.log(`   Aba ${sheetName} não encontrada`); continue; }
    const despesas = lerDespesasMes(ws);

    // Delete existing lancamentos for this month to avoid duplicates
    await prisma.lancamento.deleteMany({
      where: {
        mesReferencia: mes,
        anoReferencia: ano,
        categoriaFinanceira: { tipo: "DESPESA" },
      },
    });

    for (const d of despesas) {
      const catNome = categorizarDespesa(d.tipo);
      const catId = catFinMap[catNome];
      if (!catId) { console.log(`   ATENÇÃO: categoria não encontrada para tipo: ${d.tipo}`); continue; }
      await prisma.lancamento.create({
        data: {
          categoriaFinanceiraId: catId,
          descricao: `${d.fornecedor} - ${d.tipo}`,
          valor: d.valor,
          data: d.data,
          mesReferencia: mes,
          anoReferencia: ano,
        },
      });
    }
    const total = despesas.reduce((a, d) => a + d.valor, 0);
    console.log(`   ${sheetName}: ${despesas.length} despesas - Total R$ ${total.toFixed(2)}`);
    totalDespesas += total;
  }
  console.log(`   TOTAL DESPESAS IMPORTADAS: R$ ${totalDespesas.toFixed(2)}\n`);

  // ============================================================
  // 5. IMPORTAR RECEITA HISTÓRICA (FATURAMENTO)
  // ============================================================
  console.log("5. Importando receita histórica...");

  const wbFat = XLSX.readFile("C:/Users/lsimp/Downloads/FATURAMENTO 2026.xlsx");
  const catReceitaId = catFinMap["Receita Histórica"];

  const mesesFat: { sheetName: string; mes: number; ano: number }[] = [
    { sheetName: "JANEIRO 26",   mes: 1,  ano: 2026 },
    { sheetName: "FEVEREIRO 26", mes: 2,  ano: 2026 },
    { sheetName: "MARÇO 26",     mes: 3,  ano: 2026 },
  ];

  // Receita Nov e Dez 2025 vêm do banco (totais do DRE histórico)
  const receitaHistorica2025 = [
    { mes: 11, ano: 2025, dias: [
      { data: new Date(2025, 10, 1), valor: 1233.45 }, { data: new Date(2025, 10, 2), valor: 761.22 },
      { data: new Date(2025, 10, 3), valor: 135.11 }, { data: new Date(2025, 10, 4), valor: 840.04 },
      { data: new Date(2025, 10, 5), valor: 1566.21 }, { data: new Date(2025, 10, 6), valor: 1977.51 },
      { data: new Date(2025, 10, 7), valor: 1202.97 }, { data: new Date(2025, 10, 8), valor: 2031.56 },
      { data: new Date(2025, 10, 9), valor: 340.51 }, { data: new Date(2025, 10, 10), valor: 332.86 },
      { data: new Date(2025, 10, 11), valor: 794.14 }, { data: new Date(2025, 10, 12), valor: 1029.62 },
      { data: new Date(2025, 10, 13), valor: 1448.85 }, { data: new Date(2025, 10, 14), valor: 1583.83 },
      { data: new Date(2025, 10, 15), valor: 1352.57 }, { data: new Date(2025, 10, 16), valor: 399.82 },
      { data: new Date(2025, 10, 17), valor: 322.77 }, { data: new Date(2025, 10, 18), valor: 933.63 },
      { data: new Date(2025, 10, 19), valor: 2291.89 }, { data: new Date(2025, 10, 21), valor: 531.78 },
      { data: new Date(2025, 10, 22), valor: 775.07 }, { data: new Date(2025, 10, 23), valor: 653.17 },
      { data: new Date(2025, 10, 24), valor: 161.65 }, { data: new Date(2025, 10, 25), valor: 789.86 },
      { data: new Date(2025, 10, 26), valor: 1263.92 }, { data: new Date(2025, 10, 27), valor: 1472.81 },
      { data: new Date(2025, 10, 28), valor: 1255.64 }, { data: new Date(2025, 10, 30), valor: 762.20 },
    ]},
    { mes: 12, ano: 2025, dias: [
      { data: new Date(2025, 11, 1), valor: 194.01 }, { data: new Date(2025, 11, 2), valor: 1219.43 },
      { data: new Date(2025, 11, 3), valor: 1283.42 }, { data: new Date(2025, 11, 4), valor: 2355.47 },
      { data: new Date(2025, 11, 5), valor: 2165.95 }, { data: new Date(2025, 11, 6), valor: 1047.19 },
      { data: new Date(2025, 11, 7), valor: 578.03 }, { data: new Date(2025, 11, 8), valor: 584.84 },
      { data: new Date(2025, 11, 9), valor: 1480.97 }, { data: new Date(2025, 11, 10), valor: 1683.58 },
      { data: new Date(2025, 11, 11), valor: 1356.01 }, { data: new Date(2025, 11, 12), valor: 1310.81 },
      { data: new Date(2025, 11, 14), valor: 668.86 }, { data: new Date(2025, 11, 15), valor: 224.99 },
      { data: new Date(2025, 11, 16), valor: 2554.09 }, { data: new Date(2025, 11, 17), valor: 2004.37 },
      { data: new Date(2025, 11, 18), valor: 1456.01 }, { data: new Date(2025, 11, 19), valor: 5669.16 },
      { data: new Date(2025, 11, 20), valor: 1115.66 }, { data: new Date(2025, 11, 21), valor: 20.26 },
      { data: new Date(2025, 11, 22), valor: 3003.18 }, { data: new Date(2025, 11, 24), valor: 1.10 },
    ]},
  ];

  // Nov e Dez 2025
  for (const { mes, ano, dias } of receitaHistorica2025) {
    await prisma.lancamento.deleteMany({ where: { mesReferencia: mes, anoReferencia: ano, categoriaFinanceiraId: catReceitaId } });
    for (const { data, valor } of dias) {
      await prisma.lancamento.create({
        data: { categoriaFinanceiraId: catReceitaId, descricao: `Faturamento dia ${data.getDate()}/${String(mes).padStart(2,'0')}/${ano}`, valor, data, mesReferencia: mes, anoReferencia: ano },
      });
    }
    const total = dias.reduce((a, d) => a + d.valor, 0);
    console.log(`   ${mes}/${ano}: ${dias.length} dias - Total R$ ${total.toFixed(2)}`);
  }

  // Jan, Fev, Mar 2026 (from FATURAMENTO spreadsheet)
  for (const { sheetName, mes, ano } of mesesFat) {
    const ws = wbFat.Sheets[sheetName];
    if (!ws) continue;
    const dias = lerFaturamentoDia(ws, ano, mes);
    if (dias.length === 0) continue;
    await prisma.lancamento.deleteMany({ where: { mesReferencia: mes, anoReferencia: ano, categoriaFinanceiraId: catReceitaId } });
    for (const { data, valor } of dias) {
      await prisma.lancamento.create({
        data: { categoriaFinanceiraId: catReceitaId, descricao: `Faturamento dia ${data.getDate()}/${String(mes).padStart(2,'0')}/${ano}`, valor, data, mesReferencia: mes, anoReferencia: ano },
      });
    }
    const total = dias.reduce((a, d) => a + d.valor, 0);
    console.log(`   ${sheetName}: ${dias.length} dias - Total R$ ${total.toFixed(2)}`);
  }
  console.log();

  // ============================================================
  // RESUMO
  // ============================================================
  const totalProdutos = await prisma.produto.count({ where: { ativo: true } });
  const totalCatFin = await prisma.categoriaFinanceira.count();
  const totalLanc = await prisma.lancamento.count();
  console.log("============================================================");
  console.log("IMPORTAÇÃO CONCLUÍDA!");
  console.log(`Produtos ativos: ${totalProdutos}`);
  console.log(`Categorias financeiras: ${totalCatFin}`);
  console.log(`Lançamentos: ${totalLanc}`);
  console.log("============================================================");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
