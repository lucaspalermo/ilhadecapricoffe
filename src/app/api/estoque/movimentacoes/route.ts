import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/estoque/movimentacoes - Lista movimentacoes de estoque
export async function GET(request: NextRequest) {
  try {
    const produtoId = request.nextUrl.searchParams.get("produtoId");
    const tipo = request.nextUrl.searchParams.get("tipo");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const where: Record<string, unknown> = {};

    if (produtoId) {
      where.produtoId = parseInt(produtoId, 10);
    }

    if (tipo) {
      where.tipo = tipo;
    }

    const movimentacoes = await prisma.movimentacaoEstoque.findMany({
      where,
      include: {
        produto: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(movimentacoes);
  } catch (error) {
    console.error("Erro ao buscar movimentacoes de estoque:", error);
    return NextResponse.json(
      { error: "Erro ao buscar movimentacoes de estoque" },
      { status: 500 }
    );
  }
}
