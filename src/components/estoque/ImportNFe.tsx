"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ProdutoSistema {
  id: number;
  nome: string;
}

interface ItemNFe {
  xProd: string;     // nome do produto na NF
  qCom: number;      // quantidade
  vUnCom: number;    // custo unitário
  vProd: number;     // valor total do item
  produtoId: string; // id do produto mapeado no sistema (ou "")
}

interface ImportNFeProps {
  open: boolean;
  onClose: () => void;
  produtos: ProdutoSistema[];
  onImported: () => void;
}

function getTextContent(parent: Element, tag: string): string {
  return parent.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
}

export default function ImportNFe({ open, onClose, produtos, onImported }: ImportNFeProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fornecedor, setFornecedor] = useState("");
  const [itens, setItens] = useState<ItemNFe[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const xml = ev.target?.result as string;
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, "text/xml");

        // Fornecedor
        const emitEl = doc.getElementsByTagName("emit")[0];
        const nomeForn = emitEl ? getTextContent(emitEl, "xNome") : "";
        setFornecedor(nomeForn);

        // Itens
        const detEls = Array.from(doc.getElementsByTagName("det"));
        const parsed: ItemNFe[] = detEls.map((det) => {
          const prod = det.getElementsByTagName("prod")[0];
          const xProd = prod ? getTextContent(prod, "xProd") : "";
          const qCom = parseFloat(getTextContent(prod!, "qCom")) || 0;
          const vUnCom = parseFloat(getTextContent(prod!, "vUnCom")) || 0;
          const vProd = parseFloat(getTextContent(prod!, "vProd")) || 0;

          // Tenta casar por nome similar (ignora maiúsculas/acentos)
          const normalizar = (s: string) =>
            s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const xNorm = normalizar(xProd);
          const match = produtos.find((p) =>
            normalizar(p.nome).includes(xNorm.substring(0, 5)) ||
            xNorm.includes(normalizar(p.nome).substring(0, 5))
          );

          return { xProd, qCom, vUnCom, vProd, produtoId: match ? String(match.id) : "" };
        });

        setItens(parsed);
        setStep("review");
      } catch {
        toast.error("Erro ao ler o XML. Verifique se é uma NF-e válida.");
      }
    };
    reader.readAsText(file);
  }

  function updateMapping(index: number, produtoId: string) {
    setItens((prev) =>
      prev.map((item, i) => (i === index ? { ...item, produtoId } : item))
    );
  }

  async function handleConfirm() {
    const mapeados = itens.filter((i) => i.produtoId !== "");
    if (mapeados.length === 0) {
      toast.error("Associe pelo menos um produto da NF ao sistema");
      return;
    }

    setLoading(true);
    try {
      const obs = `NF-e${fornecedor ? ` - ${fornecedor}` : ""}`;

      for (const item of mapeados) {
        await fetch("/api/estoque", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            produtoId: parseInt(item.produtoId),
            quantidade: Math.round(item.qCom),
            observacao: obs,
          }),
        });

        // Atualiza custo unitário do produto se veio na NF
        if (item.vUnCom > 0) {
          await fetch(`/api/produtos/${item.produtoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ custoUnitario: item.vUnCom }),
          });
        }
      }

      toast.success(`${mapeados.length} produto(s) importado(s) com sucesso!`);
      onImported();
      handleClose();
    } catch {
      toast.error("Erro ao importar produtos");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setItens([]);
    setFornecedor("");
    setStep("upload");
    if (fileRef.current) fileRef.current.value = "";
    onClose();
  }

  const mapeados = itens.filter((i) => i.produtoId !== "").length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <FileUp className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg">Importar NF-e (XML)</DialogTitle>
          </div>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileUp className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-800">Selecione o arquivo XML da NF-e</p>
              <p className="text-sm text-gray-500 mt-1">
                O sistema irá ler os produtos e quantidades automaticamente
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xml"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              Escolher arquivo XML
            </Button>
          </div>
        )}

        {step === "review" && (
          <>
            {/* Fornecedor info */}
            {fornecedor && (
              <div className="bg-blue-50 rounded-xl px-4 py-2 text-sm text-blue-800 font-medium mb-2">
                Fornecedor: {fornecedor}
              </div>
            )}

            {/* Status */}
            <div className="flex items-center gap-2 text-sm mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span className="text-gray-600">
                {mapeados} de {itens.length} produto(s) associado(s)
              </span>
              {mapeados < itens.length && (
                <span className="text-amber-600 flex items-center gap-1 ml-2">
                  <AlertCircle className="w-4 h-4" />
                  Itens sem associação serão ignorados
                </span>
              )}
            </div>

            {/* Tabela de itens */}
            <div className="overflow-auto flex-1 rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Item NF-e</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                    <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Custo Unit.</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Produto no Sistema</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item, i) => (
                    <tr key={i} className={`border-t border-gray-50 ${item.produtoId ? "" : "bg-amber-50/50"}`}>
                      <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[180px] truncate" title={item.xProd}>
                        {item.xProd}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">{item.qCom}</td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        R$ {item.vUnCom.toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          value={item.produtoId}
                          onValueChange={(v) => updateMapping(i, v)}
                        >
                          <SelectTrigger className="rounded-lg h-8 text-xs w-full">
                            <SelectValue placeholder="Selecionar produto..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="" className="text-gray-400 rounded-lg">
                              — Ignorar este item —
                            </SelectItem>
                            {produtos.map((p) => (
                              <SelectItem key={p.id} value={String(p.id)} className="rounded-lg text-xs">
                                {p.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                className="rounded-xl border-gray-200"
                disabled={loading}
              >
                <X className="w-4 h-4 mr-1" />
                Trocar arquivo
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || mapeados === 0}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importando...</>
                ) : (
                  <>Confirmar Entrada ({mapeados} produto{mapeados !== 1 ? "s" : ""})</>
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
