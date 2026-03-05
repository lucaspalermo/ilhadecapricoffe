const XLSX = require('C:/Users/lsimp/cafeteria-pdv/node_modules/xlsx');
const path = require('path');

const FILES = [
  'C:/Users/lsimp/Downloads/FATURAMENTO 2026.xlsx',
  'C:/Users/lsimp/Downloads/PLANILHA FINANCEIRA.xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI.xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI (1).xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI (2).xlsx',
];

function readFile(filePath) {
  console.log('\n' + '='.repeat(80));
  console.log('ARQUIVO: ' + filePath);
  console.log('='.repeat(80));

  let workbook;
  try {
    workbook = XLSX.readFile(filePath, { cellStyles: true, cellFormulas: true, sheetStubs: true });
  } catch (e) {
    console.log('ERRO ao abrir arquivo: ' + e.message);
    return;
  }

  const sheetNames = workbook.SheetNames;
  console.log('Abas encontradas (' + sheetNames.length + '): ' + sheetNames.join(', '));

  for (const sheetName of sheetNames) {
    console.log('\n' + '-'.repeat(60));
    console.log('ABA: "' + sheetName + '"');
    console.log('-'.repeat(60));

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.log('(aba vazia ou inválida)');
      continue;
    }

    // Get full range
    const range = sheet['!ref'];
    console.log('Range: ' + (range || '(sem dados)'));
    if (!range) continue;

    // Convert to array of arrays (raw)
    const rawData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false,
    });

    if (!rawData || rawData.length === 0) {
      console.log('(sem linhas de dados)');
      continue;
    }

    console.log('Total de linhas: ' + rawData.length);
    console.log('\n--- TODOS OS DADOS DA ABA ---');

    rawData.forEach((row, rowIndex) => {
      // Skip completely empty rows
      const hasData = row.some(cell => cell !== '' && cell !== null && cell !== undefined);
      if (!hasData) return;

      const rowNum = rowIndex + 1;
      const cells = row.map((cell, colIndex) => {
        const colLetter = String.fromCharCode(65 + colIndex);
        return colLetter + (rowNum) + ':' + String(cell).trim();
      }).filter(c => !c.endsWith(':'));

      if (cells.length > 0) {
        console.log('Linha ' + rowNum + ' | ' + cells.join(' | '));
      }
    });

    // Also try to detect product/price patterns
    console.log('\n--- ANÁLISE: POSSÍVEIS PRODUTOS E PREÇOS ---');
    const priceRegex = /R?\$?\s*\d+[,.]?\d*|\d+[,.]\d{2}/;
    const productKeywords = /(produto|item|descrição|lanche|bebida|salgado|doce|café|suco|pão|coxinha|pastel|empada|bolo|misto|x-|combo|prato|refeição|almoço|jantar|sorvete|vitamina|água|refrigerante|sanduba|bauru|beirute|croissant|crepe|tapioca|açaí|iogurte|wrap|salada|sopa|pizza|hamburguer|burger|espetinho|churros|waffle|hotdog)/i;

    let productsFound = 0;
    rawData.forEach((row, rowIndex) => {
      const rowStr = row.map(c => String(c)).join(' | ');
      const hasPrice = priceRegex.test(rowStr);
      const hasProduct = productKeywords.test(rowStr);

      if (hasPrice || hasProduct) {
        const rowNum = rowIndex + 1;
        console.log('  * Linha ' + rowNum + ': ' + rowStr);
        productsFound++;
      }
    });

    if (productsFound === 0) {
      console.log('  (nenhum padrão de produto/preço detectado automaticamente)');
    }
  }
}

// Run
for (const file of FILES) {
  readFile(file);
}

console.log('\n' + '='.repeat(80));
console.log('LEITURA CONCLUÍDA');
console.log('='.repeat(80));
