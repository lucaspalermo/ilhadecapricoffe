"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Truck,
  RefreshCw,
  Check,
  X,
  ChefHat,
  CheckCircle,
  MapPin,
  Clock,
  User,
  ShoppingBag,
  CircleDot,
  Filter,
  AlertCircle,
  Timer,
  PackageCheck,
  Ban,
} from "lucide-react";

interface PedidoDelivery {
  id: number;
  plataforma: string;
  pedidoExternoId: string;
  dados: {
    cliente?: string;
    itens?: { nome: string; quantidade: number; preco: number; observacao?: string }[];
    total?: number;
    endereco?: string;
  };
  status: string;
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  NOVO: "Novo",
  ACEITO: "Aceito",
  EM_PREPARO: "Em Preparo",
  PRONTO: "Pronto",
  CANCELADO: "Cancelado",
};

const statusConfig: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  NOVO: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
    icon: <AlertCircle className="w-3 h-3" />,
  },
  ACEITO: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
    icon: <Check className="w-3 h-3" />,
  },
  EM_PREPARO: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    border: "border-orange-200",
    icon: <Timer className="w-3 h-3" />,
  },
  PRONTO: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    icon: <PackageCheck className="w-3 h-3" />,
  },
  CANCELADO: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    icon: <Ban className="w-3 h-3" />,
  },
};

const plataformaColors: Record<string, string> = {
  IFOOD: "bg-red-600",
  KEETA: "bg-emerald-600",
  "99FOOD": "bg-amber-600",
};

const filterConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  TODOS: { label: "Todos", icon: <Filter className="w-3.5 h-3.5" /> },
  NOVO: { label: "Novo", icon: <AlertCircle className="w-3.5 h-3.5" /> },
  ACEITO: { label: "Aceito", icon: <Check className="w-3.5 h-3.5" /> },
  EM_PREPARO: { label: "Em Preparo", icon: <ChefHat className="w-3.5 h-3.5" /> },
  PRONTO: { label: "Pronto", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  CANCELADO: { label: "Cancelado", icon: <Ban className="w-3.5 h-3.5" /> },
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoDelivery[]>([]);
  const [filter, setFilter] = useState<string>("TODOS");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const prevCountRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadPedidos = useCallback(async () => {
    try {
      const url =
        filter === "TODOS"
          ? "/api/delivery/pedidos"
          : `/api/delivery/pedidos?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];

        // Sound alert for new orders
        const novos = list.filter((p: PedidoDelivery) => p.status === "NOVO").length;
        if (novos > prevCountRef.current && prevCountRef.current >= 0) {
          playAlert();
          toast.info("Novo pedido de delivery!", { duration: 5000 });
        }
        prevCountRef.current = novos;

        setPedidos(list);
      }
    } catch {
      // Silently fail on polling
    }
  }, [filter]);

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 30000);
    return () => clearInterval(interval);
  }, [loadPedidos]);

  const playAlert = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(
          "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAABhYGJkZ2lsbm9wcW9saWViXltYVlVVVldYW11gY2ZpbG5vcHBwbmpmYl5bWFZVVVZXWVtdYGNmaWxub3BwcG5qZmJeW1hWVVVWV1lbXWBjZmlsbnBwcHBuamZiXltYVlVVVldZW11gY2ZpbG5wb3BwbmpmYl5bWFZVVVZXWVtdYGNmaW1ub3BwcG5qZmJeW1hWVVV="
        );
      }
      audioRef.current.play().catch(() => {});
    } catch {
      // Audio might not be available
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPedidos();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch("/api/delivery/pedidos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Pedido atualizado para: ${statusLabels[newStatus]}`);
      loadPedidos();
    } catch {
      toast.error("Erro ao atualizar pedido");
    }
  };

  const getActionButtons = (pedido: PedidoDelivery) => {
    switch (pedido.status) {
      case "NOVO":
        return (
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              onClick={() => updateStatus(pedido.id, "ACEITO")}
              className="flex-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 press-scale transition-all duration-200 animate-pulse-glow"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Aceitar
            </Button>
            <Button
              size="sm"
              onClick={() => updateStatus(pedido.id, "CANCELADO")}
              className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/25 press-scale transition-all duration-200 animate-pulse-glow"
            >
              <X className="w-4 h-4 mr-1.5" />
              Recusar
            </Button>
          </div>
        );
      case "ACEITO":
        return (
          <div className="mt-4">
            <Button
              size="sm"
              onClick={() => updateStatus(pedido.id, "EM_PREPARO")}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-500/25 press-scale transition-all duration-200"
            >
              <ChefHat className="w-4 h-4 mr-1.5" />
              Iniciar Preparo
            </Button>
          </div>
        );
      case "EM_PREPARO":
        return (
          <div className="mt-4">
            <Button
              size="sm"
              onClick={() => updateStatus(pedido.id, "PRONTO")}
              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 press-scale transition-all duration-200"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Marcar Pronto
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const filters = ["TODOS", "NOVO", "ACEITO", "EM_PREPARO", "PRONTO", "CANCELADO"];

  return (
    <div className="p-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Pedidos Delivery</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie pedidos das plataformas de delivery
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="rounded-xl border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all duration-200 press-scale"
        >
          <RefreshCw className={`w-4 h-4 mr-2 transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap mb-8">
        {filters.map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={`rounded-xl transition-all duration-200 press-scale ${
              filter === f
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 border-0"
                : "border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-600"
            }`}
          >
            {filterConfig[f]?.icon}
            <span className="ml-1.5">{filterConfig[f]?.label || f}</span>
          </Button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {pedidos.map((pedido, index) => {
          const sConfig = statusConfig[pedido.status] || statusConfig.NOVO;
          const isNew = pedido.status === "NOVO";

          return (
            <Card
              key={pedido.id}
              className={`rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${
                isNew
                  ? "border-2 border-amber-300 animate-pulse-glow"
                  : "border-gray-100 hover-lift"
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Badge className={`${plataformaColors[pedido.plataforma] || "bg-gray-600"} text-white rounded-lg px-2.5 py-0.5 text-xs font-bold tracking-wide`}>
                      {pedido.plataforma}
                    </Badge>
                    <Badge className={`${sConfig.bg} ${sConfig.text} border ${sConfig.border} rounded-lg px-2.5 py-0.5 text-xs font-semibold`}>
                      <span className="mr-1">{sConfig.icon}</span>
                      {statusLabels[pedido.status]}
                    </Badge>
                    <CardTitle className="text-base font-bold text-gray-900">
                      #{pedido.pedidoExternoId.slice(0, 8)}
                    </CardTitle>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1.5 whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {new Date(pedido.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5">
                {/* Customer */}
                {pedido.dados.cliente && (
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="text-sm font-medium text-gray-700">
                      {pedido.dados.cliente}
                    </p>
                  </div>
                )}

                {/* Items List */}
                {pedido.dados.itens && pedido.dados.itens.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-3">
                    <div className="space-y-2">
                      {pedido.dados.itens.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between text-sm">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold shrink-0">
                              {item.quantidade}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 truncate">{item.nome}</p>
                              {item.observacao && (
                                <p className="text-xs text-gray-400 mt-0.5 italic">
                                  {item.observacao}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="font-semibold text-gray-700 ml-3 whitespace-nowrap">
                            R$ {(item.preco * item.quantidade).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-3 bg-gray-200/70" />

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-amber-600" />
                        Total
                      </span>
                      <span className="font-bold text-lg text-amber-700">
                        R$ {pedido.dados.total?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Address */}
                {pedido.dados.endereco && (
                  <div className="flex items-start gap-2 mb-1 px-1">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {pedido.dados.endereco}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {getActionButtons(pedido)}
              </CardContent>
            </Card>
          );
        })}

        {/* Empty State */}
        {pedidos.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Truck className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-500">Nenhum pedido</p>
            <p className="text-sm mt-1 text-gray-400">
              Os pedidos das plataformas aparecerao aqui automaticamente
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs text-gray-400">
              <CircleDot className="w-3 h-3 text-green-500 animate-pulse" />
              Monitorando a cada 30 segundos
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
