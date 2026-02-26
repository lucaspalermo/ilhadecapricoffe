// Tipos usados no frontend

export interface ItemCarrinho {
  produtoId: number;
  nome: string;
  preco: number;
  quantidade: number;
  subtotal: number;
}

export type FormaPagamento = "DINHEIRO" | "PIX" | "CARTAO_DEBITO" | "CARTAO_CREDITO";

export type OrigemVenda = "BALCAO" | "IFOOD" | "KEETA" | "99FOOD";

export type StatusCaixa = "ABERTO" | "FECHADO";

export type StatusPedidoDelivery = "NOVO" | "ACEITO" | "EM_PREPARO" | "PRONTO" | "CANCELADO";

export type Plataforma = "IFOOD" | "KEETA" | "99FOOD";

export interface OperadorLogado {
  id: number;
  nome: string;
}

export interface CaixaAberto {
  id: number;
  operadorId: number;
  valorAbertura: number;
  dataAbertura: string;
}
