"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import ProductGrid from "@/components/pdv/ProductGrid";
import Cart from "@/components/pdv/Cart";
import PaymentModal from "@/components/pdv/PaymentModal";
import { Badge } from "@/components/ui/badge";
import { Store, CheckCircle, XCircle } from "lucide-react";
import type {
  ItemCarrinho,
  FormaPagamento,
  OperadorLogado,
  CaixaAberto,
} from "@/types";

interface Produto {
  id: number;
  nome: string;
  preco: number;
  imagem: string | null;
  categoriaId: number;
}

interface Categoria {
  id: number;
  nome: string;
}

export default function PdvPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [caixa, setCaixa] = useState<CaixaAberto | null>(null);
  const [operador, setOperador] = useState<OperadorLogado | null>(null);

  /* ── Data Loading ── */
  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes, caixaRes] = await Promise.all([
        fetch("/api/categorias"),
        fetch("/api/produtos"),
        fetch("/api/caixa"),
      ]);
      const cats = await catRes.json();
      const prods = await prodRes.json();
      setCategorias(Array.isArray(cats) ? cats : []);
      setProdutos(Array.isArray(prods) ? prods : []);

      if (caixaRes.ok) {
        const caixaData = await caixaRes.json();
        if (caixaData && caixaData.id) {
          setCaixa(caixaData);
          sessionStorage.setItem("caixa", JSON.stringify(caixaData));
        }
      }
    } catch {
      toast.error("Erro ao carregar dados");
    }
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("operador");
    if (stored) setOperador(JSON.parse(stored));

    const storedCaixa = sessionStorage.getItem("caixa");
    if (storedCaixa) setCaixa(JSON.parse(storedCaixa));

    loadData();
  }, [loadData]);

  /* ── Cart State Management ── */
  const addItem = (produto: Produto) => {
    setItens((prev) => {
      const existing = prev.find((i) => i.produtoId === produto.id);
      if (existing) {
        return prev.map((i) =>
          i.produtoId === produto.id
            ? {
                ...i,
                quantidade: i.quantidade + 1,
                subtotal: (i.quantidade + 1) * i.preco,
              }
            : i
        );
      }
      return [
        ...prev,
        {
          produtoId: produto.id,
          nome: produto.nome,
          preco: produto.preco,
          quantidade: 1,
          subtotal: produto.preco,
        },
      ];
    });
  };

  const updateQty = (produtoId: number, delta: number) => {
    setItens((prev) =>
      prev.map((i) =>
        i.produtoId === produtoId
          ? {
              ...i,
              quantidade: i.quantidade + delta,
              subtotal: (i.quantidade + delta) * i.preco,
            }
          : i
      )
    );
  };

  const removeItem = (produtoId: number) => {
    setItens((prev) => prev.filter((i) => i.produtoId !== produtoId));
  };

  const total = itens.reduce((sum, i) => sum + i.subtotal, 0);

  /* ── Payment Handler ── */
  const handlePayment = async (forma: FormaPagamento) => {
    if (!caixa) {
      toast.error("Abra o caixa antes de registrar vendas!");
      setShowPayment(false);
      return;
    }
    if (!operador) {
      toast.error("Operador nao identificado");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/vendas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caixaId: caixa.id,
          operadorId: operador.id,
          formaPagamento: forma,
          origem: "BALCAO",
          itens: itens.map((i) => ({
            produtoId: i.produtoId,
            quantidade: i.quantidade,
            precoUnitario: i.preco,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao registrar venda");
        return;
      }

      toast.success(`Venda de R$ ${total.toFixed(2)} registrada!`);
      setItens([]);
      setShowPayment(false);
    } catch {
      toast.error("Erro ao registrar venda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full bg-gray-50/50">
      {/* ══════════════════════════════════════════════ */}
      {/* ── Left Side: Top Bar + Product Grid ──────── */}
      {/* ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ── Top Bar ── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
              <Store className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                Ponto de Venda
              </h1>
              {operador && (
                <p className="text-xs text-gray-400 leading-tight">
                  {operador.nome}
                </p>
              )}
            </div>
          </div>

          {/* Caixa Status Badge */}
          <div className="flex items-center gap-2">
            {caixa ? (
              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 gap-1.5 px-3 py-1 text-xs font-medium rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Caixa #{caixa.id} aberto
              </Badge>
            ) : (
              <Badge className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 gap-1.5 px-3 py-1 text-xs font-medium rounded-full">
                <XCircle className="w-3.5 h-3.5" />
                Caixa fechado
              </Badge>
            )}
          </div>
        </div>

        {/* ── Product Grid ── */}
        <div className="flex-1 overflow-hidden">
          <ProductGrid
            categorias={categorias}
            produtos={produtos}
            onAddItem={addItem}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── Right Side: Cart Sidebar ──────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <div className="w-[340px] lg:w-[380px] shrink-0 border-l border-gray-200 shadow-sm">
        <Cart
          itens={itens}
          onUpdateQty={updateQty}
          onRemove={removeItem}
          onClear={() => setItens([])}
          onFinalize={() => setShowPayment(true)}
          loading={loading}
        />
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* ── Payment Modal ─────────────────────────── */}
      {/* ══════════════════════════════════════════════ */}
      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        itens={itens}
        total={total}
        onConfirm={handlePayment}
        loading={loading}
      />
    </div>
  );
}
