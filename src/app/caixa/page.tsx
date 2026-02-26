"use client";

import { useEffect, useState } from "react";
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
  Wallet,
  DoorOpen,
  DollarSign,
  Clock,
  Banknote,
  Smartphone,
  CreditCard,
  ArrowRight,
  TrendingUp,
  User,
  CalendarClock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type { OperadorLogado } from "@/types";

interface CaixaData {
  id: number;
  operadorId: number;
  operador: { nome: string };
  valorAbertura: number;
  valorFechamento: number | null;
  dataAbertura: string;
  dataFechamento: string | null;
  status: string;
}

interface VendaResumo {
  formaPagamento: string;
  total: number;
}

export default function CaixaPage() {
  const [caixaAberto, setCaixaAberto] = useState<CaixaData | null>(null);
  const [historico, setHistorico] = useState<CaixaData[]>([]);
  const [vendas, setVendas] = useState<VendaResumo[]>([]);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [valorAbertura, setValorAbertura] = useState("");
  const [valorFechamento, setValorFechamento] = useState("");
  const [operador, setOperador] = useState<OperadorLogado | null>(null);

  const loadData = async () => {
    try {
      const [caixaRes, histRes] = await Promise.all([
        fetch("/api/caixa"),
        fetch("/api/caixa/historico"),
      ]);

      if (caixaRes.ok) {
        const data = await caixaRes.json();
        if (data && data.id) {
          setCaixaAberto(data);
          sessionStorage.setItem("caixa", JSON.stringify(data));
          // Load sales for this open register
          const vendasRes = await fetch(`/api/vendas?caixaId=${data.id}`);
          if (vendasRes.ok) {
            const vendasData = await vendasRes.json();
            setVendas(Array.isArray(vendasData) ? vendasData : []);
          }
        } else {
          setCaixaAberto(null);
          sessionStorage.removeItem("caixa");
        }
      }

      if (histRes.ok) {
        const histData = await histRes.json();
        setHistorico(Array.isArray(histData) ? histData : []);
      }
    } catch {
      toast.error("Erro ao carregar dados do caixa");
    }
  };

  useEffect(() => {
    const stored = sessionStorage.getItem("operador");
    if (stored) setOperador(JSON.parse(stored));
    loadData();
  }, []);

  const handleAbrir = async () => {
    if (!valorAbertura || !operador) {
      toast.error("Informe o valor de abertura");
      return;
    }
    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operadorId: operador.id,
          valorAbertura: parseFloat(valorAbertura),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao abrir caixa");
        return;
      }
      toast.success("Caixa aberto com sucesso!");
      setShowAbrirModal(false);
      setValorAbertura("");
      loadData();
    } catch {
      toast.error("Erro ao abrir caixa");
    }
  };

  const handleFechar = async () => {
    if (!valorFechamento || !caixaAberto) {
      toast.error("Informe o valor de fechamento");
      return;
    }
    try {
      const res = await fetch("/api/caixa/fechar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caixaId: caixaAberto.id,
          valorFechamento: parseFloat(valorFechamento),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao fechar caixa");
        return;
      }
      toast.success("Caixa fechado com sucesso!");
      setShowFecharModal(false);
      setValorFechamento("");
      sessionStorage.removeItem("caixa");
      loadData();
    } catch {
      toast.error("Erro ao fechar caixa");
    }
  };

  // Sales summary by payment method
  const resumoPagamentos = vendas.reduce(
    (acc, v) => {
      acc[v.formaPagamento] = (acc[v.formaPagamento] || 0) + v.total;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalVendas = vendas.reduce((sum, v) => sum + v.total, 0);

  const formaLabel: Record<string, string> = {
    DINHEIRO: "Dinheiro",
    PIX: "PIX",
    CARTAO_DEBITO: "Debito",
    CARTAO_CREDITO: "Credito",
  };

  const formaIcon: Record<string, React.ReactNode> = {
    DINHEIRO: <Banknote className="w-5 h-5 text-green-600" />,
    PIX: <Smartphone className="w-5 h-5 text-cyan-600" />,
    CARTAO_DEBITO: <CreditCard className="w-5 h-5 text-blue-600" />,
    CARTAO_CREDITO: <CreditCard className="w-5 h-5 text-purple-600" />,
  };

  const formaColor: Record<string, string> = {
    DINHEIRO: "from-green-50 to-emerald-50 border-green-200",
    PIX: "from-cyan-50 to-sky-50 border-cyan-200",
    CARTAO_DEBITO: "from-blue-50 to-indigo-50 border-blue-200",
    CARTAO_CREDITO: "from-purple-50 to-fuchsia-50 border-purple-200",
  };

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Controle de Caixa</h1>
            <p className="text-sm text-muted-foreground">
              Abertura, fechamento e acompanhamento do caixa
            </p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      {caixaAberto ? (
        <Card className="mb-8 rounded-2xl border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 shadow-sm overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1 text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  ABERTO
                </Badge>
                <CardTitle className="text-lg font-bold text-green-900">
                  Caixa #{caixaAberto.id}
                </CardTitle>
              </div>
              <Button
                variant="destructive"
                onClick={() => setShowFecharModal(true)}
                className="rounded-xl shadow-lg shadow-red-500/20 press-scale transition-all duration-200"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Fechar Caixa
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <User className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">Operador</p>
                </div>
                <p className="font-semibold text-gray-900 truncate">
                  {caixaAberto.operador?.nome || operador?.nome}
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">Valor Abertura</p>
                </div>
                <p className="font-semibold text-gray-900">
                  R$ {caixaAberto.valorAbertura.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">Abertura</p>
                </div>
                <p className="font-semibold text-gray-900 text-sm">
                  {new Date(caixaAberto.dataAbertura).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-xs text-green-700 font-medium">Total Vendas</p>
                </div>
                <p className="font-bold text-green-700 text-xl">
                  R$ {totalVendas.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment Method Summary */}
            {Object.keys(resumoPagamentos).length > 0 && (
              <>
                <Separator className="bg-green-200/50" />
                <div>
                  <p className="text-sm font-semibold text-green-800 mb-3">
                    Resumo por forma de pagamento
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(resumoPagamentos).map(([forma, valor]) => (
                      <div
                        key={forma}
                        className={`bg-gradient-to-br ${formaColor[forma] || "from-gray-50 to-gray-100 border-gray-200"} p-4 rounded-xl border hover-lift transition-all duration-200`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {formaIcon[forma] || <DollarSign className="w-5 h-5 text-gray-500" />}
                          <p className="text-xs font-medium text-gray-600">
                            {formaLabel[forma] || forma}
                          </p>
                        </div>
                        <p className="font-bold text-gray-900 text-lg">
                          R$ {valor.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8 rounded-2xl border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-orange-50/80 shadow-sm">
          <CardContent className="flex items-center justify-between py-8 px-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                <DoorOpen className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-lg">Nenhum caixa aberto</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Abra o caixa para comecar a registrar vendas
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAbrirModal(true)}
              className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 transition-all duration-200 press-scale h-11 px-6"
            >
              <DoorOpen className="w-4 h-4 mr-2" />
              Abrir Caixa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
            <Clock className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Historico</h2>
        </div>

        <div className="space-y-3">
          {historico.map((caixa, index) => (
            <Card
              key={caixa.id}
              className="rounded-2xl border-gray-100 shadow-sm hover-lift transition-all duration-200"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge
                      className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                        caixa.status === "ABERTO"
                          ? "bg-green-100 text-green-700 border border-green-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {caixa.status}
                    </Badge>
                    <span className="font-semibold text-gray-900">Caixa #{caixa.id}</span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {caixa.operador?.nome}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(caixa.dataAbertura).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-end gap-1">
                      <span className="text-green-600 font-medium">
                        R$ {caixa.valorAbertura.toFixed(2)}
                      </span>
                      {caixa.valorFechamento !== null && (
                        <>
                          <ArrowRight className="w-3 h-3 text-gray-300" />
                          <span className="text-gray-600 font-medium">
                            R$ {caixa.valorFechamento.toFixed(2)}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {historico.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500">Nenhum historico</p>
              <p className="text-sm mt-1 text-gray-400">
                O historico de caixas aparecera aqui
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialog - Open Register */}
      <Dialog open={showAbrirModal} onOpenChange={setShowAbrirModal}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <DoorOpen className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg">Abrir Caixa</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Valor de Abertura (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  value={valorAbertura}
                  onChange={(e) => setValorAbertura(e.target.value)}
                  placeholder="Ex: 100.00"
                  className="pl-10 rounded-xl"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Informe o valor em dinheiro no caixa no inicio do turno
              </p>
            </div>
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 transition-all duration-200 press-scale h-11 text-sm font-semibold"
              onClick={handleAbrir}
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Abrir Caixa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - Close Register */}
      <Dialog open={showFecharModal} onOpenChange={setShowFecharModal}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg">Fechar Caixa</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-gray-50 to-stone-50 p-5 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Resumo do Caixa
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valor abertura</span>
                  <span className="font-medium text-gray-900">
                    R$ {caixaAberto?.valorAbertura.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total vendas</span>
                  <span className="font-medium text-green-700">
                    + R$ {totalVendas.toFixed(2)}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800">Valor esperado</span>
                  <span className="font-bold text-xl text-amber-700">
                    R$ {((caixaAberto?.valorAbertura || 0) + totalVendas).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Valor de Fechamento (R$)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  step="0.01"
                  value={valorFechamento}
                  onChange={(e) => setValorFechamento(e.target.value)}
                  placeholder="Conte o dinheiro e informe o valor"
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            <Button
              className="w-full rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/25 transition-all duration-200 press-scale h-11 text-sm font-semibold"
              onClick={handleFechar}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Confirmar Fechamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
