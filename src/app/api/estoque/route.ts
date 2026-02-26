import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/estoque - Lista todos os produtos ativos com nivel de estoque
export async function GET() {
  try {
    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      include: {
        categoria: true,
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(produtos);
  } catch (error) {
    console.error("Erro ao buscar estoque:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estoque" },
      { status: 500 }
    );
  }
}

// POST /api/estoque - Registra entrada de estoque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produtoId, quantidade, observacao } = body;

    if (!produtoId || !quantidade) {
      return NextResponse.json(
        { error: "produtoId e quantidade sao obrigatorios" },
        { status: 400 }
      );
    }

    if (quantidade <= 0) {
      return NextResponse.json(
        { error: "Quantidade deve ser maior que zero" },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const movimentacao = await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: "ENTRADA",
          quantidade,
          observacao: observacao ?? null,
        },
      });

      const produto = await tx.produto.update({
        where: { id: produtoId },
        data: {
          estoque: { increment: quantidade },
        },
        include: {
          categoria: true,
        },
      });

      return { movimentacao, produto };
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar entrada de estoque:", error);
    return NextResponse.json(
      { error: "Erro ao registrar entrada de estoque" },
      { status: 500 }
    );
  }
}
