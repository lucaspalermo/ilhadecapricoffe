"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Coffee, Package, SearchX } from "lucide-react";

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

export default function ProductGrid({
  categorias,
  produtos,
  onAddItem,
}: ProductGridProps) {
  const defaultTab = categorias.length > 0 ? String(categorias[0].id) : "";

  return (
    <Tabs defaultValue={defaultTab} className="flex flex-col h-full">
      {/* ── Category Tabs ── */}
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

      {/* ── Product Grids per Category ── */}
      {categorias.map((cat) => {
        const filtered = produtos.filter((p) => p.categoriaId === cat.id);

        return (
          <TabsContent key={cat.id} value={String(cat.id)} className="flex-1 m-0">
            <ScrollArea className="h-full">
              {filtered.length === 0 ? (
                /* ── Empty State ── */
                <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-fade-in-up">
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <SearchX className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-400">
                    Nenhum produto nesta categoria
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Adicione produtos para exibi-los aqui
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                  {filtered.map((produto, index) => (
                    <button
                      key={produto.id}
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
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-2.5 transition-colors duration-200 group-hover:bg-amber-100">
                        {produto.imagem ? (
                          <Package className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Coffee className="w-5 h-5 text-amber-600" />
                        )}
                      </div>

                      {/* Product Name */}
                      <span className="text-sm font-medium text-gray-800 text-center leading-tight line-clamp-2">
                        {produto.nome}
                      </span>

                      {/* Price */}
                      <span className="text-sm font-bold text-amber-700 mt-1.5">
                        R$ {produto.preco.toFixed(2)}
                      </span>

                      {/* Hover accent bar */}
                      <div className="absolute bottom-0 left-3 right-3 h-0.5 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
