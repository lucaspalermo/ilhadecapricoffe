import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compareSync } from "bcryptjs";

// POST /api/operadores/login - Login do operador por PIN
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { error: "PIN e obrigatorio" },
        { status: 400 }
      );
    }

    const operadores = await prisma.operador.findMany({
      where: { ativo: true },
    });

    const operador = operadores.find((op) => compareSync(pin, op.pin));

    if (!operador) {
      return NextResponse.json(
        { error: "PIN invalido" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: operador.id,
      nome: operador.nome,
      perfil: operador.perfil,
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json(
      { error: "Erro ao realizar login" },
      { status: 500 }
    );
  }
}
