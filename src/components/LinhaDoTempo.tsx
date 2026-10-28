import type { ReactNode } from 'react'

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

export function LinhaDoTempo({ etapas }: { etapas: Etapa[] }) {
  return (
    <ol className="linha-tempo">
      {etapas.map((etapa) => (
        <li key={etapa.titulo} className={`etapa etapa-${etapa.estado}`}>
          <span className="etapa-marcador" aria-hidden />
          <div className="etapa-conteudo">
            <div className="etapa-topo">
              <strong>{etapa.titulo}</strong>
              <span className="etapa-estado">{ROTULOS[etapa.estado]}</span>
            </div>
            <span className="etapa-servico">{etapa.servico}</span>
            {etapa.detalhe && <div className="etapa-detalhe">{etapa.detalhe}</div>}
          </div>
        </li>
      ))}
    </ol>
  )
}
