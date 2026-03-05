import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Criando dados iniciais...");

  // Operadores
  const admin = await prisma.operador.upsert({
    where: { id: 1 },
    update: { perfil: "ADMIN", pin: hashSync("2262", 10) },
    create: {
      nome: "Admin",
      pin: hashSync("2262", 10),
      perfil: "ADMIN",
    },
  });

  const operador2 = await prisma.operador.upsert({
    where: { id: 2 },
    update: { perfil: "OPERADOR", pin: hashSync("1234", 10) },
    create: {
      nome: "Maria",
      pin: hashSync("1234", 10),
      perfil: "OPERADOR",
    },
  });

  console.log(`Operadores criados: ${admin.nome} (PIN: 2262, ADMIN), ${operador2.nome} (PIN: 1234, OPERADOR)`);

  // Categorias
  const cafes = await prisma.categoria.upsert({
    where: { id: 1 },
    update: {},
    create: { nome: "Cafes", ordem: 1 },
  });

  const lanches = await prisma.categoria.upsert({
    where: { id: 2 },
    update: {},
    create: { nome: "Lanches", ordem: 2 },
  });

  const bebidas = await prisma.categoria.upsert({
    where: { id: 3 },
    update: {},
    create: { nome: "Bebidas", ordem: 3 },
  });

  const doces = await prisma.categoria.upsert({
    where: { id: 4 },
    update: {},
    create: { nome: "Doces", ordem: 4 },
  });

  console.log("Categorias criadas: Cafes, Lanches, Bebidas, Doces");

  // Produtos - Cafes
  const produtosCafes = [
    { nome: "Cafe Expresso", preco: 5.0, categoriaId: cafes.id },
    { nome: "Cafe com Leite", preco: 6.5, categoriaId: cafes.id },
    { nome: "Cappuccino", preco: 8.0, categoriaId: cafes.id },
    { nome: "Cafe Gelado", preco: 9.0, categoriaId: cafes.id },
    { nome: "Mocaccino", preco: 10.0, categoriaId: cafes.id },
    { nome: "Latte", preco: 8.5, categoriaId: cafes.id },
  ];

  // Produtos - Lanches
  const produtosLanches = [
    { nome: "Pao de Queijo", preco: 4.0, categoriaId: lanches.id },
    { nome: "Coxinha", preco: 6.0, categoriaId: lanches.id },
    { nome: "Misto Quente", preco: 8.0, categoriaId: lanches.id },
    { nome: "Croissant", preco: 7.5, categoriaId: lanches.id },
    { nome: "Sanduiche Natural", preco: 12.0, categoriaId: lanches.id },
  ];

  // Produtos - Bebidas
  const produtosBebidas = [
    { nome: "Suco de Laranja", preco: 8.0, categoriaId: bebidas.id },
    { nome: "Agua Mineral", preco: 3.0, categoriaId: bebidas.id },
    { nome: "Refrigerante Lata", preco: 5.0, categoriaId: bebidas.id },
    { nome: "Cha Gelado", preco: 6.0, categoriaId: bebidas.id },
  ];

  // Produtos - Doces
  const produtosDoces = [
    { nome: "Bolo de Cenoura", preco: 7.0, categoriaId: doces.id },
    { nome: "Brownie", preco: 8.0, categoriaId: doces.id },
    { nome: "Cookie", preco: 5.0, categoriaId: doces.id },
    { nome: "Torta de Limao", preco: 9.0, categoriaId: doces.id },
  ];

  const todosProdutos = [...produtosCafes, ...produtosLanches, ...produtosBebidas, ...produtosDoces];

  for (const produto of todosProdutos) {
    await prisma.produto.upsert({
      where: { id: todosProdutos.indexOf(produto) + 1 },
      update: {},
      create: produto,
    });
  }

  console.log(`${todosProdutos.length} produtos criados!`);
  console.log("\nDados iniciais criados com sucesso!");
  console.log("Use PIN 1234 (Admin) ou 5678 (Maria) para entrar no sistema.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
