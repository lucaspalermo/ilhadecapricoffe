import type { DeliveryProvider, PedidoDeliveryExterno } from "./types";

const BASE_URL = "https://merchant-api.ifood.com.br";

interface IFoodToken {
  accessToken: string;
  expiresAt: number;
}

interface IFoodEvent {
  id: string;
  code: string;
  orderId: string;
  createdAt: string;
}

interface IFoodOrderItem {
  name: string;
  quantity: number;
  totalPrice: number;
  observations?: string;
}

interface IFoodOrder {
  id: string;
  displayId: string;
  customer: {
    name: string;
  };
  items: IFoodOrderItem[];
  total: {
    orderAmount: number;
  };
  delivery?: {
    deliveryAddress?: {
      formattedAddress: string;
    };
  };
  orderStatus: string;
  createdAt: string;
}

function gerarPedidosMock(): PedidoDeliveryExterno[] {
  return [
    {
      id: "mock-ifood-001",
      plataforma: "IFOOD",
      cliente: "Maria Silva",
      itens: [
        { nome: "Prato Feito Completo", quantidade: 1, preco: 25.9 },
        { nome: "Suco de Laranja Natural 500ml", quantidade: 2, preco: 8.5, observacao: "Sem gelo" },
      ],
      total: 42.9,
      endereco: "Rua das Flores, 123 - Centro, Sao Paulo - SP",
      status: "PLACED",
      criadoEm: new Date().toISOString(),
    },
    {
      id: "mock-ifood-002",
      plataforma: "IFOOD",
      cliente: "Joao Oliveira",
      itens: [
        { nome: "Coxinha de Frango", quantidade: 3, preco: 7.0 },
        { nome: "Pastel de Carne", quantidade: 2, preco: 8.0 },
        { nome: "Refrigerante Lata 350ml", quantidade: 1, preco: 6.0 },
      ],
      total: 43.0,
      endereco: "Av. Paulista, 1000 - Bela Vista, Sao Paulo - SP",
      status: "PLACED",
      criadoEm: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: "mock-ifood-003",
      plataforma: "IFOOD",
      cliente: "Ana Souza",
      itens: [
        { nome: "Marmitex G - Frango Grelhado", quantidade: 1, preco: 22.0, observacao: "Sem salada, trocar por farofa" },
        { nome: "Agua Mineral 500ml", quantidade: 1, preco: 3.5 },
      ],
      total: 25.5,
      endereco: "Rua Augusta, 500 - Consolacao, Sao Paulo - SP",
      status: "PLACED",
      criadoEm: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    },
  ];
}

export class IFoodProvider implements DeliveryProvider {
  nome = "iFood";

  private clientId: string;
  private clientSecret: string;
  private merchantId: string;
  private token: IFoodToken | null = null;
  private useMock: boolean;

  constructor() {
    this.clientId = process.env.IFOOD_CLIENT_ID ?? "";
    this.clientSecret = process.env.IFOOD_CLIENT_SECRET ?? "";
    this.merchantId = process.env.IFOOD_MERCHANT_ID ?? "";
    this.useMock = !this.clientId || !this.clientSecret || !this.merchantId;

    if (this.useMock) {
      console.warn(
        "[IFoodProvider] Credenciais iFood nao configuradas. Usando dados mock para testes."
      );
    }
  }

