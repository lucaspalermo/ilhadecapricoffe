import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/categorias - Lista todas as categorias ativas ordenadas
export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { ativo: true },
      orderBy: { ordem: "asc" },
    });

    return NextResponse.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}

// POST /api/categorias - Cria uma nova categoria
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, ordem } = body;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome e obrigatorio" },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.create({
      data: {
        nome,
        ordem: ordem ?? 0,
      },
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao criar categoria" },
      { status: 500 }
    );
  }
}

// PUT /api/categorias - Atualiza uma categoria
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, ordem, ativo } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID e obrigatorio" },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoria.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(ordem !== undefined && { ordem }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    return NextResponse.json(categoria);
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar categoria" },
      { status: 500 }
    );
  }
}
