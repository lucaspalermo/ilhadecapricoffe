import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/relatorios/hoje - Resumo das vendas de hoje em tempo real
export async function GET() {
  try {
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 0, 0, 0);
    const fimDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);

    const vendas = await prisma.venda.findMany({
      where: {
        status: "FINALIZADA",
        createdAt: { gte: inicioDia, lte: fimDia },
      },
      select: {
        id: true,
        total: true,
        formaPagamento: true,
        origem: true,
        createdAt: true,
        operador: { select: { nome: true } },
        itens: {
          select: {
            quantidade: true,
            produto: { select: { nome: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalVendas = vendas.length;
    const faturamento = vendas.reduce((acc, v) => acc + v.total, 0);
    const ticketMedio = totalVendas > 0 ? faturamento / totalVendas : 0;

    // Por forma de pagamento
    const pagMap: Record<string, { total: number; count: number }> = {};
    for (const v of vendas) {
      if (!pagMap[v.formaPagamento]) pagMap[v.formaPagamento] = { total: 0, count: 0 };
      pagMap[v.formaPagamento].total += v.total;
      pagMap[v.formaPagamento].count += 1;
    }
    const porFormaPagamento = Object.entries(pagMap).map(([forma, data]) => ({
      forma,
      total: data.total,
      count: data.count,
    }));

    // Por origem
    const origemMap: Record<string, { total: number; count: number }> = {};
    for (const v of vendas) {
      if (!origemMap[v.origem]) origemMap[v.origem] = { total: 0, count: 0 };
      origemMap[v.origem].total += v.total;
      origemMap[v.origem].count += 1;
    }
    const porOrigem = Object.entries(origemMap).map(([origem, data]) => ({
      origem,
      total: data.total,
      count: data.count,
    }));

    // Vendas por hora (0-23)
    const porHora: { hora: number; total: number; count: number }[] = Array.from({ length: 24 }, (_, h) => ({
      hora: h,
      total: 0,
      count: 0,
    }));
    for (const v of vendas) {
      const hora = new Date(v.createdAt).getHours();
      porHora[hora].total += v.total;
      porHora[hora].count += 1;
    }

    // Últimas 15 vendas
    const ultimasVendas = vendas.slice(0, 15).map((v) => ({
      id: v.id,
      total: v.total,
      formaPagamento: v.formaPagamento,
      origem: v.origem,
      createdAt: v.createdAt,
      operador: v.operador.nome,
      itens: v.itens.map((i) => `${i.quantidade}x ${i.produto.nome}`).join(", "),
    }));

    return NextResponse.json({
      totalVendas,
      faturamento,
      ticketMedio,
      porFormaPagamento,
      porOrigem,
      porHora,
      ultimasVendas,
      atualizadoEm: agora.toISOString(),
    });
  } catch (error) {
    console.error("Erro ao buscar dados de hoje:", error);
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 });
  }
}
