import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/caixa - Retorna o caixa aberto atual
export async function GET() {
  try {
    const caixa = await prisma.caixa.findFirst({
      where: { status: "ABERTO" },
      include: {
        operador: {
          select: { id: true, nome: true },
        },
      },
      orderBy: { dataAbertura: "desc" },
    });

    if (!caixa) {
      return NextResponse.json(null);
    }

    return NextResponse.json(caixa);
  } catch (error) {
    console.error("Erro ao buscar caixa aberto:", error);
    return NextResponse.json(
      { error: "Erro ao buscar caixa aberto" },
      { status: 500 }
    );
  }
}

// POST /api/caixa - Abre um novo caixa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operadorId, valorAbertura } = body;

    if (!operadorId || valorAbertura === undefined) {
      return NextResponse.json(
        { error: "operadorId e valorAbertura sao obrigatorios" },
        { status: 400 }
      );
    }

    // Verifica se ja existe um caixa aberto
    const caixaAberto = await prisma.caixa.findFirst({
      where: { status: "ABERTO" },
    });

    if (caixaAberto) {
      return NextResponse.json(
        { error: "Ja existe um caixa aberto. Feche-o antes de abrir outro." },
        { status: 409 }
      );
    }

    const caixa = await prisma.caixa.create({
      data: {
        operadorId,
        valorAbertura,
      },
      include: {
        operador: {
          select: { id: true, nome: true },
        },
      },
    });

    return NextResponse.json(caixa, { status: 201 });
  } catch (error) {
    console.error("Erro ao abrir caixa:", error);
    return NextResponse.json(
      { error: "Erro ao abrir caixa" },
      { status: 500 }
    );
  }
}
