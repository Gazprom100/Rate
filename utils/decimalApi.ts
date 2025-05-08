interface Token {
  id: string
  symbol: string
  name: string
  price: number
  reserve: number
  crr: number
  wallets_count: number
  delegation_percentage: number
  market_cap?: number
}

function calculateMarketCap(token: Token): number {
  return token.price * token.reserve
}

function validateToken(token: any): token is Token {
  return (
    typeof token.id === 'string' &&
    typeof token.symbol === 'string' &&
    typeof token.name === 'string' &&
    typeof token.price === 'number' &&
    typeof token.reserve === 'number' &&
    typeof token.crr === 'number' &&
    typeof token.wallets_count === 'number' &&
    typeof token.delegation_percentage === 'number'
  )
}

export async function fetchTokens(): Promise<Token[]> {
  const response = await fetch('https://api.decimalchain.com/api/v1/coins')
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  const tokens = await response.json()
  if (!Array.isArray(tokens)) {
    throw new Error('Invalid API response format')
  }

  return tokens.filter(validateToken).map(token => ({
    ...token,
    market_cap: calculateMarketCap(token)
  }))
} 