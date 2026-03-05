/**
 * Extrai itens do DRE (Demonstrativo Resultado do Exercício) - ILHA DE CAPRI
 * Foca apenas na estrutura de categorias e fornecedores por produto
 */
const XLSX = require('C:/Users/lsimp/cafeteria-pdv/node_modules/xlsx');

const demoFile = 'C:/Users/lsimp/Downloads/Demonstrativo Financeiro ILHA DE CAPRI.xlsx';
const planilhaFile = 'C:/Users/lsimp/Downloads/PLANILHA FINANCEIRA.xlsx';

function readDRE(filePath) {
  const wb = XLSX.readFile(filePath);
  console.log('\n' + '='.repeat(80));
  console.log('ARQUIVO: ' + filePath.split('/').pop());
  console.log('Abas: ' + wb.SheetNames.join(', '));

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) continue;

    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false, raw: false });

    console.log('\n--- ABA: "' + sheetName + '" ---');
    console.log('(mostrando colunas A e B = CATEGORIA/NOME + VALOR JAN-26)');
    console.log('-'.repeat(60));

    rows.forEach((row, i) => {
      const col_a = String(row[0] || '').trim();
      const col_b = String(row[1] || '').trim();
      if (!col_a && !col_b) return;
      // Print only rows where col_a has meaningful content
      if (col_a && col_a !== '%' && col_a !== 'VALOR R$') {
        console.log('L' + (i+1) + ' | A: ' + col_a.padEnd(60) + ' | B(Jan-26): ' + col_b);
      }
    });
  }
}

function readPlanilhaTipoColumn(filePath) {
  const wb = XLSX.readFile(filePath);
  console.log('\n' + '='.repeat(80));
  console.log('ARQUIVO: ' + filePath.split('/').pop());
  console.log('(Extraindo coluna TIPO de cada aba - categorias de despesas/produtos)');

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || !ws['!ref']) continue;
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false, raw: false });

    console.log('\n--- ABA: "' + sheetName + '" ---');

    // Find column index for "TIPO" header
    let tipoCol = -1;
    let fornecedorCol = -1;
    let valorCol = -1;
    let dataCol = -1;

    rows.forEach((row, i) => {
      row.forEach((cell, j) => {
        const c = String(cell).toUpperCase().trim();
        if (c === 'TIPO') tipoCol = j;
        if (c === 'FORNECEDOR') fornecedorCol = j;
        if (c === 'VALOR') valorCol = j;
        if (c === 'DATA') dataCol = j;
      });
    });

    console.log('Colunas encontradas: TIPO=' + tipoCol + ', FORNECEDOR=' + fornecedorCol + ', VALOR=' + valorCol + ', DATA=' + dataCol);

    if (tipoCol < 0) {
      console.log('(coluna TIPO não encontrada)');
      continue;
    }

    // Collect all unique TIPO values and their totals
    const tipos = {};
    const fornecedoresPorTipo = {};

    rows.forEach((row, i) => {
      const tipo = String(row[tipoCol] || '').trim();
      const fornecedor = fornecedorCol >= 0 ? String(row[fornecedorCol] || '').trim() : '';
      const valorStr = valorCol >= 0 ? String(row[valorCol] || '').trim() : '';
      const valorNum = parseFloat(valorStr.replace(/[R$\s,]/g, '').replace('.','').replace(',','.')) || 0;

      if (!tipo || tipo === 'TIPO') return;

      if (!tipos[tipo]) {
        tipos[tipo] = { count: 0, total: 0 };
        fornecedoresPorTipo[tipo] = new Set();
      }
      tipos[tipo].count++;
      tipos[tipo].total += Math.abs(valorNum);
      if (fornecedor) fornecedoresPorTipo[tipo].add(fornecedor);
    });

    console.log('\nCATEGORIAS/TIPOS encontrados:');
    Object.entries(tipos).sort((a,b) => b[1].total - a[1].total).forEach(([tipo, stats]) => {
      const forn = [...fornecedoresPorTipo[tipo]].join(', ');
      console.log('  [' + tipo + '] - ' + stats.count + ' registros | Total: R$ ' + stats.total.toFixed(2));
      if (forn) console.log('    Fornecedores: ' + forn);
    });
  }
}

readDRE(demoFile);
readPlanilhaTipoColumn(planilhaFile);

console.log('\n\nCONCLUÍDO');
