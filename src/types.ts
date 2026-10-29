export interface CadastroCliente {
  nome: string
  cpf: string
  email: string
  dataNascimento: string
  rendaMensal: number
}

export interface Cliente {
  id: string
  nome: string
  cpf: string
  email: string
  dataNascimento: string
  rendaMensal: number
  criadoEm: string
}

export type StatusProposta = 'Aprovada' | 'Negada'

export interface Proposta {
  id: string
  clienteId: string
  score: number
  status: StatusProposta
  limitePorCartao: number
  quantidadeCartoes: number
  limiteTotal: number
  criadaEm: string
}

export interface Cartao {
  id: string
  propostaId: string
  numero: string
  limite: number
  emitidoEm: string
}

export interface Credenciais {
  usuario: string
  senha: string
}

export interface Token {
  accessToken: string
  tokenType: 'Bearer'
  expiraEm: string
}

export interface Pagina<T> {
  itens: T[]
  pagina: number
  tamanho: number
  total: number
  totalPaginas: number
}

export interface ProblemDetails {
  title?: string
  detail?: string
  status?: number
  erros?: string[]
  errors?: Record<string, string[]>
}
