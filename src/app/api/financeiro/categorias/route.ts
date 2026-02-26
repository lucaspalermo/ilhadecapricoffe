import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/financeiro/categorias - Lista todas as categorias financeiras ordenadas
export async function GET(request: NextRequest) {
  try {
    const tipo = request.nextUrl.searchParams.get("tipo");

    const categorias = await prisma.categoriaFinanceira.findMany({
      where: {
        ...(tipo && { tipo }),
      },
      orderBy: { ordem: "asc" },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias financeiras:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias financeiras" },
      { status: 500 }
    );
  }
}

// POST /api/financeiro/categorias - Cria uma nova categoria financeira
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, tipo, ordem } = body;

    if (!nome || !tipo) {
      return NextResponse.json(
        { error: "Nome e tipo sao obrigatorios" },
        { status: 400 }
      );
    }

    if (!["DESPESA", "RECEITA"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo deve ser DESPESA ou RECEITA" },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoriaFinanceira.create({
      data: {
        nome,
        tipo,
        ordem: ordem ?? 0,
      },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria financeira:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria financeira" },
      { status: 500 }
    );
  }
}
