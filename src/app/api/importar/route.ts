import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashSync } from "bcryptjs";

interface CategoriaImport {
  nome: string;
  ordem?: number;
}

interface ProdutoImport {
  nome: string;
  preco: number;
  categoria: string; // nome da categoria (sera vinculado automaticamente)
  descricao?: string;
}

interface OperadorImport {
  nome: string;
  pin: string;
}

interface ImportPayload {
  tipo: "categorias" | "produtos" | "operadores" | "completo";
  categorias?: CategoriaImport[];
  produtos?: ProdutoImport[];
  operadores?: OperadorImport[];
}

// POST /api/importar - Importacao em massa
export async function POST(request: NextRequest) {
  try {
    const body: ImportPayload = await request.json();
    const resultado = {
      categorias: { criadas: 0, erros: [] as string[] },
      produtos: { criados: 0, erros: [] as string[] },
      operadores: { criados: 0, erros: [] as string[] },
    };

    // 1. Importar categorias
    if (body.categorias && body.categorias.length > 0) {
      for (const cat of body.categorias) {
        try {
          if (!cat.nome || cat.nome.trim() === "") {
            resultado.categorias.erros.push("Categoria sem nome ignorada");
            continue;
          }
          // Verifica se ja existe
          const existing = await prisma.categoria.findFirst({
            where: { nome: cat.nome.trim() },
          });
          if (existing) {
            resultado.categorias.erros.push(`"${cat.nome}" ja existe, ignorada`);
            continue;
          }
          await prisma.categoria.create({
            data: {
              nome: cat.nome.trim(),
              ordem: cat.ordem ?? 0,
            },
          });
          resultado.categorias.criadas++;
        } catch {
          resultado.categorias.erros.push(`Erro ao importar "${cat.nome}"`);
        }
      }
    }

    // 2. Importar produtos
    if (body.produtos && body.produtos.length > 0) {
      for (const prod of body.produtos) {
        try {
          if (!prod.nome || !prod.preco || !prod.categoria) {
            resultado.produtos.erros.push(
              `Produto "${prod.nome || "sem nome"}" - campos obrigatorios faltando (nome, preco, categoria)`
            );
            continue;
          }

          // Busca ou cria a categoria
          let categoria = await prisma.categoria.findFirst({
            where: { nome: prod.categoria.trim() },
          });
          if (!categoria) {
            categoria = await prisma.categoria.create({
              data: { nome: prod.categoria.trim() },
            });
            resultado.categorias.criadas++;
          }

          // Verifica se produto ja existe com mesmo nome e categoria
          const existing = await prisma.produto.findFirst({
            where: { nome: prod.nome.trim(), categoriaId: categoria.id },
          });
          if (existing) {
            resultado.produtos.erros.push(`"${prod.nome}" ja existe na categoria "${prod.categoria}", ignorado`);
            continue;
          }

          await prisma.produto.create({
            data: {
              nome: prod.nome.trim(),
              preco: Number(prod.preco),
              categoriaId: categoria.id,
              descricao: prod.descricao?.trim() || null,
            },
          });
          resultado.produtos.criados++;
        } catch {
          resultado.produtos.erros.push(`Erro ao importar "${prod.nome}"`);
        }
      }
    }

    // 3. Importar operadores
    if (body.operadores && body.operadores.length > 0) {
      for (const op of body.operadores) {
        try {
          if (!op.nome || !op.pin) {
            resultado.operadores.erros.push(`Operador "${op.nome || "sem nome"}" - nome e pin obrigatorios`);
            continue;
          }
          if (!/^\d{4}$/.test(op.pin)) {
            resultado.operadores.erros.push(`Operador "${op.nome}" - PIN deve ter 4 digitos`);
            continue;
          }

          await prisma.operador.create({
            data: {
              nome: op.nome.trim(),
              pin: hashSync(op.pin, 10),
            },
          });
          resultado.operadores.criados++;
        } catch {
          resultado.operadores.erros.push(`Erro ao importar "${op.nome}"`);
        }
      }
    }

    return NextResponse.json({
      sucesso: true,
      resultado,
      resumo: `${resultado.categorias.criadas} categorias, ${resultado.produtos.criados} produtos, ${resultado.operadores.criados} operadores importados`,
    });
  } catch (error) {
    console.error("Erro na importacao:", error);
    return NextResponse.json(
      { error: "Erro ao processar importacao" },
      { status: 500 }
    );
  }
}
