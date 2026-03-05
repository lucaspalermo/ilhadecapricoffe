"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import type { VendaResponse } from "@/types";

interface ReceiptModalProps {
  venda: VendaResponse;
  onClose: () => void;
}

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_DEBITO: "Cartão Débito",
  CARTAO_CREDITO: "Cartão Crédito",
};

function fmt(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ReceiptModal({ venda, onClose }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const printContents = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cupom #${venda.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              width: 80mm;
              padding: 8px;
              color: #000;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; }
            .item-name { flex: 1; }
            .item-qty { width: 28px; text-align: center; }
            .item-unit { width: 60px; text-align: right; }
            .item-sub { width: 64px; text-align: right; }
            .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 4px; }
          </style>
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

  const data = new Date(venda.createdAt);
  const dataFormatada = data.toLocaleDateString("pt-BR");
  const horaFormatada = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Cupom da Venda</h2>
            <button
              onClick={onClose}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cupom preview */}
          <div className="overflow-auto p-5">
            <div
              ref={printRef}
              className="mx-auto w-full max-w-[280px] rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 font-mono text-xs text-gray-800"
            >
              <div className="center bold" style={{ textAlign: "center", fontWeight: "bold" }}>
                ILHA DE CAPRI
              </div>
              <div className="center" style={{ textAlign: "center" }}>
                Cafeteria e Restaurante
              </div>

              <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

              <div className="row" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Cupom #{venda.id}</span>
                <span>{dataFormatada} {horaFormatada}</span>
              </div>
              <div>Operador: {venda.operador.nome}</div>

              <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

              <div className="row bold" style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
                <span className="item-name" style={{ flex: 1 }}>ITEM</span>
                <span className="item-qty" style={{ width: "28px", textAlign: "center" }}>QTD</span>
                <span className="item-unit" style={{ width: "60px", textAlign: "right" }}>UNIT</span>
                <span className="item-sub" style={{ width: "64px", textAlign: "right" }}>TOTAL</span>
              </div>

              <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

              {venda.itens.map((item) => (
                <div
                  key={item.id}
                  className="row"
                  style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}
                >
                  <span className="item-name" style={{ flex: 1, paddingRight: "4px", wordBreak: "break-word" }}>
                    {item.produto.nome}
                  </span>
                  <span className="item-qty" style={{ width: "28px", textAlign: "center" }}>
                    {item.quantidade}
                  </span>
                  <span className="item-unit" style={{ width: "60px", textAlign: "right" }}>
                    {fmt(item.precoUnitario)}
                  </span>
                  <span className="item-sub" style={{ width: "64px", textAlign: "right" }}>
                    {fmt(item.subtotal)}
                  </span>
                </div>
              ))}

              <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

              <div
                className="total-row"
                style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px", marginTop: "4px" }}
              >
                <span>TOTAL:</span>
                <span>{fmt(venda.total)}</span>
              </div>
              <div>Pagamento: {FORMA_PAGAMENTO_LABEL[venda.formaPagamento] ?? venda.formaPagamento}</div>

              <div className="divider" style={{ borderTop: "1px dashed #000", margin: "6px 0" }} />

              <div className="center" style={{ textAlign: "center" }}>Obrigado pela preferência!</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t px-5 py-4">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Fechar
            </button>
            <button
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
            >
              <Printer size={16} />
              Imprimir Cupom
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
