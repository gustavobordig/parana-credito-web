import { useState, type FormEvent } from 'react'
import { estimarScore, formatarMoeda, mascararCpf } from '../formatos'
import type { CadastroCliente } from '../types'

interface Props {
  enviando: boolean
  onEnviar: (dados: CadastroCliente) => void
}

const VAZIO = { nome: '', cpf: '', email: '', dataNascimento: '', rendaMensal: '' }

export function CadastroForm({ enviando, onEnviar }: Props) {
  const [campos, setCampos] = useState(VAZIO)
  const renda = Number(campos.rendaMensal.replace(',', '.')) || 0
  const score = estimarScore(renda)

  const alterar = (campo: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCampos((atual) => ({ ...atual, [campo]: campo === 'cpf' ? mascararCpf(e.target.value) : e.target.value }))

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    onEnviar({ ...campos, rendaMensal: renda })
  }

  const preencherExemplo = () =>
    setCampos({
      nome: 'Maria Silva',
      cpf: gerarCpf(),
      email: `maria.${Date.now().toString(36)}@exemplo.com`,
      dataNascimento: '1990-05-10',
      rendaMensal: '7500',
    })

  return (
    <form className="painel formulario" onSubmit={enviar}>
      <div className="painel-cabecalho">
        <h2>Novo cliente</h2>
        <button type="button" className="botao-link" onClick={preencherExemplo}>
          Preencher exemplo
        </button>
      </div>

      <label>
        Nome completo
        <input value={campos.nome} onChange={alterar('nome')} required maxLength={150} autoComplete="name" />
      </label>

      <div className="linha">
        <label>
          CPF
          <input value={campos.cpf} onChange={alterar('cpf')} required inputMode="numeric" placeholder="000.000.000-00" />
        </label>
        <label>
          Data de nascimento
          <input type="date" value={campos.dataNascimento} onChange={alterar('dataNascimento')} required />
        </label>
      </div>

      <label>
        E-mail
        <input type="email" value={campos.email} onChange={alterar('email')} required autoComplete="email" />
      </label>

      <label>
        Renda mensal (R$)
        <input
          type="number"
          min="0"
          step="0.01"
          value={campos.rendaMensal}
          onChange={alterar('rendaMensal')}
          required
          inputMode="decimal"
        />
      </label>

      <p className="previa">
        Score estimado: <strong>{score}</strong>
        {renda > 0 && <span> · renda de {formatarMoeda(renda)}</span>}
      </p>

      <button type="submit" className="botao-primario" disabled={enviando}>
        {enviando ? 'Processando…' : 'Solicitar crédito'}
      </button>
    </form>
  )
}

function gerarCpf() {
  const base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  const digito = (numeros: number[]) => {
    const soma = numeros.reduce((acc, n, i) => acc + n * (numeros.length + 1 - i), 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  base.push(digito(base))
  base.push(digito(base))
  return mascararCpf(base.join(''))
}
