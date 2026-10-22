import { useState, type FormEvent } from 'react'
import './App.css'

type Obj = Record<string, unknown>
type Atendimento = Obj
type Requirement = true | false | null

type Spec = {
  section: string
  label: string
  path: string
  always?: boolean
  when?: (a: Atendimento, item?: Obj) => Requirement
  note?: string
  format?: (value: unknown) => string
}

type DisplayRow = {
  section: string
  label: string
  value: unknown
  requirement: Requirement
  note?: string
}

const LINE_NAME_BY_CODE: Record<string, string> = {
  // Preencha somente após confirmar os códigos oficiais de PDI e Metrologia.
}

function get(obj: unknown, path: string): unknown {
  let current = obj

  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Obj)[key]
  }

  return current
}

function lineName(a: Atendimento): string | null {
  const direct = a.linhaAtendimento ?? a.produtoLinhaNome

  if (typeof direct === 'string') return direct.trim().toLowerCase()

  const code = a.produtoLinha
  if (code !== undefined && code !== null) {
    return LINE_NAME_BY_CODE[String(code)]?.toLowerCase() ?? null
  }

  return null
}

function whenStatus(...statuses: number[]) {
  return (a: Atendimento): Requirement => {
    const status = Number(a.idAtendimentoStatus)
    return Number.isFinite(status) ? statuses.includes(status) : null
  }
}

function whenPerson(...types: number[]) {
  return (a: Atendimento): Requirement => {
    const type = Number(get(a, 'cliente.tipoPessoa'))
    return Number.isFinite(type) ? types.includes(type) : null
  }
}

function whenPdi(a: Atendimento): Requirement {
  const line = lineName(a)
  return line ? line === 'pdi' : null
}

function whenNotMetrologia(a: Atendimento): Requirement {
  const line = lineName(a)
  return line ? line !== 'metrologia' : null
}

function whenMetrologia(a: Atendimento): Requirement {
  const line = lineName(a)
  return line ? line === 'metrologia' : null
}

const optional = (): Requirement => false

