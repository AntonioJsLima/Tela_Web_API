export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') {
      return Response.json({ error: 'Método não permitido.' }, { status: 405 })
    }

    const requestUrl = new URL(request.url)
    const idOportunidade = requestUrl.searchParams.get('idOportunidade')?.trim()

    if (!idOportunidade) {
      return Response.json(
        { error: 'O parâmetro idOportunidade é obrigatório.' },
        { status: 400 },
      )
    }

    const apiToken = process.env.FIEG_API_TOKEN

    if (!apiToken) {
      return Response.json(
        { error: 'A variável de ambiente FIEG_API_TOKEN não está configurada.' },
        { status: 500 },
      )
    }

    const apiUrl = new URL('https://www.fieg.com.br/crm/api/1/atendimento')
    apiUrl.searchParams.set('idOportunidade', idOportunidade)
    apiUrl.searchParams.set('api_token', apiToken)

    try {
      const apiResponse = await fetch(apiUrl, { cache: 'no-store' })
      const body = await apiResponse.text()

      return new Response(body, {
        status: apiResponse.status,
        headers: {
          'Content-Type': apiResponse.headers.get('content-type') ?? 'application/json',
          'Cache-Control': 'no-store',
        },
      })
    } catch {
      return Response.json(
        { error: 'Não foi possível conectar à API do atendimento.' },
        { status: 502 },
      )
    }
  },
}
