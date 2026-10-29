import { Fragment, useRef, useState } from 'react'
import { aguardar, api, ApiError } from './api'
import { CadastroForm } from './components/CadastroForm'
import { CartaoVisual } from './components/CartaoVisual'
import { ClientesCadastrados } from './components/ClientesCadastrados'
import { ConsultaCliente } from './components/ConsultaCliente'
import { FaixasScore } from './components/FaixasScore'
import { IconeCheck, IconeSeta, IconeX, Logo } from './components/Icones'
import { LinhaDoTempo, type EstadoEtapa, type Etapa } from './components/LinhaDoTempo'
import { formatarDataHora, formatarMoeda } from './formatos'
import type { CadastroCliente, Cartao, Cliente, Proposta } from './types'

type NomeEtapa = 'cliente' | 'proposta' | 'cartoes'

type Aba = 'fluxo' | 'clientes'

interface Fluxo {
  correlationId: string
  estados: Record<NomeEtapa, EstadoEtapa>
  cliente?: Cliente
  proposta?: Proposta
  cartoes?: Cartao[]
  erro?: ApiError
}

const ESTADOS_INICIAIS: Fluxo['estados'] = { cliente: 'pendente', proposta: 'pendente', cartoes: 'pendente' }

const novoFluxo = (): Fluxo => ({
  correlationId: crypto.randomUUID(),
  estados: { cliente: 'andamento', proposta: 'pendente', cartoes: 'pendente' },
})

