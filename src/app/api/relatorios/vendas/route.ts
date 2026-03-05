import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/relatorios/vendas - Relatorio de vendas por periodo
export async function GET(request: NextRequest) {
  try {
    const inicio = request.nextUrl.searchParams.get("inicio");
    const fim = request.nextUrl.searchParams.get("fim");

    if (!inicio || !fim) {
      return NextResponse.json(
        { error: "Query params inicio e fim sao obrigatorios" },
        { status: 400 }
      );
    }

    const dataInicio = new Date(inicio);
    const dataFim = new Date(fim);

    // Ajustar dataFim para incluir o dia inteiro (fim do dia)
    dataFim.setHours(23, 59, 59, 999);

    const whereVendas = {
      status: "FINALIZADA" as const,
      createdAt: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    // =============================================
    // TOTAIS GERAIS
    // =============================================
    const vendas = await prisma.venda.findMany({
      where: whereVendas,
      select: {
        id: true,
        total: true,
        formaPagamento: true,
        origem: true,
        createdAt: true,
      },
    });

    const totalVendas = vendas.length;
    const faturamento = vendas.reduce((acc, v) => acc + v.total, 0);
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

    // =============================================
    // POR FORMA DE PAGAMENTO
    // =============================================
    const formaMap = new Map<string, { total: number; count: number }>();
    for (const venda of vendas) {
      const existing = formaMap.get(venda.formaPagamento) || { total: 0, count: 0 };
      existing.total += venda.total;
      existing.count += 1;
      formaMap.set(venda.formaPagamento, existing);
    }
    const porFormaPagamento = Array.from(formaMap.entries()).map(([forma, dados]) => ({
      forma,
      total: dados.total,
      count: dados.count,
    }));

    // =============================================
    // POR ORIGEM
    // =============================================
    const origemMap = new Map<string, { total: number; count: number }>();
    for (const venda of vendas) {
      const existing = origemMap.get(venda.origem) || { total: 0, count: 0 };
      existing.total += venda.total;
      existing.count += 1;
      origemMap.set(venda.origem, existing);
    }
    const porOrigem = Array.from(origemMap.entries()).map(([origem, dados]) => ({
      origem,
      total: dados.total,
      count: dados.count,
    }));

    // =============================================
    // TOP 10 PRODUTOS MAIS VENDIDOS
    // =============================================
    const topProdutosRaw = await prisma.itemVenda.groupBy({
      by: ["produtoId"],
      where: {
        venda: whereVendas,
      },
      _sum: {
        quantidade: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantidade: "desc",
        },
      },
      take: 10,
    });

    const produtoIds = topProdutosRaw.map((item) => item.produtoId);
    const [produtos] = await Promise.all([
      prisma.produto.findMany({
        where: { id: { in: produtoIds } },
        select: { id: true, nome: true },
      }),
    ]);

    const produtoNomeMap = new Map(produtos.map((p) => [p.id, p.nome]));

    const topProdutos = topProdutosRaw.map((item) => ({
      produtoId: item.produtoId,
      nome: produtoNomeMap.get(item.produtoId) || "Produto removido",
      quantidade: item._sum.quantidade || 0,
      total: item._sum.subtotal || 0,
    }));

    // =============================================
    // VENDAS POR DIA (para grafico)
    // =============================================
    const diaMap = new Map<string, { total: number; count: number }>();
    for (const venda of vendas) {
      const dia = venda.createdAt.toISOString().split("T")[0];
      const existing = diaMap.get(dia) || { total: 0, count: 0 };
      existing.total += venda.total;
      existing.count += 1;
      diaMap.set(dia, existing);
    }
    const vendasPorDia = Array.from(diaMap.entries())
      .map(([data, dados]) => ({
        data,
        total: dados.total,
        count: dados.count,
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    return NextResponse.json({
      totalVendas,
      faturamento,
      ticketMedio,
      porFormaPagamento,
      porOrigem,
      topProdutos,
      vendasPorDia,
    });
  } catch (error) {
    console.error("Erro ao gerar relatorio de vendas:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatorio de vendas" },
      { status: 500 }
    );
  }
}
