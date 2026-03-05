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
import {
  Boxes,
  Search,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  PackageOpen,
  Tag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Hash,
  FileText,
  FileUp,
} from "lucide-react";
import ImportNFe from "@/components/estoque/ImportNFe";

interface Categoria {
  id: number;
  nome: string;
}

interface ProdutoEstoque {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  imagem: string | null;
  ativo: boolean;
  estoque: number;
  estoqueMinimo: number;
  categoriaId: number;
  categoria: Categoria;
}

interface Movimentacao {
  id: number;
  produtoId: number;
  produto: { id: number; nome: string };
  tipo: string;
  quantidade: number;
  observacao: string | null;
  createdAt: string;
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [alertas, setAlertas] = useState<{ id: number; nome: string; estoque: number; estoqueMinimo: number }[]>([]);
  const [showNFe, setShowNFe] = useState(false);

  // Add stock dialog state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProdutoEstoque | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProdutos = async () => {
    try {
      const res = await fetch("/api/estoque");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProdutos(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar produtos do estoque");
    }
  };

  const loadMovimentacoes = async () => {
    try {
      const res = await fetch("/api/estoque/movimentacoes?limit=20");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMovimentacoes(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Erro ao carregar movimentacoes");
    }
  };

  const loadAlertas = async () => {
    try {
      const res = await fetch("/api/estoque/alertas");
      if (!res.ok) return;
      const data = await res.json();
      setAlertas(data.produtos ?? []);
    } catch { /* silencioso */ }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProdutos(), loadMovimentacoes(), loadAlertas()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (estoque: number, estoqueMinimo: number): { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode } => {
    if (estoque === 0) {
      return {
        label: "Zerado",
        color: "text-red-700",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: <XCircle className="w-3 h-3" />,
      };
    }
    if (estoque <= estoqueMinimo) {
      return {
        label: "Baixo",
        color: "text-yellow-700",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        icon: <AlertTriangle className="w-3 h-3" />,
      };
    }
    return {
      label: "OK",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    };
  };

  const openAddDialog = (produto: ProdutoEstoque) => {
    setSelectedProduct(produto);
    setQuantidade("");
    setObservacao("");
    setShowAddDialog(true);
  };

  const handleSaveEntry = async () => {
    if (!selectedProduct || !quantidade) {
      toast.error("Informe a quantidade");
      return;
    }

    const qty = parseInt(quantidade, 10);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Quantidade deve ser maior que zero");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/estoque", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          produtoId: selectedProduct.id,
          quantidade: qty,
          observacao: observacao.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Erro ao registrar entrada");
        return;
      }

      toast.success(`Entrada de ${qty} unidade(s) de "${selectedProduct.nome}" registrada!`);
      setShowAddDialog(false);
      setSelectedProduct(null);
      setQuantidade("");
      setObservacao("");
      loadData();
    } catch {
      toast.error("Erro ao registrar entrada de estoque");
    } finally {
      setSaving(false);
    }
  };

