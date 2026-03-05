const XLSX = require('xlsx');

const wb = XLSX.readFile('C:/Users/lsimp/Downloads/PLANILHA FINANCEIRA.xlsx');

function excelDateToISO(serial) {
  if (typeof serial !== 'number') return null;
  const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return d.toISOString().split('T')[0];
}

for (const mes of wb.SheetNames) {
  const ws = wb.Sheets[mes];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const despesas = [];
  const receitas = [];

  for (const r of rows) {
    const debito = parseFloat(r[0]) || 0;
    const credito = parseFloat(r[1]) || 0;
    const data = excelDateToISO(r[2]);
    const saida = parseFloat(r[10]) || 0;
    const entrada = parseFloat(r[9]) || 0;
    const fornecedor = String(r[7]).trim();
    const tipo = String(r[12]).trim();

    // Expenses
    if (debito > 0 && saida > 0 && fornecedor && fornecedor !== 'FORNECEDOR' && fornecedor !== 'SALDO ANTERIOR' && data) {
      despesas.push({ data, fornecedor, valor: saida, tipo });
    }
    // Receipts
    if (credito > 0 && entrada > 0 && data && tipo === 'RECEBIMENTOS') {
      receitas.push({ data, valor: entrada });
    }
  }

  console.log('\n=== ' + mes + ' ===');
  console.log('DESPESAS (' + despesas.length + '):');
  despesas.forEach(d => console.log('  ' + d.data + ' | R$' + d.valor.toFixed(2).padStart(9) + ' | ' + d.tipo.substring(0,35).padEnd(35) + ' | ' + d.fornecedor.substring(0,40)));
  console.log('RECEITAS (' + receitas.length + '):');
  receitas.forEach(r => console.log('  ' + r.data + ' | R$' + r.valor.toFixed(2)));

  const totalDesp = despesas.reduce((a, d) => a + d.valor, 0);
  const totalRec = receitas.reduce((a, r) => a + r.valor, 0);
  console.log('  TOTAL DESPESAS: R$ ' + totalDesp.toFixed(2));
  console.log('  TOTAL RECEITAS BANCO: R$ ' + totalRec.toFixed(2));
}