export default function App() {
  const [fluxo, setFluxo] = useState<Fluxo>()
  const [aba, setAba] = useState<Aba>('fluxo')
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
      setFluxo(
        (atual) =>
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

    const proposta = (await aguardar(
      () => api.obterProposta(cliente.id, correlationId),
      (p) => p !== null,
      { sinal },
    ))!
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

  const acompanharDaListagem = (id: string) => {
    setAba('fluxo')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    consultar(id)
  }

  return (
    <div className="app">
      <header className="topo">
        <div className="container topo-conteudo">
          <div className="marca">
            <Logo />
            <span className="marca-nome">Paraná Banco</span>
            <span className="marca-divisor" aria-hidden />
            <span className="marca-produto">Crédito</span>
          </div>
          <span className="topo-selo">Ambiente de demonstração</span>
        </div>
        <nav className="container abas" aria-label="Seções">
          <button
            type="button"
            className="aba"
            aria-current={aba === 'fluxo' ? 'page' : undefined}
            onClick={() => setAba('fluxo')}
          >
            Fluxo de crédito
          </button>
          <button
            type="button"
            className="aba"
            aria-current={aba === 'clientes' ? 'page' : undefined}
            onClick={() => setAba('clientes')}
          >
            Clientes cadastrados
          </button>
        </nav>
      </header>

      <div hidden={aba !== 'fluxo'}>
        <Hero estados={fluxo?.estados ?? ESTADOS_INICIAIS} />

        <main className="container grade">
          <div className="coluna coluna-esquerda">
            <CadastroForm enviando={emAndamento} onEnviar={cadastrar} />
            <ConsultaCliente desabilitado={emAndamento} onConsultar={consultar} />
          </div>

          <div className="coluna coluna-direita">
            <Acompanhamento fluxo={fluxo} />
            <FaixasScore scoreAtual={fluxo?.proposta?.score} />
          </div>
        </main>
      </div>

      {aba === 'clientes' && (
        <div>
          <section className="hero hero-compacto">
            <div className="container hero-conteudo">
              <span className="hero-sobretitulo">Moderação</span>
              <h1>Clientes cadastrados</h1>
              <p>Consulte os clientes já cadastrados e retome o acompanhamento da proposta e dos cartões de cada um.</p>
            </div>
          </section>

          <main className="container conteudo-unico">
            <ClientesCadastrados onAcompanhar={acompanharDaListagem} />
          </main>
        </div>
      )}
    </div>
  )
}

const PASSOS_HERO: { nome: NomeEtapa; rotulo: string }[] = [
  { nome: 'cliente', rotulo: 'Cadastro' },
  { nome: 'proposta', rotulo: 'Proposta' },
  { nome: 'cartoes', rotulo: 'Cartões' },
]

function Hero({ estados }: { estados: Fluxo['estados'] }) {
  return (
    <section className="hero">
      <div className="container hero-conteudo">
        <span className="hero-sobretitulo">Fluxo de crédito</span>
        <h1>Peça seu cartão e acompanhe a análise em tempo real</h1>
        <p>Cadastro, proposta e emissão de cartões processados por 3 microsserviços que conversam via RabbitMQ.</p>
        <ol className="hero-passos">
          {PASSOS_HERO.map(({ nome, rotulo }, i) => (
            <Fragment key={nome}>
              {i > 0 && (
                <li className="hero-seta" aria-hidden>
                  <IconeSeta />
                </li>
              )}
              <li className={`hero-passo hero-passo-${estados[nome]}`}>
                <span className="hero-passo-marcador">
                  {estados[nome] === 'ok' ? (
                    <IconeCheck tamanho={14} />
                  ) : estados[nome] === 'erro' ? (
                    <IconeX tamanho={14} />
                  ) : (
                    i + 1
                  )}
                </span>
                {rotulo}
              </li>
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Acompanhamento({ fluxo }: { fluxo?: Fluxo }) {
  const { cliente, proposta, cartoes, erro } = fluxo ?? {}
  const estados = fluxo?.estados ?? ESTADOS_INICIAIS

  const etapas: Etapa[] = [
    {
      titulo: 'Cliente cadastrado',
      servico: 'Clientes API · publica ClienteCadastrado',
      estado: estados.cliente,
      detalhe: cliente && (
        <div className="detalhe-bloco detalhe-coluna">
          <span className="detalhe-principal">
            {cliente.nome} · CPF {cliente.cpf}
          </span>
          <code className="id">{cliente.id}</code>
        </div>
      ),
    },
    {
      titulo: 'Proposta de crédito',
      servico: 'Propostas API · consome ClienteCadastrado, publica PropostaGerada',
      estado: estados.proposta,
      detalhe: proposta && (
        <div className="detalhe-bloco">
          <span className="detalhe-principal">
            Score <strong className="destaque-azul">{proposta.score}</strong>
          </span>
          <span className={`selo selo-${proposta.status.toLowerCase()}`}>{proposta.status}</span>
          {proposta.status === 'Aprovada' ? (
            <span className="detalhe-secundario">
              {proposta.quantidadeCartoes} × {formatarMoeda(proposta.limitePorCartao)} ={' '}
              <strong>{formatarMoeda(proposta.limiteTotal)}</strong>
            </span>
          ) : (
            <span className="detalhe-secundario">Score abaixo de 101</span>
          )}
        </div>
      ),
    },
    {
      titulo: 'Emissão de cartões',
      servico: 'Cartões API · consome PropostaGerada',
      estado: estados.cartoes,
      detalhe:
        estados.cartoes === 'ignorada' ? (
          <span className="detalhe-secundario">Proposta negada: nenhum cartão emitido.</span>
        ) : undefined,
    },
  ]

  return (
    <section className="painel painel-destaque acompanhamento">
      <div className="painel-cabecalho">
        <div className="painel-titulo">
          <h2>Acompanhamento</h2>
          {!fluxo && (
            <p className="nota">
              Cadastre um cliente para acompanhar a proposta e a emissão dos cartões em tempo real.
            </p>
          )}
        </div>
        {fluxo && (
          <span className="correlacao" title="Enviado no header X-Correlation-Id e propagado pelos eventos">
            Correlation ID <code>{fluxo.correlationId.slice(0, 8)}</code>
          </span>
        )}
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

      {cliente && proposta && cartoes && cartoes.length > 0 && (
        <div className="cartoes-emitidos">
          <div className="cartoes-cabecalho">
            <div className="painel-titulo">
              <h3>Cartões emitidos</h3>
              <span className="nota">Emitidos em {formatarDataHora(cartoes[0].emitidoEm)}</span>
            </div>
            <div className="limite-total">
              <span>Limite total</span>
              <strong>{formatarMoeda(proposta.limiteTotal)}</strong>
            </div>
          </div>
          <div className="cartoes">
            {cartoes.map((cartao, i) => (
              <CartaoVisual key={cartao.id} cartao={cartao} titular={cliente.nome} indice={i} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