  const totalProdutos = produtos.length;

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Controle de Estoque
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando..."
                : `${totalProdutos} produto${totalProdutos !== 1 ? "s" : ""} cadastrado${totalProdutos !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowNFe(true)}
          variant="outline"
          className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
        >
          <FileUp className="w-4 h-4 mr-2" />
          Importar NF-e
        </Button>
      </div>

      {/* Alert Banner */}
      {alertas.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="font-semibold text-amber-800">
              {alertas.length} produto{alertas.length !== 1 ? "s" : ""} com estoque abaixo do mínimo
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {alertas.map((p) => (
              <span
                key={p.id}
                className="text-xs bg-amber-100 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1 font-medium"
              >
                {p.nome} — {p.estoque}/{p.estoqueMinimo}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar produto pelo nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl border-gray-200 bg-white shadow-sm focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent mb-4" />
          <p className="text-sm text-gray-500">Carregando estoque...</p>
        </div>
      ) : filteredProdutos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {filteredProdutos.map((produto, index) => {
            const status = getStockStatus(produto.estoque, produto.estoqueMinimo);

            return (
              <Card
                key={produto.id}
                className="hover-lift rounded-2xl border-gray-100 shadow-sm overflow-hidden group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3 pt-5 px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-semibold text-gray-900 truncate">
                        {produto.nome}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="mt-2 text-xs rounded-lg bg-gray-100 text-gray-600 font-normal"
                      >
                        <Tag className="w-2.5 h-2.5 mr-1" />
                        {produto.categoria.nome}
                      </Badge>
                    </div>
                    <Badge
                      className={`${status.bgColor} ${status.color} ${status.borderColor} border rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1 whitespace-nowrap`}
                    >
                      {status.icon}
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {/* Stock quantity display */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Estoque Atual</p>
                        <p className={`text-xl font-bold ${produto.estoque === 0 ? "text-red-600" : produto.estoque < 10 ? "text-yellow-600" : "text-gray-900"}`}>
                          {produto.estoque}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-amber-700 bg-amber-50 px-3 py-1 rounded-xl block">
                        R$ {produto.preco.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400 mt-1 block">
                        Mín: {produto.estoqueMinimo}
                      </span>
                    </div>
                  </div>

                  {/* Add stock button */}
                  <Button
                    size="sm"
                    onClick={() => openAddDialog(produto)}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Entrada de Estoque
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 mb-12">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <PackageOpen className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500">
            {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
          </p>
          <p className="text-sm mt-1 text-gray-400">
            {search
              ? "Tente buscar com outro termo"
              : "Cadastre produtos na pagina de Produtos para gerenciar o estoque"}
          </p>
        </div>
      )}

      {/* Movements History Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100">
            <Clock className="w-4 h-4 text-gray-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Movimentacoes Recentes</h2>
        </div>

        <div className="space-y-3">
          {movimentacoes.length > 0 ? (
            movimentacoes.map((mov, index) => (
              <Card
                key={mov.id}
                className="rounded-2xl border-gray-100 shadow-sm hover-lift transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CardContent className="py-4 px-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Left side: type badge + product name */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0 ${
                          mov.tipo === "ENTRADA"
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        {mov.tipo === "ENTRADA" ? (
                          <ArrowDownToLine className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowUpFromLine className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 truncate">
                            {mov.produto.nome}
                          </span>
                          <Badge
                            className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
                              mov.tipo === "ENTRADA"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                          >
                            {mov.tipo === "ENTRADA" ? "ENTRADA" : "SAIDA"}
                          </Badge>
                        </div>
                        {mov.observacao && (
                          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1 truncate">
                            <FileText className="w-3 h-3 flex-shrink-0" />
                            {mov.observacao}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right side: quantity + date */}
                    <div className="text-right flex-shrink-0">
                      <p
                        className={`text-lg font-bold ${
                          mov.tipo === "ENTRADA" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {mov.tipo === "ENTRADA" ? "+" : "-"}
                        {mov.quantidade}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(mov.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500">Nenhuma movimentacao</p>
              <p className="text-sm mt-1 text-gray-400">
                As entradas e saidas de estoque aparecerao aqui
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NF-e Import Modal */}
      <ImportNFe
        open={showNFe}
        onClose={() => setShowNFe(false)}
        produtos={produtos.map((p) => ({ id: p.id, nome: p.nome }))}
        onImported={loadData}
      />

      {/* Dialog - Add Stock Entry */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Plus className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg">Entrada de Estoque</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            {/* Product info (read-only) */}
            <div className="bg-gradient-to-br from-gray-50 to-stone-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Produto
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Boxes className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedProduct?.nome}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedProduct?.categoria.nome}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Estoque atual</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {selectedProduct?.estoque ?? 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Quantidade *
              </Label>
              <div className="relative">
                <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Ex: 50"
                  className="pl-10 rounded-xl"
                  autoFocus
                />
              </div>
            </div>

            {/* Observation input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Observacao
              </Label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Opcional - ex: Reposicao semanal"
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {/* Preview of result */}
            {quantidade && parseInt(quantidade, 10) > 0 && selectedProduct && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                <p className="text-sm text-green-700 font-medium">
                  Estoque apos entrada:
                </p>
                <p className="font-bold text-green-700 text-lg">
                  {selectedProduct.estoque + parseInt(quantidade, 10)}
                </p>
              </div>
            )}

            {/* Save button */}
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale h-11 text-sm font-semibold"
              onClick={handleSaveEntry}
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <ArrowDownToLine className="w-4 h-4 mr-2" />
                  Registrar Entrada
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
