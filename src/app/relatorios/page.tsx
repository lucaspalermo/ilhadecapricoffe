"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Store,
  Trophy,
  Medal,
  Package,
  Hash,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PorFormaPagamento {
  forma: string;
  total: number;
  count: number;
}

interface PorOrigem {
  origem: string;
  total: number;
  count: number;
}

interface TopProduto {
  produtoId: number;
  nome: string;
  quantidade: number;
  total: number;
}

interface VendaPorDia {
  data: string;
  total: number;
  count: number;
}

interface RelatorioData {
  totalVendas: number;
  faturamento: number;
  ticketMedio: number;
  porFormaPagamento: PorFormaPagamento[];
  porOrigem: PorOrigem[];
  topProdutos: TopProduto[];
  vendasPorDia: VendaPorDia[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

const formatFullDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

function todayStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

function firstDayOfMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/* ------------------------------------------------------------------ */
/*  Payment method display config                                     */
/* ------------------------------------------------------------------ */

const formaPagamentoConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  DINHEIRO: {
    label: "Dinheiro",
    color: "text-green-700",
    bg: "bg-green-500",
    border: "border-green-200",
    icon: <Banknote className="w-4 h-4" />,
  },
  PIX: {
    label: "PIX",
    color: "text-blue-700",
    bg: "bg-blue-500",
    border: "border-blue-200",
    icon: <Smartphone className="w-4 h-4" />,
  },
  CARTAO_DEBITO: {
    label: "Cartao Debito",
    color: "text-purple-700",
    bg: "bg-purple-500",
    border: "border-purple-200",
    icon: <CreditCard className="w-4 h-4" />,
  },
  CARTAO_CREDITO: {
    label: "Cartao Credito",
    color: "text-orange-700",
    bg: "bg-orange-500",
    border: "border-orange-200",
    icon: <CreditCard className="w-4 h-4" />,
  },
};

/* ------------------------------------------------------------------ */
/*  Origin display config                                             */
/* ------------------------------------------------------------------ */

const origemConfig: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  BALCAO: {
    label: "Balcao",
    color: "text-amber-700",
    bg: "bg-amber-500",
    border: "border-amber-200",
    icon: <Store className="w-4 h-4" />,
  },
  IFOOD: {
    label: "iFood",
    color: "text-red-700",
    bg: "bg-red-500",
    border: "border-red-200",
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  KEETA: {
    label: "Keeta",
    color: "text-emerald-700",
    bg: "bg-emerald-500",
    border: "border-emerald-200",
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  "99FOOD": {
    label: "99Food",
    color: "text-yellow-700",
    bg: "bg-yellow-500",
    border: "border-yellow-200",
    icon: <ShoppingCart className="w-4 h-4" />,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RelatorioData | null>(null);
  const [inicio, setInicio] = useState(firstDayOfMonthStr);
  const [fim, setFim] = useState(todayStr);

  const loadData = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/relatorios/vendas?inicio=${startDate}&fim=${endDate}`
      );
      if (!res.ok) throw new Error();
      const json: RelatorioData = await res.json();
      setData(json);
    } catch {
      toast.error("Erro ao carregar relatorio de vendas");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(inicio, fim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    if (!inicio || !fim) {
      toast.error("Selecione as datas de inicio e fim");
      return;
    }
    if (inicio > fim) {
      toast.error("A data de inicio deve ser anterior a data de fim");
      return;
    }
    loadData(inicio, fim);
  };

  /* ---- derived values ---- */
  const maxPagamento = data
    ? Math.max(...data.porFormaPagamento.map((p) => p.total), 1)
    : 1;
  const maxOrigem = data
    ? Math.max(...data.porOrigem.map((o) => o.total), 1)
    : 1;
  const maxDia = data
    ? Math.max(...data.vendasPorDia.map((d) => d.total), 1)
    : 1;

  return (
    <div className="p-6 animate-fade-in-up">
      {/* ============================================================ */}
      {/*  Page Header                                                  */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Relatorios
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando..."
                : `Periodo: ${formatFullDate(inicio)} a ${formatFullDate(fim)}`}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Date Filter                                                  */}
      {/* ============================================================ */}
      <Card className="rounded-2xl border-gray-100 shadow-sm mb-8 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
        <CardContent className="py-5 px-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                De
              </Label>
              <Input
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                className="rounded-xl border-gray-200 bg-white shadow-sm focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200 w-44"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                Ate
              </Label>
              <Input
                type="date"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                className="rounded-xl border-gray-200 bg-white shadow-sm focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200 w-44"
              />
            </div>
            <Button
              onClick={handleFilter}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale h-10 px-6"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Carregando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Filtrar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/*  Loading State                                                */}
      {/* ============================================================ */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-4" />
          <p className="text-sm text-gray-500">Carregando relatorio...</p>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Empty State                                                  */}
      {/* ============================================================ */}
      {!loading && !data && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <BarChart3 className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500">
            Nao foi possivel carregar os dados
          </p>
          <p className="text-sm mt-1 text-gray-400">
            Tente novamente ou selecione um periodo diferente
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Data Loaded                                                  */}
      {/* ============================================================ */}
      {!loading && data && (
        <div className="space-y-8">
          {/* ======================================================== */}
          {/*  Summary Cards                                            */}
          {/* ======================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Faturamento */}
            <Card
              className="rounded-2xl border-gray-100 shadow-sm hover-lift animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <CardContent className="py-5 px-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Faturamento</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatBRL(data.faturamento)}
                </p>
              </CardContent>
            </Card>

            {/* Total de Vendas */}
            <Card
              className="rounded-2xl border-gray-100 shadow-sm hover-lift animate-fade-in-up"
              style={{ animationDelay: "150ms" }}
            >
              <CardContent className="py-5 px-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Total de Vendas</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.totalVendas}
                </p>
              </CardContent>
            </Card>

            {/* Ticket Medio */}
            <Card
              className="rounded-2xl border-gray-100 shadow-sm hover-lift animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <CardContent className="py-5 px-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Ticket Medio</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBRL(data.ticketMedio)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ======================================================== */}
          {/*  Vendas por Forma de Pagamento                            */}
          {/* ======================================================== */}
          <Card
            className="rounded-2xl border-gray-100 shadow-sm animate-fade-in-up"
            style={{ animationDelay: "250ms" }}
          >
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                  <CreditCard className="w-4 h-4 text-gray-600" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Vendas por Forma de Pagamento
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {data.porFormaPagamento.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Nenhuma venda no periodo selecionado
                </p>
              ) : (
                <div className="space-y-4">
                  {data.porFormaPagamento.map((item) => {
                    const config = formaPagamentoConfig[item.forma] || {
                      label: item.forma,
                      color: "text-gray-700",
                      bg: "bg-gray-500",
                      border: "border-gray-200",
                      icon: <CreditCard className="w-4 h-4" />,
                    };
                    const pct = maxPagamento > 0 ? (item.total / maxPagamento) * 100 : 0;

                    return (
                      <div key={item.forma}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={config.color}>{config.icon}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {config.label}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs rounded-lg bg-gray-100 text-gray-500 font-normal"
                            >
                              {item.count} venda{item.count !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatBRL(item.total)}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${config.bg} transition-all duration-700 ease-out`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  Vendas por Origem                                        */}
          {/* ======================================================== */}
          <Card
            className="rounded-2xl border-gray-100 shadow-sm animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                  <Store className="w-4 h-4 text-gray-600" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Vendas por Origem
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {data.porOrigem.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Nenhuma venda no periodo selecionado
                </p>
              ) : (
                <div className="space-y-4">
                  {data.porOrigem.map((item) => {
                    const config = origemConfig[item.origem] || {
                      label: item.origem,
                      color: "text-gray-700",
                      bg: "bg-gray-500",
                      border: "border-gray-200",
                      icon: <Store className="w-4 h-4" />,
                    };
                    const pct = maxOrigem > 0 ? (item.total / maxOrigem) * 100 : 0;

                    return (
                      <div key={item.origem}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className={config.color}>{config.icon}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {config.label}
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs rounded-lg bg-gray-100 text-gray-500 font-normal"
                            >
                              {item.count} venda{item.count !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {formatBRL(item.total)}
                          </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${config.bg} transition-all duration-700 ease-out`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  Top 10 Produtos                                          */}
          {/* ======================================================== */}
          <Card
            className="rounded-2xl border-gray-100 shadow-sm animate-fade-in-up"
            style={{ animationDelay: "350ms" }}
          >
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                  <Trophy className="w-4 h-4 text-gray-600" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Top 10 Produtos
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {data.topProdutos.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Nenhum produto vendido no periodo
                </p>
              ) : (
                <div className="space-y-3">
                  {data.topProdutos.slice(0, 10).map((produto, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    const medalColors = [
                      "from-yellow-400 to-amber-500 text-white shadow-yellow-500/30",
                      "from-gray-300 to-gray-400 text-white shadow-gray-400/30",
                      "from-orange-400 to-amber-600 text-white shadow-orange-500/30",
                    ];

                    return (
                      <div
                        key={produto.produtoId}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/70 hover:bg-gray-100/70 transition-colors duration-150"
                      >
                        {/* Rank */}
                        {isTop3 ? (
                          <div
                            className={`flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br ${medalColors[rank - 1]} shadow-lg flex-shrink-0`}
                          >
                            <Medal className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-200/70 text-gray-500 font-bold text-sm flex-shrink-0">
                            {rank}
                          </div>
                        )}

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {produto.nome}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <Hash className="w-3 h-3" />
                            {produto.quantidade} unidade{produto.quantidade !== 1 ? "s" : ""} vendida{produto.quantidade !== 1 ? "s" : ""}
                          </p>
                        </div>

                        {/* Revenue */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">
                            {formatBRL(produto.total)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ======================================================== */}
          {/*  Vendas por Dia                                           */}
          {/* ======================================================== */}
          <Card
            className="rounded-2xl border-gray-100 shadow-sm animate-fade-in-up"
            style={{ animationDelay: "400ms" }}
          >
            <CardHeader className="pb-3 pt-5 px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
                  <Calendar className="w-4 h-4 text-gray-600" />
                </div>
                <CardTitle className="text-lg font-bold text-gray-900">
                  Vendas por Dia
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              {data.vendasPorDia.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  Nenhuma venda no periodo selecionado
                </p>
              ) : data.vendasPorDia.length <= 14 ? (
                /* ---- Bar chart for short periods ---- */
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-2 min-w-0 pt-4" style={{ minHeight: "220px" }}>
                    {data.vendasPorDia.map((dia) => {
                      const pct = maxDia > 0 ? (dia.total / maxDia) * 100 : 0;
                      const barHeight = Math.max(pct, 4);

                      return (
                        <div
                          key={dia.data}
                          className="flex flex-col items-center gap-1.5 flex-1 min-w-[48px]"
                        >
                          {/* Value label */}
                          <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap">
                            {formatBRL(dia.total)}
                          </span>

                          {/* Bar */}
                          <div
                            className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-amber-500 to-orange-400 transition-all duration-700 ease-out"
                            style={{ height: `${barHeight * 1.6}px` }}
                          />

                          {/* Date label */}
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {formatDate(dia.data)}
                          </span>

                          {/* Count */}
                          <span className="text-[9px] text-gray-300">
                            {dia.count}x
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* ---- Table for longer periods ---- */
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Vendas
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Faturamento
                        </th>
                        <th className="text-right py-2.5 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                          &nbsp;
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.vendasPorDia.map((dia) => {
                        const pct = maxDia > 0 ? (dia.total / maxDia) * 100 : 0;

                        return (
                          <tr
                            key={dia.data}
                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors duration-100"
                          >
                            <td className="py-2.5 px-3 font-medium text-gray-700">
                              {formatFullDate(dia.data)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-gray-500">
                              {dia.count}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                              {formatBRL(dia.total)}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700 ease-out"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
