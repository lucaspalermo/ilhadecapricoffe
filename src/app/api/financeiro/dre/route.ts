import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/financeiro/dre - Gera relatorio DRE para um mes/ano
export async function GET(request: NextRequest) {
  try {
    const mes = request.nextUrl.searchParams.get("mes");
    const ano = request.nextUrl.searchParams.get("ano");

    if (!mes || !ano) {
      return NextResponse.json(
        { error: "Query params mes e ano sao obrigatorios" },
        { status: 400 }
      );
    }

    const mesNum = parseInt(mes, 10);
    const anoNum = parseInt(ano, 10);

    // Calcular inicio e fim do mes para filtrar vendas por createdAt
    const startOfMonth = new Date(anoNum, mesNum - 1, 1);
    const startOfNextMonth = new Date(anoNum, mesNum, 1);

    // =============================================
    // RECEITA - calculada a partir das vendas finalizadas do mes
    // =============================================
    const vendas = await prisma.venda.findMany({
      where: {
        status: "FINALIZADA",
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      select: {
        total: true,
        formaPagamento: true,
        origem: true,
      },
    });

    const receitaTotal = vendas.reduce((acc, v) => acc + v.total, 0);

    const porFormaPagamento = {
      DINHEIRO: 0,
      PIX: 0,
      CARTAO_DEBITO: 0,
      CARTAO_CREDITO: 0,
    };

    const porOrigem = {
      BALCAO: 0,
      IFOOD: 0,
    };

    for (const venda of vendas) {
      if (venda.formaPagamento in porFormaPagamento) {
        porFormaPagamento[venda.formaPagamento as keyof typeof porFormaPagamento] += venda.total;
      }
      if (venda.origem in porOrigem) {
        porOrigem[venda.origem as keyof typeof porOrigem] += venda.total;
      }
    }

    // =============================================
    // DESPESAS - lancamentos agrupados por categoria financeira
    // =============================================
    const categorias = await prisma.categoriaFinanceira.findMany({
      where: { tipo: "DESPESA" },
      include: {
        lancamentos: {
          where: {
            mesReferencia: mesNum,
            anoReferencia: anoNum,
          },
          select: {
            descricao: true,
            valor: true,
          },
        },
      },
      orderBy: { ordem: "asc" },
    });

    const despesas = categorias
      .filter((cat) => cat.lancamentos.length > 0)
      .map((cat) => ({
        categoria: cat.nome,
        categoriaId: cat.id,
        total: cat.lancamentos.reduce((acc, l) => acc + l.valor, 0),
        lancamentos: cat.lancamentos.map((l) => ({
          descricao: l.descricao,
          valor: l.valor,
        })),
      }));

    const totalDespesas = despesas.reduce((acc, d) => acc + d.total, 0);

    // =============================================
    // RESULTADO
    // =============================================
    const resultado = receitaTotal - totalDespesas;

    return NextResponse.json({
      receita: {
        total: receitaTotal,
        porFormaPagamento,
        porOrigem,
      },
      despesas,
      resultado,
    });
  } catch (error) {
    console.error("Erro ao gerar DRE:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatorio DRE" },
      { status: 500 }
    );
  }
}