const specs: Spec[] = [
  // 1ª aba — Atendimento
  { section: 'Atendimento', label: 'ID', path: 'id', always: true },
  {
    section: 'Atendimento',
    label: 'ID do produto regional',
    path: 'produtoRegional.id',
    always: true,
    note: 'O ID de produto nacional não é o mesmo campo.',
  },
  {
    section: 'Atendimento',
    label: 'Nome da unidade',
    path: 'nomeUnidade',
    always: true,
    note: 'A API fornece idUnidade, que é um código, não o nome.',
  },
  {
    section: 'Atendimento',
    label: 'Linha de atendimento',
    path: 'produtoLinha',
    always: true,
    note: 'A API fornece um código; é necessário confirmar a descrição correspondente.',
  },
  {
    section: 'Atendimento',
    label: 'Responsável pela venda / prospecção',
    path: 'responsavelVenda',
    when: optional,
  },
  {
    section: 'Atendimento',
    label: 'O cliente nos conheceu através de',
    path: 'responsavelConhecimento',
    when: optional,
  },
  {
    section: 'Atendimento',
    label: 'Título do projeto / atendimento',
    path: 'titulo',
    always: true,
  },
  {
    section: 'Atendimento',
    label: 'Data de início prevista',
    path: 'dataInicioPrevisto',
    always: true,
  },
  {
    section: 'Atendimento',
    label: 'Data de fim prevista',
    path: 'dataFimPrevisto',
    always: true,
  },
  {
    section: 'Atendimento',
    label: 'Área de serviço',
    path: 'areaServico',
    when: whenPdi,
  },
  {
    section: 'Atendimento',
    label: 'Área de pesquisa',
    path: 'areaPesquisa',
    when: whenPdi,
  },
  { section: 'Atendimento', label: 'Escopo', path: 'escopo', when: whenPdi },
  {
    section: 'Atendimento',
    label: 'Setor atendido',
    path: 'setor',
    always: true,
    note: 'A API fornece um código numérico; confirmar a descrição correspondente.',
  },
  {
    section: 'Atendimento',
    label: 'TRL inicial',
    path: 'trlInicial',
    when: whenPdi,
  },
  {
    section: 'Atendimento',
    label: 'TRL final',
    path: 'trlFinal',
    when: whenPdi,
  },
  {
    section: 'Atendimento',
    label: 'Número da proposta',
    path: 'numeroProposta',
    always: true,
    note: 'Na API, este identificador vem como texto.',
  },
  {
    section: 'Atendimento',
    label: 'Status',
    path: 'idAtendimentoStatus',
    always: true,
    note: 'A API fornece o código do status.',
  },
  {
    section: 'Atendimento',
    label: 'Data de emissão',
    path: 'dataEmissao',
    when: whenStatus(2, 3, 4, 5, 6, 7, 8, 9),
    note: 'A planilha informa que, neste projeto, deve ser igual à data de negociação.',
  },
  {
    section: 'Atendimento',
    label: 'Data de aceitação',
    path: 'dataAceitacao',
    when: whenStatus(4, 5, 6, 7, 8),
  },
  {
    section: 'Atendimento',
    label: 'Data de arquivamento',
    path: 'dataArquivamento',
    when: whenStatus(9),
  },
  {
    section: 'Atendimento',
    label: 'Data de cancelamento',
    path: 'dataCancelamento',
    when: whenStatus(7),
  },
  {
    section: 'Atendimento',
    label: 'Data de conclusão',
    path: 'dataConclusao',
    when: whenStatus(6),
  },
  {
    section: 'Atendimento',
    label: 'Data de execução',
    path: 'dataExecucao',
    when: whenStatus(3, 4, 5, 6, 7, 8),
  },
  {
    section: 'Atendimento',
    label: 'Data de negociação',
    path: 'dataNegociacao',
    when: whenStatus(3, 4, 6, 7, 8),
  },
  {
    section: 'Atendimento',
    label: 'Atendimento em rede?',
    path: 'isRede',
    always: true,
  },
  {
    section: 'Atendimento',
    label: 'ID do atendimento no SGT',
    path: 'idSGT',
    when: optional,
  },

  // 2ª aba — Produto regional
  {
    section: 'Produto regional',
    label: 'ID do produto regional',
    path: 'produtoRegional.id',
    always: true,
  },
  {
    section: 'Produto regional',
    label: 'Nome',
    path: 'produtoRegional.nome',
    always: true,
  },
  {
    section: 'Produto regional',
    label: 'CR',
    path: 'produtoRegional.cr',
    always: true,
  },
  {
    section: 'Produto regional',
    label: 'Regional / nome da unidade',
    path: 'produtoRegional.regional',
    always: true,
    note: 'A API fornece idUnidade, não o nome da unidade.',
  },
  {
    section: 'Produto regional',
    label: 'Status do produto',
    path: 'produtoRegional.isAtivo',
    always: true,
    format: (v) => (v === true ? 'ATIVO' : v === false ? 'INATIVO' : ''),
  },
  {
    section: 'Produto regional',
    label: 'Linha do produto',
    path: 'produtoRegional.linhaNegocio',
    always: true,
    note: 'A API fornece um código; confirmar a descrição correspondente.',
  },
  {
    section: 'Produto regional',
    label: 'Categoria',
    path: 'produtoRegional.categoria',
    always: true,
    note: 'A API fornece um código.',
  },
  {
    section: 'Produto regional',
    label: 'Produto nacional',
    path: 'produtoRegional.nomeProdutoNacional',
    always: true,
    note: 'A API fornece idProdutoNacional, mas não o nome do produto nacional.',
  },

  // 3ª aba — Pessoa atendida
  {
    section: 'Pessoa atendida',
    label: 'ID do atendimento',
    path: 'id',
    always: true,
  },
  {
    section: 'Pessoa atendida',
    label: 'Status do cliente',
    path: 'cliente.isAtivo',
    always: true,
    format: (v) => (v === true ? 'ATIVO' : v === false ? 'INATIVO' : ''),
  },
  {
    section: 'Pessoa atendida',
    label: 'Tipo de pessoa',
    path: 'cliente.tipoPessoa',
    always: true,
  },
  {
    section: 'Pessoa atendida',
    label: 'CPF',
    path: 'cliente.cpf',
    when: whenPerson(1),
  },
  {
    section: 'Pessoa atendida',
    label: 'Nome do cliente',
    path: 'cliente.nome',
    when: whenPerson(1),
  },
  {
    section: 'Pessoa atendida',
    label: 'País',
    path: 'cliente.pais',
    always: true,
  },
  {
    section: 'Pessoa atendida',
    label: 'CEP',
    path: 'cliente.cep',
    always: true,
  },
  {
    section: 'Pessoa atendida',
    label: 'Logradouro',
    path: 'cliente.logradouro',
    when: optional,
  },
  {
    section: 'Pessoa atendida',
    label: 'Número do endereço',
    path: 'cliente.numeroEndereco',
    when: optional,
  },
  {
    section: 'Pessoa atendida',
    label: 'Complemento',
    path: 'cliente.complemento',
    when: optional,
  },
  {
    section: 'Pessoa atendida',
    label: 'Bairro',
    path: 'cliente.bairro',
    when: optional,
  },
  {
    section: 'Pessoa atendida',
    label: 'Cidade',
    path: 'cliente.cidade',
    when: optional,
  },
  {
    section: 'Pessoa atendida',
    label: 'Nome do contato',
    path: 'cliente.contatoNome',
    always: true,
  },
  {
    section: 'Pessoa atendida',
    label: 'Setor do contato',
    path: 'cliente.contatoSetor',
    when: optional,
  },
  {
    section: 'Pessoa atendida',
    label: 'Telefone do contato',
    path: 'cliente.contatoTelefone',
    always: true,
  },
  {
    section: 'Pessoa atendida',
    label: 'E-mail do contato',
    path: 'cliente.contatoEmail',
    always: true,
  },
  {
    section: 'Pessoa atendida',
    label: 'CNPJ',
    path: 'cliente.cnpj',
    when: whenPerson(2),
  },
  {
    section: 'Pessoa atendida',
    label: 'Nome fantasia',
    path: 'cliente.nomeFantasia',
    when: whenPerson(2),
  },
  {
    section: 'Pessoa atendida',
    label: 'Inscrição estadual',
    path: 'cliente.inscricaoEstadual',
    when: whenPerson(2),
  },
  {
    section: 'Pessoa atendida',
    label: 'Razão social',
    path: 'cliente.razaoSocial',
    when: whenPerson(2),
  },
  {
    section: 'Pessoa atendida',
    label: 'Classificação',
    path: 'cliente.classificacao',
    when: whenPerson(2),
  },
  {
    section: 'Pessoa atendida',
    label: 'Número de funcionários',
    path: 'cliente.numeroDeFuncionarios',
    when: whenPerson(2),
  },
  {
    section: 'Pessoa atendida',
    label: 'CNAE principal',
    path: 'cliente.numeroCnaePrincipal',
    when: whenPerson(2),
  },
  {
    section: 'Pessoa atendida',
    label: 'Passaporte',
    path: 'cliente.passaporte',
    when: whenPerson(3),
  },
  {
    section: 'Pessoa atendida',
    label: 'Documento estrangeiro',
    path: 'cliente.documento',
    when: whenPerson(3),
  },

  // 4ª aba — Fonte de recursos
  {
    section: 'Fonte de recursos',
    label: 'ID do atendimento',
    path: 'id',
    always: true,
  },
  {
    section: 'Fonte de recursos',
    label: 'Tipo de fonte pagadora',
    path: 'fonteRecursos[].tipoDeFontePagadora',
    always: true,
  },
  {
    section: 'Fonte de recursos',
    label: 'CNPJ/CPF da fonte de recursos',
    path: 'fonteRecursos[].cnpjFonteRecursos',
    always: true,
  },
  {
    section: 'Fonte de recursos',
    label: 'Nome da fonte de recursos',
    path: 'fonteRecursos[].nomeFonteRecursos',
    always: true,
  },
  {
    section: 'Fonte de recursos',
    label: 'Valor financeiro',
    path: 'fonteRecursos[].valorFinanceiro',
    always: true,
  },
  {
    section: 'Fonte de recursos',
    label: 'Valor econômico',
    path: 'fonteRecursos[].valorEconomico',
    always: true,
  },
  {
    section: 'Fonte de recursos',
    label: 'Agência nacional / recurso regulado',
    path: 'fonteRecursos[].recursoReguladoIsencaoFiscal',
    when: (_a, item) => {
      if (!item) return null
      const type = String(item.tipoDeFontePagadora ?? '').toUpperCase()
      return type ? type === 'ICT' : null
    },
  },
  {
    section: 'Fonte de recursos',
    label: 'Nome da unidade',
    path: 'fonteRecursos[].nomeUnidade',
    when: optional,
  },

  // 5ª aba — Produção prevista
  {
    section: 'Produção prevista',
    label: 'ID do atendimento',
    path: 'id',
    always: true,
  },
  {
    section: 'Produção prevista',
    label: 'Nome da unidade',
    path: 'dadosProducaoPrevisto[].nomeUnidade',
    always: true,
    note: 'A API fornece idUnidade, que é um código, não o nome.',
  },
  {
    section: 'Produção prevista',
    label: 'Produção prevista',
    path: 'dadosProducaoPrevisto[].producaoPrevista',
    when: whenNotMetrologia,
  },
  {
    section: 'Produção prevista',
    label: 'Receita prevista',
    path: 'dadosProducaoPrevisto[].receitaPrevista',
    when: whenNotMetrologia,
  },
  {
    section: 'Produção prevista',
    label: 'Número de ensaios',
    path: 'dadosProducaoPrevisto[].numeroEnsaios',
    when: whenMetrologia,
  },
  {
    section: 'Produção prevista',
    label: 'Número de relatórios ou laudos',
    path: 'dadosProducaoPrevisto[].numeroRelatoriosLaudos',
    when: whenMetrologia,
  },
]

