"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Coffee, Package, SearchX, Search, X } from "lucide-react";

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

interface ProductGridProps {
  categorias: Categoria[];
  produtos: Produto[];
  onAddItem: (produto: Produto) => void;
}

const SEARCH_TAB = "__search__";

function ProductButton({
  produto,
  index,
  onAddItem,
}: {
  produto: Produto;
  index: number;
  onAddItem: (p: Produto) => void;
}) {
  return (
    <button
      onClick={() => onAddItem(produto)}
      className="
        group relative flex flex-col items-center justify-center
        p-4 bg-white rounded-2xl
        border border-gray-100
        hover:border-amber-300 hover:shadow-lg
        hover-lift press-scale
        transition-all duration-200
        min-h-[100px]
        animate-fade-in-up
        focus:outline-none focus:ring-2 focus:ring-amber-400/50
      "
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-2.5 group-hover:bg-amber-100 transition-colors duration-200">
        {produto.imagem ? (
          <Package className="w-5 h-5 text-amber-600" />
        ) : (
          <Coffee className="w-5 h-5 text-amber-600" />
        )}
      </div>
      <span className="text-sm font-medium text-gray-800 text-center leading-tight line-clamp-2">
        {produto.nome}
      </span>
      <span className="text-sm font-bold text-amber-700 mt-1.5">
        R$ {produto.preco.toFixed(2)}
      </span>
      <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </button>
  );
}

export default function ProductGrid({
  categorias,
  produtos,
  onAddItem,
}: ProductGridProps) {
  const [search, setSearch] = useState("");

  const isSearching = search.trim().length > 0;
  const defaultTab = categorias.length > 0 ? String(categorias[0].id) : "";
  const activeTab = isSearching ? SEARCH_TAB : defaultTab;

  const searchResults = isSearching
    ? produtos.filter((p) =>
        p.nome.toLowerCase().includes(search.trim().toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* ── Search Bar ── */}
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="Buscar produto pelo nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-9 rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-amber-400/20 transition-all duration-200 h-9 text-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} className="flex flex-col flex-1 min-h-0">
        {/* Category tabs - hidden while searching */}
        {!isSearching && (
          <TabsList
            variant="line"
            className="w-full justify-start overflow-x-auto flex-shrink-0 bg-transparent border-b border-gray-200 rounded-none h-auto p-0 gap-0"
          >
            {categorias.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={String(cat.id)}
                className="
                  relative rounded-none border-b-2 border-transparent
                  px-6 py-3.5 text-sm font-medium text-gray-500
                  transition-all duration-200
                  hover:text-amber-700 hover:bg-amber-50/50
                  data-[state=active]:border-amber-500
                  data-[state=active]:bg-amber-50
                  data-[state=active]:text-amber-800
                  data-[state=active]:font-semibold
                  data-[state=active]:shadow-none
                  after:hidden
                "
              >
                {cat.nome}
              </TabsTrigger>
            ))}
          </TabsList>
        )}

        {/* Search results */}
        <TabsContent value={SEARCH_TAB} className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
          <ScrollArea className="flex-1 h-full">
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <SearchX className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-400">
                  Nenhum produto encontrado para &ldquo;{search}&rdquo;
                </p>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-3">
                  {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} para &ldquo;{search}&rdquo;
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                  {searchResults.map((produto, index) => (
                    <ProductButton key={produto.id} produto={produto} index={index} onAddItem={onAddItem} />
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Per-category grids */}
        {categorias.map((cat) => {
          const filtered = produtos.filter((p) => p.categoriaId === cat.id);
          return (
            <TabsContent key={cat.id} value={String(cat.id)} className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col">
              <ScrollArea className="flex-1 h-full">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-fade-in-up">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <SearchX className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">
                      Nenhum produto nesta categoria
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                    {filtered.map((produto, index) => (
                      <ProductButton key={produto.id} produto={produto} index={index} onAddItem={onAddItem} />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
