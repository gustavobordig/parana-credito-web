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
      <h2>Consultar cliente</h2>
      <div className="linha-consulta">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="ID do cliente (GUID)"
          aria-label="ID do cliente"
          spellCheck={false}
        />
        <button type="submit" className="botao-secundario" disabled={!valido || desabilitado}>
          Consultar
        </button>
      </div>
    </form>
  )
}
