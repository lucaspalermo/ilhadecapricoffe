export interface PedidoDeliveryExterno {
  id: string;
  plataforma: "IFOOD" | "KEETA" | "99FOOD";
  cliente: string;
  itens: { nome: string; quantidade: number; preco: number; observacao?: string }[];
  total: number;
  endereco?: string;
  status: string;
  criadoEm: string;
}

export interface DeliveryProvider {
  nome: string;
  buscarPedidos(): Promise<PedidoDeliveryExterno[]>;
  aceitarPedido(pedidoId: string): Promise<boolean>;
  recusarPedido(pedidoId: string, motivo?: string): Promise<boolean>;
  marcarEmPreparo(pedidoId: string): Promise<boolean>;
  marcarPronto(pedidoId: string): Promise<boolean>;
}
