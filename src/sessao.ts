import type { Token } from './types'

// Guardada só no sessionStorage: some ao fechar a aba e nunca vai para o localStorage nem para a URL.
const CHAVE = 'parana-credito:sessao'

export interface Sessao {
  accessToken: string
  expiraEm: string
}

export const sessaoExpirada = (sessao: Sessao, agora = Date.now()) => new Date(sessao.expiraEm).getTime() <= agora

export function lerSessao(): Sessao | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE)
    if (!bruto) return null
    const sessao = JSON.parse(bruto) as Partial<Sessao>
    return sessao.accessToken && sessao.expiraEm ? { accessToken: sessao.accessToken, expiraEm: sessao.expiraEm } : null
  } catch {
    return null
  }
}

export function salvarSessao({ accessToken, expiraEm }: Token): Sessao {
  const sessao = { accessToken, expiraEm }
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(sessao))
  } catch {
    // Sem sessionStorage (aba privada restrita): a sessão vale enquanto a página estiver aberta.
  }
  return sessao
}

export function apagarSessao() {
  try {
    sessionStorage.removeItem(CHAVE)
  } catch {
    // Nada a apagar.
  }
}
