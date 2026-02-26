"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  Banknote,
  Smartphone,
  CreditCard,
  Wallet,
  Loader2,
} from "lucide-react";
import type { FormaPagamento, ItemCarrinho } from "@/types";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  itens: ItemCarrinho[];
  total: number;
  onConfirm: (forma: FormaPagamento) => void;
  loading: boolean;
}

const formasPagamento: {
  value: FormaPagamento;
  label: string;
  icon: React.ElementType;
  gradient: string;
  shadow: string;
}[] = [
  {
    value: "DINHEIRO",
    label: "Dinheiro",
    icon: Banknote,
    gradient: "from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700",
    shadow: "shadow-emerald-500/25",
  },
  {
    value: "PIX",
    label: "PIX",
    icon: Smartphone,
    gradient: "from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700",
    shadow: "shadow-teal-500/25",
  },
  {
    value: "CARTAO_DEBITO",
    label: "Debito",
    icon: CreditCard,
    gradient: "from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700",
    shadow: "shadow-blue-500/25",
  },
  {
    value: "CARTAO_CREDITO",
    label: "Credito",
    icon: Wallet,
    gradient: "from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700",
    shadow: "shadow-purple-500/25",
  },
];

export default function PaymentModal({
  open,
  onClose,
  itens,
  total,
  onConfirm,
  loading,
}: PaymentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-amber-600" />
            </div>
            Finalizar Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* ── Order Summary ── */}
          <div className="bg-gray-50 rounded-2xl p-5 animate-fade-in-up">
            <div className="space-y-2 mb-4">
              {itens.map((item) => (
                <div
                  key={item.produtoId}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-600">
                    <span className="font-medium text-gray-800">
                      {item.quantidade}x
                    </span>{" "}
                    {item.nome}
                  </span>
                  <span className="font-medium text-gray-700 tabular-nums">
                    R$ {item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <Separator className="bg-gray-200" />

            <div className="flex justify-between items-center mt-4">
              <span className="text-base font-semibold text-gray-500">
                Total
              </span>
              <span className="text-2xl font-bold text-amber-700 tabular-nums">
                R$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* ── Payment Method Buttons ── */}
          <div className="grid grid-cols-2 gap-3">
            {formasPagamento.map((forma) => {
              const Icon = forma.icon;
              return (
                <button
                  key={forma.value}
                  onClick={() => onConfirm(forma.value)}
                  disabled={loading}
                  className={`
                    h-24 rounded-2xl
                    bg-gradient-to-br ${forma.gradient}
                    text-white
                    flex flex-col items-center justify-center gap-2
                    shadow-lg ${forma.shadow}
                    press-scale
                    transition-all duration-200
                    hover:brightness-110
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
                    focus:outline-none focus:ring-2 focus:ring-white/30
                  `}
                >
                  {loading ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <Icon className="w-7 h-7" />
                  )}
                  <span className="text-sm font-bold tracking-wide">
                    {forma.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
