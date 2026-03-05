"use client";

import { useCallback, useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  RefreshCw,
  Wifi,
  Clock,
  CreditCard,
  Banknote,
  Smartphone,
  Store,
  Truck,
} from "lucide-react";

interface UltimaVenda {
  id: number;
  total: number;
  formaPagamento: string;
  origem: string;
  createdAt: string;
  operador: string;
  itens: string;
}

interface HojeData {
  totalVendas: number;
  faturamento: number;
  ticketMedio: number;
  porFormaPagamento: { forma: string; total: number; count: number }[];
  porOrigem: { origem: string; total: number; count: number }[];
  porHora: { hora: number; total: number; count: number }[];
  ultimasVendas: UltimaVenda[];
  atualizadoEm: string;
}

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const FORMA_LABEL: Record<string, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_DEBITO: "Débito",
  CARTAO_CREDITO: "Crédito",
};

const FORMA_COLOR: Record<string, string> = {
  DINHEIRO: "bg-green-100 text-green-700 border-green-200",
  PIX:      "bg-teal-100 text-teal-700 border-teal-200",
  CARTAO_DEBITO:  "bg-blue-100 text-blue-700 border-blue-200",
  CARTAO_CREDITO: "bg-purple-100 text-purple-700 border-purple-200",
};

const FORMA_ICON: Record<string, React.ReactNode> = {
  DINHEIRO:       <Banknote className="w-4 h-4" />,
  PIX:            <Smartphone className="w-4 h-4" />,
  CARTAO_DEBITO:  <CreditCard className="w-4 h-4" />,
  CARTAO_CREDITO: <CreditCard className="w-4 h-4" />,
};

const ORIGEM_LABEL: Record<string, string> = {
  BALCAO: "Balcão",
  IFOOD:  "iFood",
  KEETA:  "Keeta",
  "99FOOD": "99Food",
};

export default function HojePage() {
  const [data, setData] = useState<HojeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch("/api/relatorios/hoje");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
      setCountdown(30);
    }
  }, []);

  // Auto-refresh a cada 30s
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown visual
  useEffect(() => {
    const tick = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 30)), 1000);
    return () => clearInterval(tick);
  }, []);

  const horaAtual = new Date().getHours();
  const horasComVendas = data?.porHora.filter((h) => h.count > 0) ?? [];
  const maxHoraTotal = Math.max(...(data?.porHora.map((h) => h.total) ?? [1]), 1);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          <p className="text-sm">Carregando dados do dia...</p>
        </div>
      </div>
    );
  }

  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long", day: "2-digit", month: "long",
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Vendas de Hoje</h1>
            <p className="text-sm text-gray-400 capitalize">{hoje}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 text-xs text-green-700 font-medium">
            <Wifi className="w-3.5 h-3.5" />
            Ao vivo · {countdown}s
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Faturamento */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white/80">Faturamento</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold">{fmt(data?.faturamento ?? 0)}</p>
          <p className="text-xs text-white/70 mt-1">total do dia</p>
        </div>

        {/* Vendas */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Vendas realizadas</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data?.totalVendas ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">transações finalizadas</p>
        </div>

        {/* Ticket médio */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Ticket Médio</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{fmt(data?.ticketMedio ?? 0)}</p>
          <p className="text-xs text-gray-400 mt-1">por venda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formas de pagamento */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Por Forma de Pagamento</h2>
          {(data?.porFormaPagamento.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma venda ainda</p>
          ) : (
            <div className="space-y-3">
              {data?.porFormaPagamento
                .sort((a, b) => b.total - a.total)
                .map((item) => {
                  const pct = data.faturamento > 0 ? (item.total / data.faturamento) * 100 : 0;
                  return (
                    <div key={item.forma}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 text-xs font-medium border rounded-lg px-2 py-0.5 ${FORMA_COLOR[item.forma] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {FORMA_ICON[item.forma]}
                            {FORMA_LABEL[item.forma] ?? item.forma}
                          </span>
                          <span className="text-xs text-gray-400">{item.count} venda{item.count !== 1 ? "s" : ""}</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{fmt(item.total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Por origem */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Por Canal de Venda</h2>
          {(data?.porOrigem.length ?? 0) === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nenhuma venda ainda</p>
          ) : (
            <div className="space-y-3">
              {data?.porOrigem
                .sort((a, b) => b.total - a.total)
                .map((item) => {
                  const pct = data.faturamento > 0 ? (item.total / data.faturamento) * 100 : 0;
                  const isBalcao = item.origem === "BALCAO";
                  return (
                    <div key={item.origem}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 text-xs font-medium border rounded-lg px-2 py-0.5 ${isBalcao ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            {isBalcao ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                            {ORIGEM_LABEL[item.origem] ?? item.origem}
                          </span>
                          <span className="text-xs text-gray-400">{item.count} venda{item.count !== 1 ? "s" : ""} · {pct.toFixed(0)}%</span>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{fmt(item.total)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isBalcao ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Gráfico por hora */}
      {horasComVendas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Faturamento por Hora</h2>
          <div className="flex items-end gap-1 h-20">
            {data?.porHora.map((h) => {
              const height = h.total > 0 ? Math.max((h.total / maxHoraTotal) * 100, 8) : 0;
              const isNow = h.hora === horaAtual;
              return (
                <div key={h.hora} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {h.total > 0 && (
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10">
                      <div className="bg-gray-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                        {fmt(h.total)}
                      </div>
                    </div>
                  )}
                  <div className="w-full flex items-end" style={{ height: "72px" }}>
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isNow ? "bg-amber-500" : h.total > 0 ? "bg-amber-200" : "bg-gray-100"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className={`text-[9px] ${isNow ? "text-amber-600 font-bold" : "text-gray-300"}`}>
                    {h.hora}h
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Últimas vendas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">Últimas Vendas</h2>
          {data?.atualizadoEm && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              Atualizado às {new Date(data.atualizadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>

        {(data?.ultimasVendas.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <ShoppingBag className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">Nenhuma venda hoje ainda</p>
            <p className="text-xs text-gray-400 mt-1">As vendas aparecerão aqui em tempo real</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data?.ultimasVendas.map((v) => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{v.itens || "—"}</p>
                    <p className="text-xs text-gray-400">
                      {v.operador} · {new Date(v.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className={`text-xs font-medium border rounded-lg px-2 py-0.5 ${FORMA_COLOR[v.formaPagamento] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {FORMA_LABEL[v.formaPagamento] ?? v.formaPagamento}
                  </span>
                  <span className="text-sm font-bold text-gray-900 w-20 text-right">{fmt(v.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
