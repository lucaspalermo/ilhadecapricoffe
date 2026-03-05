import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/vendas - Lista vendas por caixaId
export async function GET(request: NextRequest) {
  try {
    const caixaId = request.nextUrl.searchParams.get("caixaId");

    if (!caixaId) {
      return NextResponse.json(
        { error: "Query param caixaId e obrigatorio" },
        { status: 400 }
      );
    }

    const vendas = await prisma.venda.findMany({
      where: { caixaId: parseInt(caixaId, 10) },
      include: {
        itens: {
          include: {
            produto: {
              select: { id: true, nome: true },
            },
          },
        },
        operador: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(vendas);
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar vendas" },
      { status: 500 }
    );
  }
}

// POST /api/vendas - Cria uma venda com itens (transacao)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caixaId, operadorId, formaPagamento, origem, observacao, itens } = body;

    if (!caixaId || !operadorId || !formaPagamento || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: "caixaId, operadorId, formaPagamento e itens sao obrigatorios" },
        { status: 400 }
      );
    }

    // Calcula o total a partir dos itens
    const total = itens.reduce(
      (acc: number, item: { precoUnitario: number; quantidade: number }) =>
        acc + item.precoUnitario * item.quantidade,
      0
    );

    const venda = await prisma.$transaction(async (tx) => {
      const novaVenda = await tx.venda.create({
        data: {
          caixaId,
          operadorId,
          total,
          formaPagamento,
          origem: origem ?? "BALCAO",
          observacao: observacao ?? null,
          itens: {
            create: itens.map(
              (item: {
                produtoId: number;
                quantidade: number;
                precoUnitario: number;
              }) => ({
                produtoId: item.produtoId,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                subtotal: item.precoUnitario * item.quantidade,
              })
            ),
          },
        },
        include: {
          itens: {
            include: {
              produto: {
                select: { id: true, nome: true },
              },
            },
          },
          operador: {
            select: { id: true, nome: true },
          },
        },
      });

      // Deduzir estoque de cada produto vendido
      for (const item of itens as { produtoId: number; quantidade: number }[]) {
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId },
          select: { nome: true, estoque: true },
        });

        if (!produto) {
          throw new Error(`Produto #${item.produtoId} nao encontrado`);
        }
        if (produto.estoque < item.quantidade) {
          throw new Error(
            `Estoque insuficiente para "${produto.nome}". Disponivel: ${produto.estoque}, Solicitado: ${item.quantidade}`
          );
        }

        await tx.produto.update({
          where: { id: item.produtoId },
          data: { estoque: { decrement: item.quantidade } },
        });

        await tx.movimentacaoEstoque.create({
          data: {
            produtoId: item.produtoId,
            tipo: "SAIDA",
            quantidade: item.quantidade,
            observacao: `Venda #${novaVenda.id}`,
          },
        });
      }

      return novaVenda;
    });

    return NextResponse.json(venda, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar venda";
    console.error("Erro ao criar venda:", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