  private async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt) {
      return this.token.accessToken;
    }

    const response = await fetch(
      `${BASE_URL}/authentication/v1.0/oauth/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grantType: "client_credentials",
          clientId: this.clientId,
          clientSecret: this.clientSecret,
        }).toString(),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Falha na autenticacao iFood: ${response.status} - ${body}`
      );
    }

    const data = (await response.json()) as {
      accessToken: string;
      expiresIn: number;
    };

    this.token = {
      accessToken: data.accessToken,
      // Expire 60 seconds early to avoid edge-case failures
      expiresAt: Date.now() + (data.expiresIn - 60) * 1000,
    };

    return this.token.accessToken;
  }

  private async apiRequest<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const token = await this.getToken();

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `iFood API erro ${response.status} em ${method} ${path}: ${text}`
      );
    }

    // Some endpoints return 202/204 with no body
    const contentLength = response.headers.get("content-length");
    if (response.status === 204 || contentLength === "0") {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async buscarPedidos(): Promise<PedidoDeliveryExterno[]> {
    if (this.useMock) {
      return gerarPedidosMock();
    }

    // Poll for new events
    const events = await this.apiRequest<IFoodEvent[]>(
      "GET",
      `/order/v1.0/events:polling?types=PLC&groups=ORDER_STATUS&merchantId=${this.merchantId}`
    );

    if (!events || events.length === 0) {
      return [];
    }

    // Fetch full order details for each event
    const pedidos: PedidoDeliveryExterno[] = [];

    for (const event of events) {
      try {
        const order = await this.apiRequest<IFoodOrder>(
          "GET",
          `/order/v1.0/orders/${event.orderId}`
        );

        pedidos.push({
          id: order.id,
          plataforma: "IFOOD",
          cliente: order.customer?.name ?? "Cliente iFood",
          itens: (order.items ?? []).map((item) => ({
            nome: item.name,
            quantidade: item.quantity,
            preco: item.totalPrice,
            observacao: item.observations || undefined,
          })),
          total: order.total?.orderAmount ?? 0,
          endereco:
            order.delivery?.deliveryAddress?.formattedAddress ?? undefined,
          status: order.orderStatus,
          criadoEm: order.createdAt ?? event.createdAt,
        });
      } catch (err) {
        console.error(
          `[IFoodProvider] Erro ao buscar pedido ${event.orderId}:`,
          err
        );
      }
    }

    return pedidos;
  }

  async aceitarPedido(pedidoId: string): Promise<boolean> {
    if (this.useMock) {
      console.log(`[IFoodProvider MOCK] Pedido ${pedidoId} aceito.`);
      return true;
    }

    try {
      await this.apiRequest("POST", `/order/v1.0/orders/${pedidoId}/confirm`);
      return true;
    } catch (err) {
      console.error(`[IFoodProvider] Erro ao aceitar pedido ${pedidoId}:`, err);
      return false;
    }
  }

  async recusarPedido(pedidoId: string, motivo?: string): Promise<boolean> {
    if (this.useMock) {
      console.log(
        `[IFoodProvider MOCK] Pedido ${pedidoId} recusado. Motivo: ${motivo ?? "nenhum"}`
      );
      return true;
    }

    try {
      await this.apiRequest(
        "POST",
        `/order/v1.0/orders/${pedidoId}/cancellationRequested`,
        {
          reason: motivo ?? "Pedido recusado pelo estabelecimento",
        }
      );
      return true;
    } catch (err) {
      console.error(
        `[IFoodProvider] Erro ao recusar pedido ${pedidoId}:`,
        err
      );
      return false;
    }
  }

  async marcarEmPreparo(pedidoId: string): Promise<boolean> {
    if (this.useMock) {
      console.log(
        `[IFoodProvider MOCK] Pedido ${pedidoId} marcado em preparo.`
      );
      return true;
    }

    try {
      await this.apiRequest(
        "POST",
        `/order/v1.0/orders/${pedidoId}/startPreparation`
      );
      return true;
    } catch (err) {
      console.error(
        `[IFoodProvider] Erro ao marcar pedido ${pedidoId} em preparo:`,
        err
      );
      return false;
    }
  }

  async marcarPronto(pedidoId: string): Promise<boolean> {
    if (this.useMock) {
      console.log(`[IFoodProvider MOCK] Pedido ${pedidoId} marcado pronto.`);
      return true;
    }

    try {
      await this.apiRequest(
        "POST",
        `/order/v1.0/orders/${pedidoId}/readyToPickup`
      );
      return true;
    } catch (err) {
      console.error(
        `[IFoodProvider] Erro ao marcar pedido ${pedidoId} como pronto:`,
        err
      );
      return false;
    }
  }
}
