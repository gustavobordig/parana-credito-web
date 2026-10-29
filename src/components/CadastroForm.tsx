import { useState, type FormEvent } from 'react'
import { faixaDoScore } from '../faixas'
import { estimarScore, formatarMoeda, mascararCpf } from '../formatos'
import type { CadastroCliente } from '../types'
import { IconeBrilho, Spinner } from './Icones'

interface Props {
  enviando: boolean
  onEnviar: (dados: CadastroCliente) => void
}

const VAZIO = { nome: '', cpf: '', email: '', dataNascimento: '', rendaMensal: '' }

export function CadastroForm({ enviando, onEnviar }: Props) {
  const [campos, setCampos] = useState(VAZIO)
  const renda = Number(campos.rendaMensal.replace(',', '.')) || 0
  const score = estimarScore(renda)
  const faixa = faixaDoScore(score)

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

  const descricaoFaixa = faixa.limite
    ? `${faixa.cartoes} ${faixa.cartoes > 1 ? 'cartões' : 'cartão'} de ${formatarMoeda(faixa.limite)}`
    : 'nenhum cartão'

  return (
    <form className="painel painel-destaque formulario" onSubmit={enviar}>
      <div className="painel-cabecalho">
        <h2>Novo cliente</h2>
        <button type="button" className="botao-link" onClick={preencherExemplo}>
          <IconeBrilho />
          Preencher exemplo
        </button>
      </div>

      <label>
        Nome completo
        <input
          value={campos.nome}
          onChange={alterar('nome')}
          required
          maxLength={150}
          autoComplete="name"
          placeholder="Como está no documento"
        />
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
        <input
          type="email"
          value={campos.email}
          onChange={alterar('email')}
          required
          autoComplete="email"
          placeholder="nome@email.com"
        />
      </label>

      <label>
        Renda mensal
        <span className="grupo-input">
          <span className="grupo-prefixo" aria-hidden>
            R$
          </span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={campos.rendaMensal}
            onChange={alterar('rendaMensal')}
            required
            inputMode="decimal"
            placeholder="0,00"
          />
        </span>
      </label>

      <div className="previa" aria-live="polite">
        <div className="previa-topo">
          <span className="previa-rotulo">Score estimado</span>
          <span className={renda > 0 ? 'previa-valor' : 'previa-valor previa-vazia'}>
            {renda > 0 ? score : '—'}
            <small> / 1000</small>
          </span>
        </div>
        <div className="medidor" aria-hidden>
          <div className="medidor-preenchido" style={{ width: `${score / 10}%` }} />
        </div>
        <span className="previa-faixa">
          {renda > 0 ? `Faixa ${faixa.faixa} · ${descricaoFaixa}` : 'Informe a renda para ver em qual faixa o cliente cai.'}
        </span>
      </div>

      <button type="submit" className="botao-primario" disabled={enviando}>
        {enviando && <Spinner />}
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
