import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/estoque/alertas - Retorna produtos com estoque <= estoqueMinimo
export async function GET() {
  try {
    const todos = await prisma.produto.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, estoque: true, estoqueMinimo: true },
      orderBy: { estoque: "asc" },
    });

    // Prisma nao suporta comparar dois campos no where, filtramos em JS
    const alertas = todos.filter((p) => p.estoque <= p.estoqueMinimo);

    return NextResponse.json({ count: alertas.length, produtos: alertas });
  } catch (error) {
    console.error("Erro ao buscar alertas de estoque:", error);
    return NextResponse.json(
      { error: "Erro ao buscar alertas" },
      { status: 500 }
    );
  }
}
