import type { ReactNode } from 'react'
import { IconeCheck, IconeTraco, IconeX, Spinner } from './Icones'

export type EstadoEtapa = 'pendente' | 'andamento' | 'ok' | 'ignorada' | 'erro'

export interface Etapa {
  titulo: string
  servico: string
  estado: EstadoEtapa
  detalhe?: ReactNode
}

const ROTULOS: Record<EstadoEtapa, string> = {
  pendente: 'Aguardando',
  andamento: 'Processando',
  ok: 'Concluído',
  ignorada: 'Não se aplica',
  erro: 'Falhou',
}

function Marcador({ estado, numero }: { estado: EstadoEtapa; numero: number }) {
  switch (estado) {
    case 'ok':
      return <IconeCheck />
    case 'andamento':
      return <Spinner />
    case 'erro':
      return <IconeX />
    case 'ignorada':
      return <IconeTraco />
    default:
      return <>{numero}</>
  }
}

export function LinhaDoTempo({ etapas }: { etapas: Etapa[] }) {
  return (
    <ol className="linha-tempo">
      {etapas.map((etapa, i) => (
        <li key={etapa.titulo} className={`etapa etapa-${etapa.estado}`}>
          <div className="etapa-trilho">
            <span className="etapa-marcador" aria-hidden>
              <Marcador estado={etapa.estado} numero={i + 1} />
            </span>
            {i < etapas.length - 1 && <span className="etapa-conector" aria-hidden />}
          </div>
          <div className="etapa-conteudo">
            <div className="etapa-topo">
              <strong>{etapa.titulo}</strong>
              <span className={`selo selo-estado-${etapa.estado}`}>{ROTULOS[etapa.estado]}</span>
            </div>
            <span className="etapa-servico">{etapa.servico}</span>
            {etapa.detalhe && <div className="etapa-detalhe">{etapa.detalhe}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
