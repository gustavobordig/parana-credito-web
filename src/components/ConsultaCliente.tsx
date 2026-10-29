import { useState, type FormEvent } from 'react'

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function ConsultaCliente({ onConsultar, desabilitado }: { onConsultar: (id: string) => void; desabilitado: boolean }) {
  const [id, setId] = useState('')
  const valido = GUID.test(id.trim())

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (valido) onConsultar(id.trim())
  }

  return (
    <form className="painel consulta" onSubmit={enviar}>
      <div className="painel-titulo">
        <h2 className="titulo-secao">Consultar cliente</h2>
        <p className="nota">Retome o acompanhamento de um cliente já cadastrado.</p>
      </div>
      <div className="linha-consulta">
        <label className="campo-consulta">
          <span className="sr-only">ID do cliente</span>
          <input
            className="mono"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="ID do cliente (GUID)"
            spellCheck={false}
          />
        </label>
        <button type="submit" className="botao-secundario" disabled={!valido || desabilitado}>
          Consultar
        </button>
      </div>
    </form>
  )
}
