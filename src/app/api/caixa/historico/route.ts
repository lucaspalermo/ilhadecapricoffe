import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/caixa/historico - Retorna os ultimos 30 caixas com nome do operador
export async function GET() {
  try {
    const caixas = await prisma.caixa.findMany({
      take: 30,
      orderBy: { dataAbertura: "desc" },
      include: {
        operador: {
          select: { id: true, nome: true },
        },
      },
    });

    return NextResponse.json(caixas);
  } catch (error) {
    console.error("Erro ao buscar historico de caixas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar historico de caixas" },
      { status: 500 }
    );
  }
}
