import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/produtos - Lista todos os produtos ativos com categoria
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
    console.error("Erro ao buscar produtos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}

// POST /api/produtos - Cria um novo produto
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, descricao, preco, imagem, categoriaId } = body;

    if (!nome || preco === undefined || !categoriaId) {
      return NextResponse.json(
        { error: "Nome, preco e categoriaId sao obrigatorios" },
        { status: 400 }
      );
    }

    if (preco < 0) {
      return NextResponse.json(
        { error: "Preco deve ser maior ou igual a zero" },
        { status: 400 }
      );
    }

    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao: descricao ?? null,
        preco,
        imagem: imagem ?? null,
        categoriaId,
      },
      include: {
        categoria: true,
      },
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    );
  }
}
