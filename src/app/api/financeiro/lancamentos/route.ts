import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/financeiro/lancamentos - Lista lancamentos por mes/ano
export async function GET(request: NextRequest) {
  try {
    const mes = request.nextUrl.searchParams.get("mes");
    const ano = request.nextUrl.searchParams.get("ano");
    const categoriaFinanceiraId = request.nextUrl.searchParams.get("categoriaFinanceiraId");

    if (!mes || !ano) {
      return NextResponse.json(
        { error: "Query params mes e ano sao obrigatorios" },
        { status: 400 }
      );
    }

    const lancamentos = await prisma.lancamento.findMany({
      where: {
        mesReferencia: parseInt(mes, 10),
        anoReferencia: parseInt(ano, 10),
        ...(categoriaFinanceiraId && {
          categoriaFinanceiraId: parseInt(categoriaFinanceiraId, 10),
        }),
      },
      include: {
        categoriaFinanceira: true,
      },
      orderBy: { data: "desc" },
    });

    return NextResponse.json(lancamentos);
  } catch (error) {
    console.error("Erro ao buscar lancamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar lancamentos" },
      { status: 500 }
    );
  }
}

// POST /api/financeiro/lancamentos - Cria um novo lancamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoriaFinanceiraId, descricao, valor, data, mesReferencia, anoReferencia } = body;

    if (!categoriaFinanceiraId || !descricao || valor === undefined || !data || !mesReferencia || !anoReferencia) {
      return NextResponse.json(
        { error: "categoriaFinanceiraId, descricao, valor, data, mesReferencia e anoReferencia sao obrigatorios" },
        { status: 400 }
      );
    }

    const lancamento = await prisma.lancamento.create({
      data: {
        categoriaFinanceiraId,
        descricao,
        valor,
        data: new Date(data),
        mesReferencia,
        anoReferencia,
      },
      include: {
        categoriaFinanceira: true,
      },
    });

    return NextResponse.json(lancamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lancamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar lancamento" },
      { status: 500 }
    );
  }
}

// PUT /api/financeiro/lancamentos - Atualiza um lancamento
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, categoriaFinanceiraId, descricao, valor, data, mesReferencia, anoReferencia } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID e obrigatorio" },
        { status: 400 }
      );
    }

    const lancamento = await prisma.lancamento.update({
      where: { id },
      data: {
        ...(categoriaFinanceiraId !== undefined && { categoriaFinanceiraId }),
        ...(descricao !== undefined && { descricao }),
        ...(valor !== undefined && { valor }),
        ...(data !== undefined && { data: new Date(data) }),
        ...(mesReferencia !== undefined && { mesReferencia }),
        ...(anoReferencia !== undefined && { anoReferencia }),
      },
      include: {
        categoriaFinanceira: true,
      },
    });

    return NextResponse.json(lancamento);
  } catch (error) {
    console.error("Erro ao atualizar lancamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar lancamento" },
      { status: 500 }
    );
  }
}

// DELETE /api/financeiro/lancamentos?id=X - Deleta um lancamento
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Query param id e obrigatorio" },
        { status: 400 }
      );
    }

    await prisma.lancamento.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ message: "Lancamento deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar lancamento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar lancamento" },
      { status: 500 }
    );
  }
}
