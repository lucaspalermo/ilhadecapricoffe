import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/financeiro/anual?ano=2026
// Retorna progressão mensal de receita, despesa e resultado para o ano inteiro
export async function GET(request: NextRequest) {
  try {
    const ano = request.nextUrl.searchParams.get("ano");
    if (!ano) {
      return NextResponse.json({ error: "Query param ano e obrigatorio" }, { status: 400 });
    }
    const anoNum = parseInt(ano, 10);

    // Vendas do ano
    const startOfYear = new Date(anoNum, 0, 1);
    const startOfNextYear = new Date(anoNum + 1, 0, 1);

    const vendas = await prisma.venda.findMany({
      where: {
        status: "FINALIZADA",
        createdAt: { gte: startOfYear, lt: startOfNextYear },
      },
      select: { total: true, createdAt: true },
    });

    // Lançamentos do ano (receita histórica + despesas)
    const lancamentos = await prisma.lancamento.findMany({
      where: { anoReferencia: anoNum },
      include: { categoriaFinanceira: { select: { tipo: true, nome: true } } },
    });

    // Montar array de 12 meses
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: i + 1,
      receita: 0,
      despesa: 0,
      resultado: 0,
    }));

    for (const v of vendas) {
      const mes = new Date(v.createdAt).getMonth();
      meses[mes].receita += v.total;
    }

    for (const l of lancamentos) {
      const idx = l.mesReferencia - 1;
      if (idx < 0 || idx > 11) continue;
      if (l.categoriaFinanceira.tipo === "RECEITA") {
        meses[idx].receita += l.valor;
      } else {
        meses[idx].despesa += l.valor;
      }
    }

    for (const m of meses) {
      m.resultado = m.receita - m.despesa;
    }

    // Anos disponíveis (sem raw SQL)
    const anosLanc = await prisma.lancamento.groupBy({
      by: ["anoReferencia"],
      orderBy: { anoReferencia: "desc" },
    });
    const anosSet = new Set(anosLanc.map((r) => r.anoReferencia));
    // Adicionar o ano corrente sempre
    anosSet.add(new Date().getFullYear());
    const anosDisponiveis = Array.from(anosSet).sort((a, b) => b - a);

    return NextResponse.json({ ano: anoNum, meses, anosDisponiveis });
  } catch (error) {
    console.error("Erro ao gerar progressão anual:", error);
    return NextResponse.json({ error: "Erro ao gerar progressao anual" }, { status: 500 });
  }
}
