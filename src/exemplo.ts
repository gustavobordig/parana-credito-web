import { mascararCpf } from './formatos'

const NOMES = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vanessa', 'Lucas',
]

const SOBRENOMES = [
  'Souza', 'Lima', 'Costa', 'Oliveira', 'Pereira', 'Almeida', 'Ribeiro', 'Carvalho', 'Gomes', 'Martins',
  'Rocha', 'Barbosa', 'Fernandes', 'Araújo', 'Mendes', 'Nascimento', 'Moreira', 'Cardoso', 'Teixeira', 'Freitas',
]

// Uma faixa de renda por resultado de score (score = renda ÷ 10): negado, 1 cartão e 2 cartões.
const FAIXAS_RENDA = [
  { minimo: 300, maximo: 1_000 },
  { minimo: 1_010, maximo: 5_000 },
  { minimo: 5_010, maximo: 15_000 },
]

const inteiro = (minimo: number, maximo: number) => minimo + Math.floor(Math.random() * (maximo - minimo + 1))

const sortear = <T>(lista: readonly T[]) => lista[inteiro(0, lista.length - 1)]

const semAcento = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '')

const dataIso = (data: Date) =>
  `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`

export function gerarCpf() {
  const base = Array.from({ length: 9 }, () => inteiro(0, 9))
  const digito = (numeros: number[]) => {
    const soma = numeros.reduce((acc, n, i) => acc + n * (numeros.length + 1 - i), 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  base.push(digito(base))
  base.push(digito(base))
  return mascararCpf(base.join(''))
}

function gerarNascimento(hoje = new Date()) {
  const anos = (n: number) => new Date(hoje.getFullYear() - n, hoje.getMonth(), hoje.getDate())
  const maisNovo = anos(18).getTime()
  const maisVelho = anos(70).getTime()
  return dataIso(new Date(inteiro(maisVelho, maisNovo)))
}

export function gerarClienteExemplo() {
  const nome = sortear(NOMES)
  const sobrenome = sortear(SOBRENOMES)
  const faixa = sortear(FAIXAS_RENDA)

  return {
    nome: `${nome} ${sobrenome}`,
    cpf: gerarCpf(),
    email: `${semAcento(`${nome}.${sobrenome}`).toLowerCase()}.${inteiro(1000, 9999)}@exemplo.com`,
    dataNascimento: gerarNascimento(),
    rendaMensal: String(inteiro(faixa.minimo, faixa.maximo)),
  }
}
