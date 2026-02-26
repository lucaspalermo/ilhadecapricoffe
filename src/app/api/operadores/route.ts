import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";

// GET /api/operadores - Lista todos os operadores ativos
export async function GET() {
  try {
    const operadores = await prisma.operador.findMany({
      where: { ativo: true },
      select: {
        id: true,
        nome: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json(operadores);
  } catch (error) {
    console.error("Erro ao buscar operadores:", error);
    return NextResponse.json(
      { error: "Erro ao buscar operadores" },
      { status: 500 }
    );
  }
}

// POST /api/operadores - Cria um novo operador
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, pin } = body;

    if (!nome || !pin) {
      return NextResponse.json(
        { error: "Nome e PIN sao obrigatorios" },
        { status: 400 }
      );
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN deve conter exatamente 4 digitos numericos" },
        { status: 400 }
      );
    }

    const pinHash = hashSync(pin, 10);

    const operador = await prisma.operador.create({
      data: {
        nome,
        pin: pinHash,
      },
      select: {
        id: true,
        nome: true,
        ativo: true,
        createdAt: true,
      },
    });

    return NextResponse.json(operador, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar operador:", error);
    return NextResponse.json(
      { error: "Erro ao criar operador" },
      { status: 500 }
    );
  }
}
