/**
 * Extrai APENAS dados relevantes para produtos/cardápio das planilhas
 * Foca em: nomes de itens, categorias, preços
 */
const XLSX = require('C:/Users/lsimp/cafeteria-pdv/node_modules/xlsx');

const FILES = [
  'C:/Users/lsimp/Downloads/FATURAMENTO 2026.xlsx',
  'C:/Users/lsimp/Downloads/PLANILHA FINANCEIRA.xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI.xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI (1).xlsx',
  'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI (2).xlsx',
];

function getAllRows(filePath) {
  let workbook;
  try {
    workbook = XLSX.readFile(filePath);
  } catch (e) {
    return null;
  }
  const result = {};
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet || !sheet['!ref']) continue;
    result[sheetName] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    });
  }
  return { sheets: result, names: workbook.SheetNames };
}

// ============================
// PRINT ALL ROWS - SHORT FORMAT
// ============================
for (const filePath of FILES) {
  const fname = filePath.split('/').pop();
  console.log('\n' + '█'.repeat(70));
  console.log('ARQUIVO: ' + fname);
  console.log('█'.repeat(70));

  const data = getAllRows(filePath);
  if (!data) { console.log('ERRO ao abrir'); continue; }

  console.log('Abas: ' + data.names.join(', '));

  for (const [sheetName, rows] of Object.entries(data.sheets)) {
    console.log('\n  ┌─ ABA: "' + sheetName + '" (' + rows.length + ' linhas) ─────────────────────');
    rows.forEach((row, i) => {
      // Only print non-empty rows
      const cells = row.map(c => String(c).trim()).filter(c => c !== '' && c !== '-');
      if (cells.length === 0) return;
      console.log('  │ L' + (i+1) + ': ' + cells.join(' | '));
    });
    console.log('  └─────────────────────────────────────────────────────────────────');
  }
}

console.log('\n\n' + '='.repeat(70));
console.log('CONCLUÍDO');
