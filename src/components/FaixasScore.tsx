import { FAIXAS, faixaDoScore } from '../faixas'
import { formatarMoeda } from '../formatos'

export function FaixasScore({ scoreAtual }: { scoreAtual?: number }) {
  const ativa = scoreAtual !== undefined ? faixaDoScore(scoreAtual) : undefined

  return (
    <section className="painel">
      <div className="painel-cabecalho">
        <h2 className="titulo-secao">Regras de crédito</h2>
        <span className="nota">Score = renda mensal ÷ 10, com teto de 1000</span>
      </div>
      <ul className="faixas">
        {FAIXAS.map((f) => {
          const destacada = f === ativa
          return (
            <li key={f.faixa} className={destacada ? 'faixa faixa-ativa' : 'faixa'}>
              <span className="faixa-rotulo">{destacada ? 'Score · faixa do cliente' : 'Score'}</span>
              <strong className="faixa-intervalo">{f.faixa}</strong>
              <span className={`selo ${f.aprovado ? 'selo-aprovada' : 'selo-negada'}`}>
                {f.aprovado ? 'Aprovado' : 'Negado'}
              </span>
              <span className="faixa-descricao">
                {f.limite ? `${f.cartoes} ${f.cartoes > 1 ? 'cartões' : 'cartão'} de ${formatarMoeda(f.limite)}` : 'Nenhum cartão'}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
