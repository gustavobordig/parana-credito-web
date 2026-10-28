const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'medium' })

export const formatarMoeda = (valor: number) => moeda.format(valor)

export const formatarDataHora = (iso: string) => dataHora.format(new Date(iso))

export function mascararCpf(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

export const estimarScore = (renda: number) => Math.min(1000, Math.floor(Math.max(0, renda) / 10))
