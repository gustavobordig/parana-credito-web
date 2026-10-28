import { useRef, useState } from 'react'
import { aguardar, api, ApiError } from './api'
import { CadastroForm } from './components/CadastroForm'
import { CartaoVisual } from './components/CartaoVisual'
import { ConsultaCliente } from './components/ConsultaCliente'
import { FaixasScore } from './components/FaixasScore'
import { LinhaDoTempo, type EstadoEtapa, type Etapa } from './components/LinhaDoTempo'
import { formatarDataHora, formatarMoeda } from './formatos'
import type { CadastroCliente, Cartao, Cliente, Proposta } from './types'

type NomeEtapa = 'cliente' | 'proposta' | 'cartoes'

interface Fluxo {
  correlationId: string
  estados: Record<NomeEtapa, EstadoEtapa>
  cliente?: Cliente
  proposta?: Proposta
  cartoes?: Cartao[]
  erro?: ApiError
}

const novoFluxo = (): Fluxo => ({
  correlationId: crypto.randomUUID(),
  estados: { cliente: 'andamento', proposta: 'pendente', cartoes: 'pendente' },
})

export default function App() {
  const [fluxo, setFluxo] = useState<Fluxo>()
  const controle = useRef<AbortController>(undefined)

  const emAndamento = fluxo !== undefined && Object.values(fluxo.estados).includes('andamento')

  const atualizar = (parcial: Partial<Omit<Fluxo, 'estados'>>, estados?: Partial<Fluxo['estados']>) =>
    setFluxo((atual) => atual && { ...atual, ...parcial, estados: { ...atual.estados, ...estados } })

  const executar = async (passos: (fluxo: Fluxo, sinal: AbortSignal) => Promise<void>) => {
    controle.current?.abort()
    const abort = new AbortController()
    controle.current = abort

    const inicial = novoFluxo()
    setFluxo(inicial)

    try {
      await passos(inicial, abort.signal)
    } catch (e) {
      if (abort.signal.aborted) return
      const erro = e instanceof ApiError ? e : new ApiError(500, { title: 'Erro inesperado.' })
      setFluxo((atual) =>
        atual && {
          ...atual,
          erro,
          estados: Object.fromEntries(
            Object.entries(atual.estados).map(([nome, estado]) => [nome, estado === 'andamento' ? 'erro' : estado]),
          ) as Fluxo['estados'],
        },
      )
    }
  }

  const acompanhar = async (cliente: Cliente, correlationId: string, sinal: AbortSignal) => {
    atualizar({ cliente }, { cliente: 'ok', proposta: 'andamento' })

    const proposta = (await aguardar(() => api.obterProposta(cliente.id, correlationId), (p) => p !== null, { sinal }))!
    if (proposta.status === 'Negada') {
      atualizar({ proposta, cartoes: [] }, { proposta: 'ok', cartoes: 'ignorada' })
      return
    }
    atualizar({ proposta }, { proposta: 'ok', cartoes: 'andamento' })

    const cartoes = await aguardar(
      () => api.listarCartoes(cliente.id, correlationId),
      (c) => c.length >= proposta.quantidadeCartoes,
      { sinal },
    )
    atualizar({ cartoes }, { cartoes: 'ok' })
  }

  const cadastrar = (dados: CadastroCliente) =>
    executar(async ({ correlationId }, sinal) => {
      const cliente = await api.cadastrarCliente(dados, correlationId)
      await acompanhar(cliente, correlationId, sinal)
    })

  const consultar = (id: string) =>
    executar(async ({ correlationId }, sinal) => {
      const cliente = await api.obterCliente(id, correlationId)
      if (!cliente) throw new ApiError(404, { title: 'Cliente não encontrado.' })
      await acompanhar(cliente, correlationId, sinal)
    })

  return (
    <>
      <header className="topo">
        <div className="topo-conteudo">
          <span className="marca">Fluxo de Crédito</span>
          <span className="topo-subtitulo">Cadastro → Proposta → Cartões · 3 microsserviços via RabbitMQ</span>
        </div>
      </header>

      <main className="grade">
        <section className="coluna">
          <CadastroForm enviando={emAndamento} onEnviar={cadastrar} />
          <ConsultaCliente desabilitado={emAndamento} onConsultar={consultar} />
        </section>

        <section className="coluna">
          {fluxo ? <Resultado fluxo={fluxo} /> : <Vazio />}
          <FaixasScore scoreAtual={fluxo?.proposta?.score} />
        </section>
      </main>
    </>
  )
}

function Vazio() {
  return (
    <div className="painel vazio">
      <h2>Acompanhamento</h2>
      <p>Cadastre um cliente para acompanhar a proposta e a emissão dos cartões em tempo real.</p>
    </div>
  )
}

function Resultado({ fluxo }: { fluxo: Fluxo }) {
  const { cliente, proposta, cartoes, erro, estados } = fluxo

  const etapas: Etapa[] = [
    {
      titulo: 'Cliente cadastrado',
      servico: 'Clientes API · publica ClienteCadastrado',
      estado: estados.cliente,
      detalhe: cliente && (
        <>
          {cliente.nome} · CPF {cliente.cpf}
          <code className="id">{cliente.id}</code>
        </>
      ),
    },
    {
      titulo: 'Proposta de crédito',
      servico: 'Propostas API · consome ClienteCadastrado, publica PropostaGerada',
      estado: estados.proposta,
      detalhe: proposta && (
        <>
          Score <strong>{proposta.score}</strong> ·{' '}
          <span className={`selo selo-${proposta.status.toLowerCase()}`}>{proposta.status}</span>
          {proposta.status === 'Aprovada' && (
            <>
              {' '}· {proposta.quantidadeCartoes}× {formatarMoeda(proposta.limitePorCartao)} = {formatarMoeda(proposta.limiteTotal)}
            </>
          )}
        </>
      ),
    },
    {
      titulo: 'Emissão de cartões',
      servico: 'Cartões API · consome PropostaGerada',
      estado: estados.cartoes,
      detalhe: estados.cartoes === 'ignorada' ? 'Proposta negada: nenhum cartão emitido.' : undefined,
    },
  ]

  return (
    <div className="painel">
      <div className="painel-cabecalho">
        <h2>Acompanhamento</h2>
        <span className="correlacao" title="Enviado no header X-Correlation-Id e propagado pelos eventos">
          Correlation ID <code>{fluxo.correlationId.slice(0, 8)}</code>
        </span>
      </div>

      <LinhaDoTempo etapas={etapas} />

      {erro && (
        <div className="alerta" role="alert">
          <strong>{erro.message}</strong>
          {erro.mensagens.length > 0 && (
            <ul>
              {erro.mensagens.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {cliente && cartoes && cartoes.length > 0 && (
        <div className="cartoes">
          {cartoes.map((cartao, i) => (
            <CartaoVisual key={cartao.id} cartao={cartao} titular={cliente.nome} indice={i} />
          ))}
          <p className="nota">Emitidos em {formatarDataHora(cartoes[0].emitidoEm)}</p>
        </div>
      )}
    </div>
  )
}
