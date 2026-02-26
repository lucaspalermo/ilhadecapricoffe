import type { DeliveryProvider, PedidoDeliveryExterno } from "./types";
import { IFoodProvider } from "./ifood";

export type { DeliveryProvider, PedidoDeliveryExterno } from "./types";

class StubProvider implements DeliveryProvider {
  nome: string;

  constructor(nome: string) {
    this.nome = nome;
  }

  async buscarPedidos(): Promise<PedidoDeliveryExterno[]> {
    console.warn(`[${this.nome}] Provider nao implementado. buscarPedidos() ignorado.`);
    return [];
  }

  async aceitarPedido(pedidoId: string): Promise<boolean> {
    console.warn(`[${this.nome}] Provider nao implementado. aceitarPedido(${pedidoId}) ignorado.`);
    return false;
  }

  async recusarPedido(pedidoId: string, motivo?: string): Promise<boolean> {
    console.warn(
      `[${this.nome}] Provider nao implementado. recusarPedido(${pedidoId}, ${motivo ?? ""}) ignorado.`
    );
    return false;
  }

  async marcarEmPreparo(pedidoId: string): Promise<boolean> {
    console.warn(
      `[${this.nome}] Provider nao implementado. marcarEmPreparo(${pedidoId}) ignorado.`
    );
    return false;
  }

  async marcarPronto(pedidoId: string): Promise<boolean> {
    console.warn(
      `[${this.nome}] Provider nao implementado. marcarPronto(${pedidoId}) ignorado.`
    );
    return false;
  }
}

const providers: Record<string, () => DeliveryProvider> = {
  IFOOD: () => new IFoodProvider(),
  KEETA: () => new StubProvider("Keeta"),
  "99FOOD": () => new StubProvider("99Food"),
};

export function getDeliveryProvider(
  plataforma: "IFOOD" | "KEETA" | "99FOOD"
): DeliveryProvider {
  const factory = providers[plataforma];

  if (!factory) {
    throw new Error(`Plataforma de delivery desconhecida: ${plataforma}`);
  }

  return factory();
}
