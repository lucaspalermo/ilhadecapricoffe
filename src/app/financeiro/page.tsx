"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  DollarSign,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Receipt,
  BarChart3,
  Calendar,
  FileText,
  CreditCard,
  Banknote,
  Smartphone,
  Store,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ── Types ──

interface CategoriaFinanceira {
  id: number;
  nome: string;
  tipo: "RECEITA" | "DESPESA";
}

interface Lancamento {
  id: number;
  descricao: string;
  valor: number;
  data: string;
  mesReferencia: number;
  anoReferencia: number;
  categoriaFinanceiraId: number;
  categoriaFinanceira: {
    id: number;
    nome: string;
    tipo: "RECEITA" | "DESPESA";
  };
}

interface DREData {
  receita: {
    total: number;
    porFormaPagamento: {
      DINHEIRO: number;
      PIX: number;
      CARTAO_DEBITO: number;
      CARTAO_CREDITO: number;
    };
    porOrigem: {
      BALCAO: number;
      IFOOD: number;
    };
  };
  despesas: {
    categoria: string;
    categoriaId: number;
    total: number;
    lancamentos: { descricao: string; valor: number }[];
  }[];
  resultado: number;
}

// ── Helpers ──

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("pt-BR");

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const paymentMethodLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  DINHEIRO: { label: "Dinheiro", icon: <Banknote className="w-4 h-4" /> },
  PIX: { label: "PIX", icon: <Smartphone className="w-4 h-4" /> },
  CARTAO_DEBITO: { label: "Cartao Debito", icon: <CreditCard className="w-4 h-4" /> },
  CARTAO_CREDITO: { label: "Cartao Credito", icon: <CreditCard className="w-4 h-4" /> },
};

const originLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  BALCAO: { label: "Balcao", icon: <Store className="w-4 h-4" /> },
  IFOOD: { label: "iFood", icon: <ShoppingBag className="w-4 h-4" /> },
};

// ── Component ──

