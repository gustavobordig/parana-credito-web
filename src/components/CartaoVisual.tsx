import { formatarMoeda } from '../formatos'
import type { Cartao } from '../types'

export function CartaoVisual({ cartao, titular, indice }: { cartao: Cartao; titular: string; indice: number }) {
  return (
    <div className={`cartao cartao-${indice % 2}`}>
      <div className="cartao-topo">
        <span className="cartao-chip" aria-hidden />
        <span className="cartao-tipo">Crédito</span>
      </div>
      <span className="cartao-numero">{cartao.numero}</span>
      <div className="cartao-rodape">
        <div>
          <small>Titular</small>
          <span>{titular.toUpperCase()}</span>
        </div>
        <div className="cartao-limite">
          <small>Limite</small>
          <span>{formatarMoeda(cartao.limite)}</span>
        </div>
      </div>
    </div>
  )
}
