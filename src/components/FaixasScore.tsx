import { formatarMoeda } from '../formatos'

const FAIXAS = [
  { faixa: '0 – 100', status: 'Negado', cartoes: 0, limite: null },
  { faixa: '101 – 500', status: 'Aprovado', cartoes: 1, limite: 1_000 },
  { faixa: '501 – 1000', status: 'Aprovado', cartoes: 2, limite: 5_000 },
]

export function FaixasScore({ scoreAtual }: { scoreAtual?: number }) {
  const ativa = (indice: number) =>
    scoreAtual !== undefined && (indice === 0 ? scoreAtual <= 100 : indice === 1 ? scoreAtual <= 500 && scoreAtual > 100 : scoreAtual > 500)

  return (
    <div className="painel">
      <h2>Regras de crédito</h2>
      <p className="nota">Score = renda mensal ÷ 10, com teto de 1000.</p>
      <table className="faixas">
        <thead>
          <tr>
            <th>Score</th>
            <th>Status</th>
            <th>Cartões</th>
            <th>Limite/cartão</th>
          </tr>
        </thead>
        <tbody>
          {FAIXAS.map((f, i) => (
            <tr key={f.faixa} className={ativa(i) ? 'faixa-ativa' : undefined}>
              <td>{f.faixa}</td>
              <td>{f.status}</td>
              <td>{f.cartoes}</td>
              <td>{f.limite ? formatarMoeda(f.limite) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
