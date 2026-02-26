"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Delete, LogIn, Loader2, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(
    async (currentPin: string) => {
      if (currentPin.length !== 4) return;
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/operadores/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin: currentPin }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "PIN incorreto");
        }

        const operador = await res.json();
        sessionStorage.setItem("operador", JSON.stringify(operador));
        router.push("/pdv");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Erro ao autenticar";
        setError(message);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          setPin("");
        }, 600);
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  const handleDigit = useCallback(
    (digit: string) => {
      if (loading) return;
      setError("");
      setPin((prev) => {
        if (prev.length >= 4) return prev;
        const next = prev + digit;
        if (next.length === 4) {
          setTimeout(() => handleSubmit(next), 250);
        }
        return next;
      });
    },
    [loading, handleSubmit]
  );

  const handleBackspace = useCallback(() => {
    if (loading) return;
    setError("");
    setPin((prev) => prev.slice(0, -1));
  }, [loading]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDigit, handleBackspace]);

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50/80 to-amber-100/60 px-4">
      {/* ---------- decorative background blur circles ---------- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-amber-200/40 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-orange-200/30 blur-[140px]" />
        <div className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-amber-300/20 blur-[100px]" />
      </div>

      {/* ---------- login card ---------- */}
      <div
        className={`relative z-10 w-full max-w-[400px] rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl shadow-amber-900/5 backdrop-blur-xl transition-all duration-700 ease-out sm:p-10 ${
          mounted ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        }`}
      >
        {/* brand header */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
            <Coffee className="h-8 w-8 text-white" strokeWidth={1.8} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Cafeteria PDV
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Digite seu PIN para entrar
            </p>
          </div>
        </div>

        {/* PIN dots */}
        <div className="mb-6 flex items-center justify-center">
          <div
            className={`flex gap-4 ${shake ? "animate-shake" : ""}`}
            style={
              shake
                ? {
                    animation:
                      "shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
                  }
                : undefined
            }
          >
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative flex h-5 w-5 items-center justify-center"
              >
                {/* outer ring */}
                <div
                  className={`absolute inset-0 rounded-full border-2 transition-all duration-300 ${
                    error
                      ? "border-red-400"
                      : pin.length > i
                      ? "border-amber-500 scale-110"
                      : "border-gray-300"
                  }`}
                />
                {/* filled dot */}
                <div
                  className={`h-full w-full rounded-full transition-all duration-300 ${
                    pin.length > i
                      ? error
                        ? "scale-100 bg-red-400"
                        : "scale-100 bg-amber-500"
                      : "scale-0 bg-transparent"
                  }`}
                  style={
                    pin.length > i
                      ? {
                          animation:
                            "popIn 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)",
                        }
                      : undefined
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* error message */}
        <div className="mb-4 flex min-h-[28px] items-center justify-center">
          {error && (
            <div className="animate-fade-in-up flex items-center gap-1.5 text-sm font-medium text-red-500">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* 3x4 number grid */}
        <div className="mx-auto mb-6 grid max-w-[280px] grid-cols-3 gap-3">
          {digits.map((digit, index) => {
            // empty spacer (bottom-left)
            if (digit === "") {
              return <div key={`spacer-${index}`} />;
            }

            // backspace button
            if (digit === "back") {
              return (
                <button
                  key="backspace"
                  type="button"
                  onClick={handleBackspace}
                  disabled={loading || pin.length === 0}
                  className="press-scale flex h-14 items-center justify-center rounded-2xl bg-gray-100/80 text-gray-600 transition-all duration-200 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:opacity-30 disabled:hover:bg-gray-100/80 disabled:hover:text-gray-600"
                >
                  <Delete className="h-5 w-5" strokeWidth={1.8} />
                </button>
              );
            }

            // digit button
            return (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                disabled={loading || pin.length >= 4}
                className="press-scale flex h-14 items-center justify-center rounded-2xl bg-gray-50/80 text-lg font-semibold text-gray-800 transition-all duration-200 hover:bg-amber-50 hover:shadow-md hover:shadow-amber-100/50 active:scale-95 disabled:opacity-40 disabled:hover:bg-gray-50/80 disabled:hover:shadow-none"
              >
                {digit}
              </button>
            );
          })}
        </div>

        {/* submit button */}
        <button
          type="button"
          onClick={() => handleSubmit(pin)}
          disabled={pin.length !== 4 || loading}
          className="press-scale flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/30 hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none disabled:hover:brightness-100"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Autenticando...</span>
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" strokeWidth={2} />
              <span>Entrar</span>
            </>
          )}
        </button>
      </div>

      {/* inline keyframe styles */}
      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-4px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(4px);
          }
        }
        @keyframes popIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
