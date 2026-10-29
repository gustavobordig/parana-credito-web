import type { CadastroCliente, Cartao, Cliente, Credenciais, Pagina, ProblemDetails, Proposta, Token } from './types'

const URLS = {
  clientes: import.meta.env.VITE_CLIENTES_API_URL ?? 'http://localhost:5101',
  propostas: import.meta.env.VITE_PROPOSTAS_API_URL ?? 'http://localhost:5102',
  cartoes: import.meta.env.VITE_CARTOES_API_URL ?? 'http://localhost:5103',
}

export class ApiError extends Error {
  readonly status: number
  readonly problema: ProblemDetails

  constructor(status: number, problema: ProblemDetails) {
    super(problema.title ?? `Erro ${status}`)
    this.status = status
    this.problema = problema
  }

  get mensagens(): string[] {
    const { erros, errors, detail } = this.problema
    if (erros?.length) return erros
    if (errors) return Object.values(errors).flat()
    return detail ? [detail] : []
  }
}

async function requisitar<T>(url: string, correlationId: string, init?: RequestInit): Promise<T | null> {
  let resposta: Response
  try {
    resposta = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-Correlation-Id': correlationId, ...init?.headers },
    })
  } catch {
    throw new ApiError(0, { title: 'Serviço indisponível.', detail: `Não foi possível conectar em ${new URL(url).origin}.` })
  }

  if (resposta.status === 404) return null
  if (resposta.status === 429) {
    throw new ApiError(429, { title: 'Muitas tentativas. Aguarde 1 minuto.' })
  }
  if (!resposta.ok) {
    const problema = (await resposta.json().catch(() => ({}))) as ProblemDetails
    throw new ApiError(resposta.status, problema)
  }
  return (await resposta.json()) as T
}

export const api = {
  cadastrarCliente: async (dados: CadastroCliente, correlationId: string) =>
    (await requisitar<Cliente>(`${URLS.clientes}/api/v1/clientes`, correlationId, {
      method: 'POST',
      body: JSON.stringify(dados),
    }))!,

  obterCliente: (id: string, correlationId: string) =>
    requisitar<Cliente>(`${URLS.clientes}/api/v1/clientes/${id}`, correlationId),

  obterProposta: (clienteId: string, correlationId: string) =>
    requisitar<Proposta>(`${URLS.propostas}/api/v1/propostas/${clienteId}`, correlationId),

  listarCartoes: async (clienteId: string, correlationId: string) =>
    (await requisitar<Cartao[]>(`${URLS.cartoes}/api/v1/cartoes/${clienteId}`, correlationId)) ?? [],

  login: async (credenciais: Credenciais, correlationId: string) =>
    (await requisitar<Token>(`${URLS.clientes}/api/v1/auth/login`, correlationId, {
      method: 'POST',
      body: JSON.stringify(credenciais),
    }))!,

  listarClientes: async (
    { pagina, tamanho }: { pagina: number; tamanho: number },
    accessToken: string,
    correlationId: string,
    sinal?: AbortSignal,
  ) => {
    const query = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) })
    return (await requisitar<Pagina<Cliente>>(`${URLS.clientes}/api/v1/clientes?${query}`, correlationId, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: sinal,
    }))!
  },
}

export async function aguardar<T>(
  consulta: () => Promise<T>,
  pronto: (valor: T) => boolean,
  { intervaloMs = 1000, tentativas = 30, sinal }: { intervaloMs?: number; tentativas?: number; sinal?: AbortSignal } = {},
): Promise<T> {
  for (let i = 0; i < tentativas; i++) {
    if (sinal?.aborted) throw new DOMException('Cancelado', 'AbortError')
    const valor = await consulta()
    if (pronto(valor)) return valor
    await new Promise((resolve) => setTimeout(resolve, intervaloMs))
  }
  throw new ApiError(408, { title: 'Tempo esgotado.', detail: 'O processamento está demorando mais que o esperado. Consulte novamente em instantes.' })
}
