import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/caixa/fechar - Fecha o caixa aberto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caixaId, valorFechamento } = body;

    if (!caixaId || valorFechamento === undefined) {
      return NextResponse.json(
        { error: "caixaId e valorFechamento sao obrigatorios" },
        { status: 400 }
      );
    }

    // Verifica se o caixa existe e esta aberto
    const caixa = await prisma.caixa.findUnique({
      where: { id: caixaId },
    });

    if (!caixa) {
      return NextResponse.json(
        { error: "Caixa nao encontrado" },
        { status: 404 }
      );
    }

    if (caixa.status === "FECHADO") {
      return NextResponse.json(
        { error: "Este caixa ja esta fechado" },
        { status: 409 }
      );
    }

    const caixaFechado = await prisma.caixa.update({
      where: { id: caixaId },
      data: {
        valorFechamento,
        dataFechamento: new Date(),
        status: "FECHADO",
      },
      include: {
        operador: {
          select: { id: true, nome: true },
        },
      },
    });

    return NextResponse.json(caixaFechado);
  } catch (error) {
    console.error("Erro ao fechar caixa:", error);
    return NextResponse.json(
      { error: "Erro ao fechar caixa" },
      { status: 500 }
    );
  }
}
