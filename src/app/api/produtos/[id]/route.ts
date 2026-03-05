import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT /api/produtos/[id] - Atualiza um produto
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const produtoId = parseInt(id, 10);

    if (isNaN(produtoId)) {
      return NextResponse.json(
        { error: "ID invalido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { nome, descricao, preco, custoUnitario, estoqueMinimo, imagem, categoriaId, ativo } = body;

    const produto = await prisma.produto.update({
      where: { id: produtoId },
      data: {
        ...(nome !== undefined && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(preco !== undefined && { preco }),
        ...(custoUnitario !== undefined && { custoUnitario }),
        ...(estoqueMinimo !== undefined && { estoqueMinimo }),
        ...(imagem !== undefined && { imagem }),
        ...(categoriaId !== undefined && { categoriaId }),
        ...(ativo !== undefined && { ativo }),
      },
      include: {
        categoria: true,
      },
    });

    return NextResponse.json(produto);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar produto" },
      { status: 500 }
    );
  }
}

// DELETE /api/produtos/[id] - Soft delete (desativa o produto)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const produtoId = parseInt(id, 10);

    if (isNaN(produtoId)) {
      return NextResponse.json(
        { error: "ID invalido" },
        { status: 400 }
      );
    }

    const produto = await prisma.produto.update({
      where: { id: produtoId },
      data: { ativo: false },
    });

    return NextResponse.json(produto);
  } catch (error) {
    console.error("Erro ao desativar produto:", error);
    return NextResponse.json(
      { error: "Erro ao desativar produto" },
      { status: 500 }
    );
  }
}