function isObject(value: unknown): value is Obj {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && value.trim() === '')
  )
}

function expand(spec: Spec, a: Atendimento) {
  const match = spec.path.match(/^(.+)\[\]\.(.+)$/)

  if (!match) {
    return [{ label: spec.label, value: get(a, spec.path), item: undefined }]
  }

  const list = get(a, match[1])
  if (!Array.isArray(list) || list.length === 0) {
    return [{ label: `${spec.label} (sem item)`, value: undefined, item: undefined }]
  }

  return list.map((item) => ({
    label: spec.label,
    value: get(item, match[2]),
    item: isObject(item) ? item : undefined,
  }))
}

function displayValue(value: unknown, spec: Spec): string {
  if (isEmpty(value)) return 'Não informado'
  if (spec.format) return spec.format(value)
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function requirement(spec: Spec, a: Atendimento, item?: Obj): Requirement {
  if (spec.always) return true
  if (spec.when) return spec.when(a, item)
  return false
}

function App() {
  const [codigo, setCodigo] = useState('')
  const [results, setResults] = useState<Atendimento[]>([])
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function consultar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setResults([])

    if (!codigo.trim()) {
      setErro('Digite o código da oportunidade para consultar.')
      return
    }

    setCarregando(true)

    try {
      const query = new URLSearchParams({ idOportunidade: codigo.trim() })
      const response = await fetch(`/api/atendimento?${query.toString()}`)

      if (!response.ok) {
        throw new Error(`A API respondeu com o status ${response.status}.`)
      }

      const data: unknown = await response.json()
      const items = Array.isArray(data)
        ? data.filter((item): item is Atendimento => isObject(item) && 'id' in item)
        : isObject(data) && 'id' in data
          ? [data]
          : []

      if (items.length === 0) {
        setErro(`Nenhum atendimento foi encontrado para o código ${codigo.trim()}.`)
        return
      }

      // A busca usa idOportunidade na URL. O campo "id" retornado no JSON
      // identifica o atendimento e pode ter outro valor.
      setResults(items)
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? `Não foi possível consultar a API: ${error.message}`
          : 'Não foi possível consultar a API.',
      )
    } finally {
      setCarregando(false)
    }
  }

  function rowsFor(record: Atendimento): DisplayRow[] {
    return specs.flatMap((spec) =>
      expand(spec, record).map((entry) => {
        const req = requirement(spec, record, entry.item)
        return {
          section: spec.section,
          label: entry.label,
          value: entry.value,
          requirement: req,
          note: spec.note,
        }
      }),
    )
  }

  function renderTable(items: DisplayRow[]) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Campo</th>
              <th>Valor recebido</th>
              <th>Regra</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => {
              const missing = isEmpty(row.value)
              const rowClass =
                row.requirement === true && missing
                  ? 'missing-row'
                  : !missing
                    ? 'present-row'
                    : ''

              const spec = specs.find(
                (candidate) =>
                  candidate.section === row.section &&
                  (row.label === candidate.label ||
                    row.label.startsWith(`${candidate.label} #`) ||
                    row.label.startsWith(`${candidate.label} (`)),
              )

              return (
                <tr className={rowClass} key={`${row.section}-${row.label}-${index}`}>
                  <td>
                    {row.label}
                    {row.note && <small className="note">{row.note}</small>}
                  </td>
                  <td>{displayValue(row.value, spec ?? { section: '', label: '', path: '' })}</td>
                  <td>
                    <span
                      className={`badge ${
                        row.requirement === true
                          ? missing
                            ? 'badge-missing'
                            : 'badge-present'
                          : 'badge-optional'
                      }`}
                    >
                      {row.requirement === true
                        ? missing
                          ? 'Obrigatório: vazio'
                          : 'Obrigatório: informado'
                        : 'Opcional'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img src="/Logo_Consulta_API.png" alt="" className="brand-logo" />
            <span className="brand-name">FIEG <span className="brand-divider">|</span> SENAI</span>
          </div>
          <nav className="topbar-nav" aria-label="Navegação principal">
            <a href="/" aria-current="page">Início</a>
          </nav>
        </div>
      </header>

      <main className="container">
        <h1>Consultar Api</h1>

        <form className="search" onSubmit={consultar}>
          <label htmlFor="codigo">Código da Oportunidade Nectar</label>
          <input
            id="codigo"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value)}
            placeholder="Digite o idOportunidade"
          />
          <button type="submit" disabled={carregando}>
            {carregando ? 'Consultando…' : 'Consultar'}
          </button>
        </form>

        {!carregando && results.length === 0 && !erro && (
          <p className="hint">No NectarCRM, copie da URL o código exibido após “oportunidade” e insira-o aqui.</p>
        )}
        {carregando && <p>Consultando a API…</p>}
        {erro && <div className="error">{erro}</div>}

        {results.map((record, index) => {
          const rows = rowsFor(record)
          const requiredRows = rows.filter((row) => row.requirement === true)
          const optionalRows = rows.filter((row) => row.requirement !== true)

          return (
            <div key={`${String(record.id ?? 'atendimento')}-${index}`}>
              <section className="summary">
                <small>
                  Atendimento ID {String(record.id ?? '—')} &nbsp;•&nbsp; Proposta{' '}
                  {String(record.numeroProposta ?? 'Não informada')}
                </small>
                <h2>{String(record.titulo ?? 'Título não informado')}</h2>
                <span>{String(get(record, 'produtoRegional.nome') ?? '')}</span>
              </section>

              <section className="panel">
                <h2>Campos obrigatórios</h2>
                <p className="hint">
                  Obrigatórios aparecem primeiro. Campos obrigatórios vazios ficam
                  em vermelho.
                </p>
                {renderTable(requiredRows)}
              </section>

              <section className="panel">
                <h2>Outros dados</h2>
                {renderTable(optionalRows)}
              </section>
            </div>
          )
        })}
      </main>
    </div>
  )
}

export default App
