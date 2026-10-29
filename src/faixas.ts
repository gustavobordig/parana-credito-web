export interface Faixa {
  faixa: string
  minimo: number
  maximo: number
  aprovado: boolean
  cartoes: number
  limite: number | null
}

export const FAIXAS: Faixa[] = [
  { faixa: '0 – 100', minimo: 0, maximo: 100, aprovado: false, cartoes: 0, limite: null },
  { faixa: '101 – 500', minimo: 101, maximo: 500, aprovado: true, cartoes: 1, limite: 1_000 },
  { faixa: '501 – 1000', minimo: 501, maximo: 1000, aprovado: true, cartoes: 2, limite: 5_000 },
]

export const faixaDoScore = (score: number) => FAIXAS.find((f) => score <= f.maximo) ?? FAIXAS[FAIXAS.length - 1]
