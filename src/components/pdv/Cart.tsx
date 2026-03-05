"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { ItemCarrinho } from "@/types";

interface CartProps {
  itens: ItemCarrinho[];
  onUpdateQty: (produtoId: number, delta: number) => void;
  onRemove: (produtoId: number) => void;
  onClear: () => void;
  onFinalize: () => void;
  loading?: boolean;
}

export default function Cart({
  itens,
  onUpdateQty,
  onRemove,
  onClear,
  onFinalize,
  loading = false,
}: CartProps) {
  const total = itens.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Comanda</h2>
          {itens.length > 0 && (
            <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              {itens.length}
            </span>
          )}
        </div>
        {itens.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs gap-1.5 h-8 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar
          </Button>
        )}
      </div>

      {/* ── Items List ── */}
      <ScrollArea className="flex-1">
        {itens.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center h-64 px-6 animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-gray-200" />
            </div>
            <p className="text-sm font-medium text-gray-400 text-center">
              Comanda vazia
            </p>
            <p className="text-xs text-gray-300 mt-1 text-center">
              Toque em um produto para adicionar
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {itens.map((item, index) => (
              <div
                key={item.produtoId}
                className="
                  flex items-center gap-3 p-3
                  bg-gray-50/80 rounded-xl
                  animate-slide-in-right
                  transition-all duration-200
                  hover:bg-gray-100/80
                "
                style={{ animationDelay: `${index * 40}ms` }}
              >
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.nome}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    R$ {item.preco.toFixed(2)} /un.
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      item.quantidade === 1
                        ? onRemove(item.produtoId)
                        : onUpdateQty(item.produtoId, -1)
                    }
                    className="
                      w-8 h-8 flex items-center justify-center
                      rounded-lg border border-gray-200 bg-white
                      text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50
                      transition-all duration-150 press-scale
                    "
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-gray-800">
                    {item.quantidade}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.produtoId, 1)}
                    className="
                      w-8 h-8 flex items-center justify-center
                      rounded-lg border border-gray-200 bg-white
                      text-gray-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50
                      transition-all duration-150 press-scale
                    "
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subtotal */}
                <span className="text-sm font-semibold text-gray-800 w-20 text-right tabular-nums">
                  R$ {item.subtotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* ── Footer: Total + Finalize ── */}
      <div className="border-t border-gray-100 p-5">
        <Separator className="mb-4 bg-gray-100" />

        <div className="flex justify-between items-center mb-5">
          <span className="text-base font-semibold text-gray-500">Total</span>
          <span className="text-2xl font-bold text-amber-700 tabular-nums">
            R$ {total.toFixed(2)}
          </span>
        </div>

        <button
          className="
            w-full h-14 rounded-xl
            bg-gradient-to-r from-emerald-500 to-green-600
            hover:from-emerald-600 hover:to-green-700
            text-white text-base font-bold
            flex items-center justify-center gap-2.5
            shadow-lg shadow-emerald-500/20
            transition-all duration-200
            press-scale
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
            disabled:from-gray-300 disabled:to-gray-400
          "
          disabled={itens.length === 0 || loading}
          onClick={onFinalize}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CheckCircle className="w-5 h-5" />
          )}
          {loading ? "Registrando..." : "Finalizar Venda"}
        </button>
      </div>
    </div>
  );
}
