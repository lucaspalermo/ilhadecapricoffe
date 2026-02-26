"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileSpreadsheet,
  FileJson,
  Download,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Package,
  Layers,
  Users,
  FileText,
  Info,
  X,
} from "lucide-react";

interface ImportResult {
  sucesso: boolean;
  resultado: {
    categorias: { criadas: number; erros: string[] };
    produtos: { criados: number; erros: string[] };
    operadores: { criados: number; erros: string[] };
  };
  resumo: string;
}

// CSV parser simples
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(";").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(";").map((v) => v.trim().replace(/"/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || "";
    });
    return obj;
  });
}

function csvToProdutos(rows: Record<string, string>[]) {
  return rows
    .filter((r) => r.nome && r.preco && r.categoria)
    .map((r) => ({
      nome: r.nome,
      preco: parseFloat(r.preco.replace(",", ".")),
      categoria: r.categoria,
      descricao: r.descricao || undefined,
    }));
}

function csvToCategorias(rows: Record<string, string>[]) {
  return rows
    .filter((r) => r.nome)
    .map((r, i) => ({
      nome: r.nome,
      ordem: r.ordem ? parseInt(r.ordem) : i + 1,
    }));
}

function csvToOperadores(rows: Record<string, string>[]) {
  return rows
    .filter((r) => r.nome && r.pin)
    .map((r) => ({
      nome: r.nome,
      pin: r.pin,
    }));
}

// Templates CSV
const TEMPLATE_PRODUTOS = `nome;preco;categoria;descricao
Cafe Expresso;5.00;Cafes;Cafe puro forte
Cappuccino;8.50;Cafes;Cafe com leite e espuma
Pao de Queijo;4.00;Lanches;Tradicional mineiro
Coxinha;6.00;Lanches;Frango com catupiry
Suco Laranja;8.00;Bebidas;Natural 300ml
Bolo Cenoura;7.00;Doces;Fatia com cobertura de chocolate`;

const TEMPLATE_CATEGORIAS = `nome;ordem
Cafes;1
Lanches;2
Bebidas;3
Doces;4`;

const TEMPLATE_OPERADORES = `nome;pin
Admin;1234
Maria;5678
Joao;9012`;

const TEMPLATE_JSON = JSON.stringify(
  {
    tipo: "completo",
    categorias: [
      { nome: "Cafes", ordem: 1 },
      { nome: "Lanches", ordem: 2 },
    ],
    produtos: [
      { nome: "Cafe Expresso", preco: 5.0, categoria: "Cafes", descricao: "Cafe puro" },
      { nome: "Pao de Queijo", preco: 4.0, categoria: "Lanches" },
    ],
    operadores: [
      { nome: "Admin", pin: "1234" },
    ],
  },
  null,
  2
);

