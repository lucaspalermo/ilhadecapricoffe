"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import type { OperadorLogado } from "@/types";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const [operador, setOperador] = useState<OperadorLogado | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("operador");
      if (!stored) {
        router.replace("/");
        return;
      }

      const parsed: OperadorLogado = JSON.parse(stored);
      if (!parsed || !parsed.nome) {
        sessionStorage.removeItem("operador");
        router.replace("/");
        return;
      }

      setOperador(parsed);
      setReady(true);
    } catch {
      sessionStorage.removeItem("operador");
      router.replace("/");
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem("operador");
    sessionStorage.removeItem("caixa");
    router.replace("/");
  };

  // Show a minimal loading spinner while checking auth
  if (!ready || !operador) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#faf9f7]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar operadorNome={operador.nome} perfil={operador.perfil} onLogout={handleLogout} />

      <main className="flex-1 overflow-auto bg-[#faf9f7]">
        {children}
      </main>
    </div>
  );
}
