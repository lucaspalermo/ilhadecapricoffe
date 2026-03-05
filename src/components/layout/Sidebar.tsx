"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  ShoppingCart,
  Truck,
  Package,
  Wallet,
  Upload,
  LogOut,
  Boxes,
  DollarSign,
  BarChart3,
} from "lucide-react";
import type { PerfilOperador } from "@/types";

interface SidebarProps {
  operadorNome: string;
  perfil: PerfilOperador;
  onLogout: () => void;
}

const navItems = [
  { href: "/pdv",        label: "PDV",        icon: ShoppingCart, perfis: ["ADMIN", "OPERADOR"] },
  { href: "/caixa",      label: "Caixa",      icon: Wallet,       perfis: ["ADMIN", "OPERADOR"] },
  { href: "/estoque",    label: "Estoque",    icon: Boxes,        perfis: ["ADMIN", "OPERADOR"] },
  { href: "/pedidos",    label: "Delivery",   icon: Truck,        perfis: ["ADMIN", "OPERADOR"] },
  { href: "/produtos",   label: "Produtos",   icon: Package,      perfis: ["ADMIN"] },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign,   perfis: ["ADMIN"] },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3,    perfis: ["ADMIN"] },
  { href: "/importar",   label: "Importar",   icon: Upload,       perfis: ["ADMIN"] },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Sidebar({ operadorNome, perfil, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const itensVisiveis = navItems.filter((item) => item.perfis.includes(perfil));

  return (
    <aside className="flex h-screen w-[72px] flex-shrink-0 flex-col bg-[#1a1614] transition-all duration-300 lg:w-[240px]">
      {/* ---- brand section ---- */}
      <div className="flex h-[72px] items-center gap-3 px-4 lg:px-5">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-600/20">
          <Coffee className="h-5 w-5 text-white" strokeWidth={1.8} />
        </div>
        <span className="hidden text-lg font-bold tracking-tight text-white/90 lg:block">
          Cafeteria
        </span>
      </div>

      {/* divider */}
      <div className="mx-4 border-t border-white/[0.06] lg:mx-5" />

      {/* ---- navigation ---- */}
      <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
        {itensVisiveis.map((item) => {
          const isActive =
            pathname === item.href ||
            (pathname?.startsWith(item.href + "/") ?? false);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex h-11 items-center gap-3 rounded-xl px-3 transition-all duration-200 lg:px-4 ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/[0.05] hover:text-white/80"
              }`}
            >
              {/* active left indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-amber-500 transition-all duration-300" />
              )}

              <Icon
                className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                  isActive
                    ? "text-amber-400"
                    : "text-white/40 group-hover:text-white/70"
                }`}
                strokeWidth={isActive ? 2 : 1.8}
              />

              <span
                className={`hidden text-sm font-medium transition-colors duration-200 lg:block ${
                  isActive
                    ? "text-white"
                    : "text-white/50 group-hover:text-white/80"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* divider */}
      <div className="mx-4 border-t border-white/[0.06] lg:mx-5" />

      {/* ---- bottom: operator info + logout ---- */}
      <div className="flex items-center gap-3 px-4 py-4 lg:px-5">
        {/* avatar circle */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600/80 to-orange-700/80 text-xs font-bold text-white/90 shadow-inner">
          {getInitials(operadorNome)}
        </div>

        {/* name (visible on expanded sidebar) */}
        <div className="hidden min-w-0 flex-1 lg:block">
          <p className="truncate text-sm font-medium text-white/80">
            {operadorNome}
          </p>
          <p className="text-xs text-white/30 mt-0.5">
            {perfil === "ADMIN" ? "Administrador" : "Operador"}
          </p>
        </div>

        {/* logout button (expanded sidebar) */}
        <button
          type="button"
          onClick={onLogout}
          title="Sair"
          className="hidden items-center justify-center rounded-lg p-1.5 text-white/30 transition-all duration-200 hover:bg-white/[0.06] hover:text-red-400 lg:flex"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>

      {/* logout button (collapsed sidebar) */}
      <div className="flex justify-center pb-4 lg:hidden">
        <button
          type="button"
          onClick={onLogout}
          title="Sair"
          className="flex items-center justify-center rounded-lg p-2 text-white/30 transition-all duration-200 hover:bg-white/[0.06] hover:text-red-400"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.8} />
        </button>
      </div>
    </aside>
  );
}
