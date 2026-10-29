import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api'
import { formatarDataHoraCurta, formatarMoeda } from '../formatos'
import { apagarSessao, lerSessao, salvarSessao, sessaoExpirada, type Sessao } from '../sessao'
import type { Cliente, Pagina } from '../types'
import { Spinner } from './Icones'

const TAMANHO_PAGINA = 20
const SESSAO_EXPIRADA = 'Sessão expirada. Entre novamente.'

function sessaoInicial(): { sessao: Sessao | null; aviso?: string } {
  const sessao = lerSessao()
  if (sessao && sessaoExpirada(sessao)) {
    apagarSessao()
    return { sessao: null, aviso: SESSAO_EXPIRADA }
  }
  return { sessao }
}

export function ClientesCadastrados({ onAcompanhar }: { onAcompanhar: (id: string) => void }) {
  const [inicial] = useState(sessaoInicial)
  const [sessao, setSessao] = useState<Sessao | null>(inicial.sessao)
  const [aviso, setAviso] = useState(inicial.aviso)

  const entrar = (nova: Sessao) => {
    setAviso(undefined)
    setSessao(nova)
  }

  const encerrar = (mensagem?: string) => {
    apagarSessao()
    setSessao(null)
    setAviso(mensagem)
  }

  return sessao ? (
    <Listagem
      sessao={sessao}
      onAcompanhar={onAcompanhar}
      onExpirar={() => encerrar(SESSAO_EXPIRADA)}
      onSair={() => encerrar()}
    />
  ) : (
    <Login aviso={aviso} onEntrar={entrar} />
  )
}

function Login({ aviso, onEntrar }: { aviso?: string; onEntrar: (sessao: Sessao) => void }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<ApiError>()

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setEnviando(true)
    setErro(undefined)
    try {
      const token = await api.login({ usuario: usuario.trim(), senha }, crypto.randomUUID())
      onEntrar(salvarSessao(token))
    } catch (falha) {
      setErro(falha instanceof ApiError ? falha : new ApiError(500, { title: 'Erro inesperado.' }))
    } finally {
      setSenha('')
      setEnviando(false)
    }
  }

  return (
    <form className="painel painel-destaque login" onSubmit={enviar}>
      <div className="painel-titulo">
        <h2>Área do moderador</h2>
        <p className="nota">Entre com o usuário de moderador para ver os clientes cadastrados.</p>
      </div>

      {aviso && !erro && (
        <div className="aviso" role="status">
          {aviso}
        </div>
      )}

      {erro && (
        <div className="alerta" role="alert">
          <strong>{erro.status === 401 ? 'Usuário ou senha inválidos.' : erro.message}</strong>
          {erro.status !== 401 && erro.mensagens.length > 0 && (
            <ul>
              {erro.mensagens.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="formulario">
        <label>
          Usuário
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
      </div>

      <button type="submit" className="botao-primario" disabled={enviando}>
        {enviando && <Spinner />}
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

interface ListagemProps {
  sessao: Sessao
  onAcompanhar: (id: string) => void
  onExpirar: () => void
  onSair: () => void
}

function Listagem({ sessao, onAcompanhar, onExpirar, onSair }: ListagemProps) {
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState<Pagina<Cliente>>()
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<ApiError>()

  useEffect(() => {
    if (sessaoExpirada(sessao)) {
      onExpirar()
      return
    }

    const abort = new AbortController()
    setCarregando(true)
    setErro(undefined)

    api
      .listarClientes({ pagina, tamanho: TAMANHO_PAGINA }, sessao.accessToken, crypto.randomUUID(), abort.signal)
      .then((resultado) => {
        if (abort.signal.aborted) return
        setDados(resultado)
        setCarregando(false)
      })
      .catch((falha) => {
        if (abort.signal.aborted) return
        if (falha instanceof ApiError && falha.status === 401) {
          onExpirar()
          return
        }
        setErro(falha instanceof ApiError ? falha : new ApiError(500, { title: 'Erro inesperado.' }))
        setCarregando(false)
      })

    return () => abort.abort()
    // onExpirar muda a cada render do pai; a busca depende só da sessão e da página.
  }, [sessao, pagina])

  const totalPaginas = Math.max(1, dados?.totalPaginas ?? 1)

  return (
    <section className="painel painel-destaque listagem" aria-busy={carregando}>
      <div className="painel-cabecalho">
        <div className="painel-titulo">
          <h2>Lista de clientes</h2>
          <p className="nota">
            {dados
              ? `${dados.total} ${dados.total === 1 ? 'cliente' : 'clientes'} · do mais recente para o mais antigo`
              : 'Carregando…'}
          </p>
        </div>
        <button type="button" className="botao-secundario botao-compacto" onClick={onSair}>
          Sair
        </button>
      </div>

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

      {dados && dados.itens.length === 0 && !erro && <p className="lista-vazia">Nenhum cliente cadastrado ainda.</p>}

      {dados && dados.itens.length > 0 && (
        <div className={carregando ? 'tabela-caixa tabela-carregando' : 'tabela-caixa'}>
          <table className="tabela-clientes">
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">CPF</th>
                <th scope="col">E-mail</th>
                <th scope="col" className="numero">
                  Renda
                </th>
                <th scope="col">Cadastro</th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.itens.map((cliente) => (
                <tr key={cliente.id}>
                  <td data-rotulo="Nome" className="celula-nome">
                    {cliente.nome}
                  </td>
                  <td data-rotulo="CPF" className="mono">
                    {cliente.cpf}
                  </td>
                  <td data-rotulo="E-mail" className="celula-email">
                    {cliente.email}
                  </td>
                  <td data-rotulo="Renda" className="numero">
                    {formatarMoeda(cliente.rendaMensal)}
                  </td>
                  <td data-rotulo="Cadastro">{formatarDataHoraCurta(cliente.criadoEm)}</td>
                  <td className="celula-acao">
                    <button
                      type="button"
                      className="botao-secundario botao-compacto"
                      onClick={() => onAcompanhar(cliente.id)}
                      aria-label={`Acompanhar ${cliente.nome}`}
                    >
                      Acompanhar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!dados && carregando && (
        <p className="lista-vazia">
          <Spinner /> Carregando clientes…
        </p>
      )}

      <nav className="paginacao" aria-label="Paginação">
        <button
          type="button"
          className="botao-secundario botao-compacto"
          onClick={() => setPagina((p) => p - 1)}
          disabled={carregando || pagina <= 1}
        >
          Anterior
        </button>
        <span className="paginacao-status" aria-live="polite">
          Página {pagina} de {totalPaginas}
        </span>
        <button
          type="button"
          className="botao-secundario botao-compacto"
          onClick={() => setPagina((p) => p + 1)}
          disabled={carregando || pagina >= totalPaginas}
        >
          Próxima
        </button>
      </nav>
    </section>
  )
}