export default function FinanceiroPage() {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());

  // Lancamentos state
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loadingLanc, setLoadingLanc] = useState(true);

  // DRE state
  const [dre, setDre] = useState<DREData | null>(null);
  const [loadingDRE, setLoadingDRE] = useState(true);

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingLanc, setEditingLanc] = useState<Lancamento | null>(null);
  const [formDescricao, setFormDescricao] = useState("");
  const [formValor, setFormValor] = useState("");
  const [formData, setFormData] = useState("");
  const [formCategoriaId, setFormCategoriaId] = useState("");
  const [saving, setSaving] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("lancamentos");

  // ── Data Loading ──

  const loadCategorias = useCallback(async () => {
    try {
      const res = await fetch("/api/financeiro/categorias");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar categorias financeiras");
    }
  }, []);

  const loadLancamentos = useCallback(async () => {
    setLoadingLanc(true);
    try {
      const res = await fetch(`/api/financeiro/lancamentos?mes=${mes}&ano=${ano}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLancamentos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar lancamentos");
    } finally {
      setLoadingLanc(false);
    }
  }, [mes, ano]);

  const loadDRE = useCallback(async () => {
    setLoadingDRE(true);
    try {
      const res = await fetch(`/api/financeiro/dre?mes=${mes}&ano=${ano}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDre(data);
    } catch {
      toast.error("Erro ao carregar DRE");
    } finally {
      setLoadingDRE(false);
    }
  }, [mes, ano]);

  useEffect(() => {
    loadCategorias();
  }, [loadCategorias]);

  useEffect(() => {
    loadLancamentos();
    loadDRE();
  }, [loadLancamentos, loadDRE]);

  // ── Month Navigation ──

  const prevMonth = () => {
    if (mes === 1) {
      setMes(12);
      setAno(ano - 1);
    } else {
      setMes(mes - 1);
    }
  };

  const nextMonth = () => {
    if (mes === 12) {
      setMes(1);
      setAno(ano + 1);
    } else {
      setMes(mes + 1);
    }
  };

  // ── CRUD Operations ──

  const openNewDialog = () => {
    setEditingLanc(null);
    setFormDescricao("");
    setFormValor("");
    setFormData(new Date().toISOString().split("T")[0]);
    setFormCategoriaId("");
    setShowDialog(true);
  };

  const openEditDialog = (lanc: Lancamento) => {
    setEditingLanc(lanc);
    setFormDescricao(lanc.descricao);
    setFormValor(String(lanc.valor));
    setFormData(lanc.data.split("T")[0]);
    setFormCategoriaId(String(lanc.categoriaFinanceiraId));
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formDescricao.trim()) {
      toast.error("Informe a descricao");
      return;
    }
    if (!formValor || isNaN(Number(formValor)) || Number(formValor) <= 0) {
      toast.error("Informe um valor valido");
      return;
    }
    if (!formData) {
      toast.error("Informe a data");
      return;
    }
    if (!formCategoriaId) {
      toast.error("Selecione a categoria");
      return;
    }

    setSaving(true);
    try {
      const body = {
        ...(editingLanc ? { id: editingLanc.id } : {}),
        categoriaFinanceiraId: Number(formCategoriaId),
        descricao: formDescricao.trim(),
        valor: Number(formValor),
        data: formData,
        mesReferencia: mes,
        anoReferencia: ano,
      };

      const res = await fetch("/api/financeiro/lancamentos", {
        method: editingLanc ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar lancamento");
        return;
      }

      toast.success(editingLanc ? "Lancamento atualizado!" : "Lancamento criado!");
      setShowDialog(false);
      loadLancamentos();
      loadDRE();
    } catch {
      toast.error("Erro ao salvar lancamento");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este lancamento?")) return;

    try {
      const res = await fetch(`/api/financeiro/lancamentos?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao excluir lancamento");
        return;
      }

      toast.success("Lancamento excluido!");
      loadLancamentos();
      loadDRE();
    } catch {
      toast.error("Erro ao excluir lancamento");
    }
  };

  // ── Computed ──

  const totalDespesas = lancamentos
    .filter((l) => l.categoriaFinanceira.tipo === "DESPESA")
    .reduce((sum, l) => sum + l.valor, 0);

  const totalReceitas = lancamentos
    .filter((l) => l.categoriaFinanceira.tipo === "RECEITA")
    .reduce((sum, l) => sum + l.valor, 0);

  // ── Render ──

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Financeiro
            </h1>
            <p className="text-sm text-muted-foreground">
              Controle de despesas e resultados
            </p>
          </div>
        </div>
      </div>

      {/* Month/Year Selector */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl h-9 w-9"
          onClick={prevMonth}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-gray-900">
            {MESES[mes - 1]} {ano}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl h-9 w-9"
          onClick={nextMonth}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-gray-100 rounded-xl p-1">
          <TabsTrigger
            value="lancamentos"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-2 text-sm font-semibold transition-all"
          >
            <Receipt className="w-4 h-4 mr-2" />
            Lancamentos
          </TabsTrigger>
          <TabsTrigger
            value="dre"
            className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-md px-4 py-2 text-sm font-semibold transition-all"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            DRE
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════ Tab: Lancamentos ═══════════════════════════ */}
        <TabsContent value="lancamentos">
          {/* Add Button */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {loadingLanc
                ? "Carregando..."
                : `${lancamentos.length} lancamento${lancamentos.length !== 1 ? "s" : ""} neste mes`}
            </p>
            <Button
              onClick={openNewDialog}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Lancamento
            </Button>
          </div>

          {/* Lancamentos List */}
          {loadingLanc ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-4" />
              <p className="text-sm text-gray-500">Carregando lancamentos...</p>
            </div>
          ) : lancamentos.length > 0 ? (
            <div className="space-y-3">
              {lancamentos.map((lanc, index) => {
                const isReceita = lanc.categoriaFinanceira.tipo === "RECEITA";
                return (
                <Card
                  key={lanc.id}
                  className="rounded-2xl border-gray-100 shadow-sm hover-lift animate-fade-in-up"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <CardContent className="py-4 px-5">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      {/* Left: info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${isReceita ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                          {isReceita
                            ? <TrendingUp className="w-4 h-4 text-green-600" />
                            : <TrendingDown className="w-4 h-4 text-red-600" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">
                              {lanc.descricao}
                            </span>
                            <Badge className="rounded-lg px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              {lanc.categoriaFinanceira.nome}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(lanc.data)}
                          </p>
                        </div>
                      </div>

                      {/* Right: value + actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-lg font-bold ${isReceita ? "text-green-600" : "text-red-600"}`}>
                          {isReceita ? "+" : "-"}{formatBRL(lanc.valor)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => openEditDialog(lanc)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(lanc.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
              })}

              {/* Totais */}
              <Card className="rounded-2xl border-gray-200 bg-gray-50 shadow-sm">
                <CardContent className="py-4 px-5 space-y-2">
                  {totalReceitas > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-green-700">Total de Receitas</span>
                      <span className="text-lg font-bold text-green-700">+{formatBRL(totalReceitas)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-red-700">Total de Despesas</span>
                    <span className="text-lg font-bold text-red-700">-{formatBRL(totalDespesas)}</span>
                  </div>
                  {totalReceitas > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                      <span className="text-sm font-bold text-gray-700">Saldo do Mês</span>
                      <span className={`text-xl font-bold ${totalReceitas - totalDespesas >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {formatBRL(totalReceitas - totalDespesas)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Receipt className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Nenhum lancamento neste mes
              </p>
              <p className="text-sm mt-1 text-gray-400">
                Clique em &quot;Novo Lancamento&quot; para adicionar
              </p>
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════ Tab: DRE ═══════════════════════════ */}
        <TabsContent value="dre">
          {loadingDRE ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-4" />
              <p className="text-sm text-gray-500">Carregando DRE...</p>
            </div>
          ) : dre ? (
            <div className="space-y-6">
              {/* ── RECEITA ── */}
              <Card className="rounded-2xl border-green-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-100 border border-green-200">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-bold text-green-800">
                        RECEITA
                      </CardTitle>
                    </div>
                    <span className="text-xl font-bold text-green-700">
                      {formatBRL(dre.receita.total)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-5 space-y-4">
                  {/* Por Forma de Pagamento */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Por Forma de Pagamento
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(dre.receita.porFormaPagamento).map(([key, value]) => {
                        const info = paymentMethodLabels[key];
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                {info?.icon}
                              </div>
                              <span className="text-sm font-medium">
                                {info?.label || key}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {formatBRL(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Por Origem */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Por Origem
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.entries(dre.receita.porOrigem).map(([key, value]) => {
                        const info = originLabels[key];
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100"
                          >
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500">
                                {info?.icon}
                              </div>
                              <span className="text-sm font-medium">
                                {info?.label || key}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">
                              {formatBRL(value)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ── DESPESAS ── */}
              <Card className="rounded-2xl border-red-200 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 bg-gradient-to-r from-red-50 to-rose-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-100 border border-red-200">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-bold text-red-800">
                        DESPESAS
                      </CardTitle>
                    </div>
                    <span className="text-xl font-bold text-red-700">
                      {formatBRL(dre.despesas.reduce((sum, d) => sum + d.total, 0))}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-5">
                  {dre.despesas.length > 0 ? (
                    <div className="space-y-4">
                      {dre.despesas.map((desp, idx) => (
                        <div key={desp.categoriaId}>
                          {idx > 0 && <Separator className="mb-4" />}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                                {desp.categoria}
                              </Badge>
                            </div>
                            <span className="text-sm font-bold text-red-700">
                              {formatBRL(desp.total)}
                            </span>
                          </div>
                          <div className="space-y-1.5 ml-1">
                            {desp.lancamentos.map((l, lIdx) => (
                              <div
                                key={lIdx}
                                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl border border-gray-100"
                              >
                                <span className="text-sm text-gray-700">
                                  {l.descricao}
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatBRL(l.valor)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">
                      Nenhuma despesa registrada neste mes
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* ── RESULTADO ── */}
              <Card
                className={`rounded-2xl shadow-sm overflow-hidden ${
                  dre.resultado >= 0
                    ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                    : "border-red-200 bg-gradient-to-r from-red-50 to-rose-50"
                }`}
              >
                <CardContent className="py-5 px-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-xl ${
                          dre.resultado >= 0
                            ? "bg-green-100 border border-green-200"
                            : "bg-red-100 border border-red-200"
                        }`}
                      >
                        {dre.resultado >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Resultado
                        </p>
                        <p
                          className={`text-sm font-medium ${
                            dre.resultado >= 0 ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {dre.resultado >= 0 ? "Lucro" : "Prejuizo"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-2xl font-bold ${
                        dre.resultado >= 0 ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {formatBRL(dre.resultado)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <BarChart3 className="w-10 h-10 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-500">
                Nenhum dado disponivel
              </p>
              <p className="text-sm mt-1 text-gray-400">
                Nao foi possivel carregar o DRE para este periodo
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════ Dialog: Add/Edit Lancamento ═══════════════════════════ */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                {editingLanc ? (
                  <Pencil className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </div>
              <DialogTitle className="text-lg">
                {editingLanc ? "Editar Lancamento" : "Novo Lancamento"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Categoria *
              </Label>
              <Select value={formCategoriaId} onValueChange={setFormCategoriaId}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Descricao */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Descricao *
              </Label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  placeholder="Ex: Conta de luz"
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {/* Valor */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Valor (R$) *
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formValor}
                  onChange={(e) => setFormValor(e.target.value)}
                  placeholder="0,00"
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {/* Data */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Data *
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData}
                  onChange={(e) => setFormData(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {/* Preview */}
            {formValor && Number(formValor) > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm text-amber-700 font-medium">Valor do lancamento:</p>
                <p className="font-bold text-amber-700 text-lg">
                  {formatBRL(Number(formValor))}
                </p>
              </div>
            )}

            {/* Save button */}
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale h-11 text-sm font-semibold"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  {editingLanc ? (
                    <Pencil className="w-4 h-4 mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  {editingLanc ? "Salvar Alteracoes" : "Criar Lancamento"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
