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

// POST /api/estoque - Registra entrada ou saída (perda) de estoque
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produtoId, quantidade, observacao, tipo = "ENTRADA" } = body;

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

    if (tipo !== "ENTRADA" && tipo !== "SAIDA") {
      return NextResponse.json(
        { error: "tipo deve ser ENTRADA ou SAIDA" },
        { status: 400 }
      );
    }

    const resultado = await prisma.$transaction(async (tx) => {
      // Para SAIDA, valida se há estoque suficiente
      if (tipo === "SAIDA") {
        const produto = await tx.produto.findUnique({ where: { id: produtoId } });
        if (!produto) {
          throw new Error("Produto não encontrado");
        }
        if (produto.estoque < quantidade) {
          throw new Error(`Estoque insuficiente. Disponível: ${produto.estoque}`);
        }
      }

      const movimentacao = await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo,
          quantidade,
          observacao: observacao ?? null,
        },
      });

      const produto = await tx.produto.update({
        where: { id: produtoId },
        data: {
          estoque: tipo === "ENTRADA"
            ? { increment: quantidade }
            : { decrement: quantidade },
        },
        include: { categoria: true },
      });

      return { movimentacao, produto };
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao registrar movimentacao de estoque";
    console.error("Erro ao registrar movimentacao:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
