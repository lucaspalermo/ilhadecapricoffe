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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Tag,
  Search,
  Pencil,
  Power,
  PackageOpen,
  Plus,
  Layers,
} from "lucide-react";

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  custoUnitario: number;
  estoqueMinimo: number;
  imagem: string | null;
  ativo: boolean;
  categoriaId: number;
  categoria: { id: number; nome: string };
}

interface Categoria {
  id: number;
  nome: string;
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showCatForm, setShowCatForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);

  // Form state
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [custo, setCusto] = useState("");
  const [estoqueMin, setEstoqueMin] = useState("5");
  const [categoriaId, setCategoriaId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [catNome, setCatNome] = useState("");

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/produtos"),
        fetch("/api/categorias"),
      ]);
      const prods = await prodRes.json();
      const cats = await catRes.json();
      setProdutos(Array.isArray(prods) ? prods : []);
      setCategorias(Array.isArray(cats) ? cats : []);
    } catch {
      toast.error("Erro ao carregar dados");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProdutos = produtos.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  );

  const openNewForm = () => {
    setEditingProduct(null);
    setNome("");
    setPreco("");
    setCusto("");
    setEstoqueMin("5");
    setCategoriaId("");
    setDescricao("");
    setShowForm(true);
  };

  const openEditForm = (p: Produto) => {
    setEditingProduct(p);
    setNome(p.nome);
    setPreco(String(p.preco));
    setCusto(p.custoUnitario > 0 ? String(p.custoUnitario) : "");
    setEstoqueMin(String(p.estoqueMinimo));
    setCategoriaId(String(p.categoriaId));
    setDescricao(p.descricao || "");
    setShowForm(true);
  };

  const handleSaveProduct = async () => {
    if (!nome || !preco || !categoriaId) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    try {
      const payload = {
        nome,
        preco: parseFloat(preco),
        custoUnitario: custo ? parseFloat(custo) : 0,
        estoqueMinimo: estoqueMin ? parseInt(estoqueMin) : 5,
        categoriaId: parseInt(categoriaId),
        descricao: descricao || null,
      };

      if (editingProduct) {
        const res = await fetch(`/api/produtos/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success("Produto atualizado!");
      } else {
        const res = await fetch("/api/produtos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success("Produto criado!");
      }

      setShowForm(false);
      loadData();
    } catch {
      toast.error("Erro ao salvar produto");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      const res = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Produto desativado");
      loadData();
    } catch {
      toast.error("Erro ao desativar produto");
    }
  };

  const handleSaveCategoria = async () => {
    if (!catNome) {
      toast.error("Digite o nome da categoria");
      return;
    }
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: catNome }),
      });
      if (!res.ok) throw new Error();
      toast.success("Categoria criada!");
      setCatNome("");
      setShowCatForm(false);
      loadData();
    } catch {
      toast.error("Erro ao salvar categoria");
    }
  };

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Produtos</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seu catalogo de produtos e categorias
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowCatForm(true)}
            className="rounded-xl border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-all duration-200 press-scale"
          >
            <Layers className="w-4 h-4 mr-2" />
            Categoria
          </Button>
          <Button
            onClick={openNewForm}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Category Badges */}
      {categorias.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-6">
          {categorias.map((cat) => (
            <Badge
              key={cat.id}
              variant="secondary"
              className="text-sm py-1.5 px-3.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/60 hover:bg-amber-100 transition-colors duration-200 cursor-default"
            >
              <Tag className="w-3 h-3 mr-1.5" />
              {cat.nome}
            </Badge>
          ))}
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

      {/* Product Grid */}
      {filteredProdutos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProdutos.map((produto, index) => (
            <Card
              key={produto.id}
              className="hover-lift rounded-2xl border-gray-100 shadow-sm overflow-hidden group"
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
                  <div className="text-right">
                    <span className="text-lg font-bold text-amber-700 whitespace-nowrap bg-amber-50 px-3 py-1 rounded-xl block">
                      R$ {produto.preco.toFixed(2)}
                    </span>
                    {produto.custoUnitario > 0 && (
                      <span className="text-xs text-gray-400 mt-1 block">
                        Custo R$ {produto.custoUnitario.toFixed(2)} &middot;{" "}
                        <span className="text-emerald-600 font-medium">
                          {(((produto.preco - produto.custoUnitario) / produto.preco) * 100).toFixed(1)}% margem
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {produto.descricao && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                    {produto.descricao}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditForm(produto)}
                    className="rounded-xl text-gray-600 hover:text-amber-700 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 press-scale flex-1"
                  >
                    <Pencil className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-red-500 hover:text-red-700 hover:border-red-300 hover:bg-red-50 transition-all duration-200 press-scale flex-1"
                    onClick={() => handleDeleteProduct(produto.id)}
                  >
                    <Power className="w-3.5 h-3.5 mr-1.5" />
                    Desativar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <PackageOpen className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-500">Nenhum produto cadastrado</p>
          <p className="text-sm mt-1 text-gray-400">
            Clique em &quot;Novo Produto&quot; para adicionar seu primeiro item
          </p>
        </div>
      )}

      {/* Dialog - New/Edit Product */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Package className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg">
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nome *</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cafe Expresso"
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Preco de Venda (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex: 5.50"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Custo (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={custo}
                  onChange={(e) => setCusto(e.target.value)}
                  placeholder="Ex: 2.00"
                  className="rounded-xl"
                />
              </div>
            </div>
            {preco && custo && parseFloat(preco) > 0 && parseFloat(custo) > 0 && (
              <p className="text-xs text-emerald-600 font-medium -mt-2">
                Margem: {(((parseFloat(preco) - parseFloat(custo)) / parseFloat(preco)) * 100).toFixed(1)}%
              </p>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Estoque Minimo</Label>
              <Input
                type="number"
                min="0"
                value={estoqueMin}
                onChange={(e) => setEstoqueMin(e.target.value)}
                placeholder="Ex: 5"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Categoria *</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)} className="rounded-lg">
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Descricao</Label>
              <Input
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Opcional"
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale h-11 text-sm font-semibold"
              onClick={handleSaveProduct}
            >
              {editingProduct ? "Salvar Alteracoes" : "Criar Produto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog - New Category */}
      <Dialog open={showCatForm} onOpenChange={setShowCatForm}>
        <DialogContent className="rounded-2xl sm:max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Layers className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg">Nova Categoria</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-5 mt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nome da Categoria</Label>
              <Input
                value={catNome}
                onChange={(e) => setCatNome(e.target.value)}
                placeholder="Ex: Cafes, Lanches, Sucos..."
                className="rounded-xl"
              />
            </div>
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 transition-all duration-200 press-scale h-11 text-sm font-semibold"
              onClick={handleSaveCategoria}
            >
              Criar Categoria
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
