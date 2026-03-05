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

export type PerfilOperador = "ADMIN" | "OPERADOR";

export interface OperadorLogado {
  id: number;
  nome: string;
  perfil: PerfilOperador;
}

export interface ItemVendaResponse {
  id: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  produto: { nome: string };
}

export interface VendaResponse {
  id: number;
  total: number;
  formaPagamento: FormaPagamento;
  origem: OrigemVenda;
  createdAt: string;
  itens: ItemVendaResponse[];
  operador: { nome: string };
}

export interface CaixaAberto {
  id: number;
  operadorId: number;
  valorAbertura: number;
  dataAbertura: string;
}