export default function ImportarPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [preview, setPreview] = useState<{
    categorias: number;
    produtos: number;
    operadores: number;
    data: unknown;
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = (content: string, name: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;

      try {
        if (file.name.endsWith(".json")) {
          const json = JSON.parse(text);
          setPreview({
            categorias: json.categorias?.length || 0,
            produtos: json.produtos?.length || 0,
            operadores: json.operadores?.length || 0,
            data: json,
          });
        } else {
          // CSV - detect type by headers
          const rows = parseCSV(text);
          if (rows.length === 0) {
            toast.error("Arquivo vazio ou formato invalido");
            return;
          }

          const headers = Object.keys(rows[0]);
          if (headers.includes("preco") && headers.includes("categoria")) {
            const produtos = csvToProdutos(rows);
            // Extrair categorias unicas
            const catNames = [...new Set(produtos.map((p) => p.categoria))];
            const categorias = catNames.map((nome, i) => ({ nome, ordem: i + 1 }));
            setPreview({
              categorias: categorias.length,
              produtos: produtos.length,
              operadores: 0,
              data: { tipo: "completo", categorias, produtos },
            });
          } else if (headers.includes("pin")) {
            const operadores = csvToOperadores(rows);
            setPreview({
              categorias: 0,
              produtos: 0,
              operadores: operadores.length,
              data: { tipo: "operadores", operadores },
            });
          } else if (headers.includes("nome")) {
            const categorias = csvToCategorias(rows);
            setPreview({
              categorias: categorias.length,
              produtos: 0,
              operadores: 0,
              data: { tipo: "categorias", categorias },
            });
          } else {
            toast.error("Formato CSV nao reconhecido. Use os templates.");
          }
        }
      } catch {
        toast.error("Erro ao ler arquivo. Verifique o formato.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview?.data) return;

    setLoading(true);
    try {
      const res = await fetch("/api/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preview.data),
      });
      const data: ImportResult = await res.json();

      if (!res.ok) {
        toast.error("Erro na importacao");
        return;
      }

      setResult(data);
      toast.success(data.resumo);
    } catch {
      toast.error("Erro ao enviar dados para o servidor");
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setPreview(null);
    setResult(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="p-6 animate-fade-in-up max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Importar Dados
          </h1>
          <p className="text-sm text-muted-foreground">
            Transfira cadastros do seu sistema atual para o PDV
          </p>
        </div>
      </div>

      {/* Step 1 - Download Templates */}
      <Card className="rounded-2xl shadow-sm mb-6 border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-700 text-sm font-bold">
              1
            </div>
            <CardTitle className="text-base">Baixe o template</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Preencha com os dados do seu sistema atual. Use ponto-e-virgula (;) como separador no CSV.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => downloadTemplate(TEMPLATE_PRODUTOS, "template_produtos.csv")}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 press-scale group"
            >
              <Package className="w-6 h-6 text-gray-400 group-hover:text-amber-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">Produtos</span>
              <Badge variant="secondary" className="text-xs">CSV</Badge>
            </button>
            <button
              onClick={() => downloadTemplate(TEMPLATE_CATEGORIAS, "template_categorias.csv")}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 press-scale group"
            >
              <Layers className="w-6 h-6 text-gray-400 group-hover:text-amber-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">Categorias</span>
              <Badge variant="secondary" className="text-xs">CSV</Badge>
            </button>
            <button
              onClick={() => downloadTemplate(TEMPLATE_OPERADORES, "template_operadores.csv")}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all duration-200 press-scale group"
            >
              <Users className="w-6 h-6 text-gray-400 group-hover:text-amber-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">Operadores</span>
              <Badge variant="secondary" className="text-xs">CSV</Badge>
            </button>
            <button
              onClick={() => downloadTemplate(TEMPLATE_JSON, "template_completo.json")}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 press-scale group"
            >
              <FileJson className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700">Completo</span>
              <Badge variant="secondary" className="text-xs">JSON</Badge>
            </button>
          </div>

          {/* Hint */}
          <div className="flex items-start gap-2 mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Dica:</strong> O template de Produtos ja cria as categorias automaticamente.
              Se o seu sistema exporta Excel, salve como CSV com separador ponto-e-virgula (;).
              Para importar tudo de uma vez, use o template JSON completo.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 - Upload File */}
      <Card className="rounded-2xl shadow-sm mb-6 border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-700 text-sm font-bold">
              2
            </div>
            <CardTitle className="text-base">Envie o arquivo preenchido</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFile}
            className="hidden"
            id="file-upload"
          />

          {!preview ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center gap-3 p-10 rounded-2xl border-2 border-dashed border-gray-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all duration-300 cursor-pointer group"
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 group-hover:bg-amber-100 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-gray-400 group-hover:text-amber-600 transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-700">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Formatos aceitos: .csv .json
                </p>
              </div>
            </label>
          ) : (
            <div className="space-y-4">
              {/* File info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">{fileName}</span>
                </div>
                <button onClick={clearAll} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview counts */}
              <div className="grid grid-cols-3 gap-3">
                {preview.categorias > 0 && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Layers className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">{preview.categorias}</p>
                      <p className="text-xs text-gray-500">Categorias</p>
                    </div>
                  </div>
                )}
                {preview.produtos > 0 && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Package className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">{preview.produtos}</p>
                      <p className="text-xs text-gray-500">Produtos</p>
                    </div>
                  </div>
                )}
                {preview.operadores > 0 && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <Users className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="text-lg font-bold text-gray-900">{preview.operadores}</p>
                      <p className="text-xs text-gray-500">Operadores</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Import button */}
              <Button
                onClick={handleImport}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25 press-scale text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Importar Dados
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3 - Result */}
      {result && (
        <Card className="rounded-2xl shadow-sm border-gray-100 animate-fade-in-up">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 text-green-700 text-sm font-bold">
                <CheckCircle className="w-4 h-4" />
              </div>
              <CardTitle className="text-base">Resultado da Importacao</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-800">{result.resumo}</p>
            </div>

            {/* Details */}
            {result.resultado.categorias.criadas > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">{result.resultado.categorias.criadas} categorias criadas</span>
              </div>
            )}
            {result.resultado.produtos.criados > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">{result.resultado.produtos.criados} produtos criados</span>
              </div>
            )}
            {result.resultado.operadores.criados > 0 && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">{result.resultado.operadores.criados} operadores criados</span>
              </div>
            )}

            {/* Errors */}
            {[
              ...result.resultado.categorias.erros,
              ...result.resultado.produtos.erros,
              ...result.resultado.operadores.erros,
            ].length > 0 && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Avisos:
                  </p>
                  {[
                    ...result.resultado.categorias.erros,
                    ...result.resultado.produtos.erros,
                    ...result.resultado.operadores.erros,
                  ].map((err, i) => (
                    <p key={i} className="text-xs text-gray-500 ml-6">
                      {err}
                    </p>
                  ))}
                </div>
              </>
            )}

            <Button
              variant="outline"
              onClick={clearAll}
              className="w-full rounded-xl border-gray-200 hover:border-amber-300 hover:bg-amber-50 mt-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Importar mais dados
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
