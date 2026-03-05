const XLSX = require('C:/Users/lsimp/cafeteria-pdv/node_modules/xlsx');

const FILES = [
  'C:/Users/lsimp/Downloads/FATURAMENTO 2026.xlsx',
  'C:/Users/lsimp/Downloads/PLANILHA FINANCEIRA.xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI.xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI (1).xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI (2).xlsx',
];

// Keywords that indicate food/beverage items or menu categories
const FOOD_KEYWORDS = [
  'coxinha','croissant','salgado','marmita','suco','pão','bolo','sanduiche','sanduíche',
  'salada','queijo','alface','alimento','refeição','almoço','jantar','café','lanche',
  'doce','pastel','empada','kilo','kg','buffet','prato','combo','bebida','água','refrigerante',
  'coca','guaraná','suco','vitamina','açaí','iogurte','sorvete','hamburguer','burger','pizza',
  'tapioca','wrap','crepe','waffle','hotdog','espetinho','churros','frango','carne','peixe',
  'vegano','fit','light','integral','natural','caseiro','artesanal','gourmet',
  'misto','quente','frio','gelado','quilo','bandeja','porção','porcao','individual',
  'pão de mel','strogonoff','lasanha','nhoque','risoto','fritas','batata',
  'mousse','brigadeiro','pudim','torta','cheesecake','brownie','cookie',
];

const PRICE_REGEX = /R?\$?\s*\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?/;
const NUMERIC_PRICE = /^\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?$/;

console.log('='.repeat(80));
console.log('EXTRAÇÃO DE PRODUTOS / ITENS DO CARDÁPIO');
console.log('='.repeat(80));

const allProducts = [];

function isLikelyPrice(val) {
  if (!val) return false;
  const str = String(val).trim();
  // Is a number between 1 and 9999 (reasonable price range)
  const num = parseFloat(str.replace(',', '.'));
  return !isNaN(num) && num > 0.5 && num < 9999;
}

function containsFoodKeyword(str) {
  const lower = str.toLowerCase();
  return FOOD_KEYWORDS.some(kw => lower.includes(kw));
}

for (const filePath of FILES) {
  console.log('\n' + '='.repeat(80));
  console.log('ARQUIVO: ' + filePath);
  console.log('='.repeat(80));

  let workbook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch (e) {
    console.log('ERRO: ' + e.message);
    continue;
  }

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;

    const raw = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    });

    console.log('\n--- ABA: "' + sheetName + '" ---');

    // Print ALL rows so nothing is missed
    raw.forEach((row, ri) => {
      const rowStr = row.map(c => String(c).trim()).join(' | ');
      if (!rowStr.replace(/\|/g, '').trim()) return;
      const lineNum = ri + 1;
      console.log('L' + lineNum + ': ' + rowStr);
    });

    // Detect product/price pairs
    console.log('\n  [PRODUTOS DETECTADOS NA ABA "' + sheetName + '"]');
    let found = 0;
    raw.forEach((row, ri) => {
      const cells = row.map(c => String(c).trim());
      const fullText = cells.join(' ');

      // Check if row mentions food or has a price pattern with a descriptive name
      const hasFoodWord = containsFoodKeyword(fullText);
      const hasPrice = PRICE_REGEX.test(fullText);

      if (hasFoodWord || (hasPrice && fullText.length > 5)) {
        // Try to identify which cell is the product name and which is the price
        let name = '';
        let price = '';
        cells.forEach((cell, ci) => {
          if (cell.length > 2 && isNaN(parseFloat(cell.replace(',','.')))) {
            if (!name && !cell.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) {
              name = cell;
            }
          }
          if (isLikelyPrice(cell)) {
            price = price || cell;
          }
        });
        if (name || price) {
          const entry = { arquivo: filePath.split('/').pop(), aba: sheetName, linha: ri+1, nome: name, preco: price, raw: fullText };
          allProducts.push(entry);
          console.log('  PRODUTO L' + (ri+1) + ': NOME="' + name + '" | PRECO="' + price + '" | LINHA_COMPLETA: ' + fullText.substring(0, 120));
          found++;
        }
      }
    });
    if (found === 0) console.log('  (nenhum produto/preço detectado)');
  }
}

// SUMMARY TABLE
console.log('\n\n' + '='.repeat(80));
console.log('RESUMO: TODOS OS PRODUTOS ENCONTRADOS (' + allProducts.length + ' registros)');
console.log('='.repeat(80));
const byFile = {};
allProducts.forEach(p => {
  const key = p.arquivo + ' > ' + p.aba;
  if (!byFile[key]) byFile[key] = [];
  byFile[key].push(p);
});
Object.entries(byFile).forEach(([key, items]) => {
  console.log('\n[' + key + '] - ' + items.length + ' item(ns)');
  items.forEach(p => {
    console.log('  L' + p.linha + ' | ' + p.nome + (p.preco ? ' | R$ ' + p.preco : ''));
  });
});
