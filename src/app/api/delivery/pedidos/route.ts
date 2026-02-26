import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/delivery/pedidos - Lista pedidos de delivery (filtro opcional por status)
export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get("status");

    const where = status ? { status } : {};

    const pedidos = await prisma.pedidoDelivery.findMany({
      where,
      include: {
        venda: {
          include: {
            itens: {
              include: {
                produto: {
                  select: { id: true, nome: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(pedidos);
  } catch (error) {
    console.error("Erro ao buscar pedidos de delivery:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pedidos de delivery" },
      { status: 500 }
    );
  }
}

// POST /api/delivery/pedidos - Cria um novo pedido de delivery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plataforma, pedidoExternoId, dados, vendaId } = body;

    if (!plataforma || !pedidoExternoId || !dados) {
      return NextResponse.json(
        { error: "plataforma, pedidoExternoId e dados sao obrigatorios" },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedidoDelivery.create({
      data: {
        plataforma,
        pedidoExternoId,
        dados,
        vendaId: vendaId ?? null,
      },
      include: {
        venda: true,
      },
    });

    return NextResponse.json(pedido, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar pedido de delivery:", error);
    return NextResponse.json(
      { error: "Erro ao criar pedido de delivery" },
      { status: 500 }
    );
  }
}

// PUT /api/delivery/pedidos - Atualiza o status de um pedido de delivery
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, vendaId } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "id e status sao obrigatorios" },
        { status: 400 }
      );
    }

    const statusValidos = ["NOVO", "ACEITO", "EM_PREPARO", "PRONTO", "CANCELADO"];
    if (!statusValidos.includes(status)) {
      return NextResponse.json(
        { error: `Status invalido. Valores aceitos: ${statusValidos.join(", ")}` },
        { status: 400 }
      );
    }

    const pedido = await prisma.pedidoDelivery.update({
      where: { id },
      data: {
        status,
        ...(vendaId !== undefined && { vendaId }),
      },
      include: {
        venda: true,
      },
    });

    return NextResponse.json(pedido);
  } catch (error) {
    console.error("Erro ao atualizar pedido de delivery:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar pedido de delivery" },
      { status: 500 }
    );
  }
}
