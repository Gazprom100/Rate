'use client'

import { useEffect, useState } from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type SortField = 'market_cap' | 'price' | 'reserve' | 'crr' | 'wallets_count' | 'delegation_percentage'
type TimeRange = '24h' | '7d' | '30d' | '1y' | 'all'

interface Token {
  id: string
  symbol: string
  name: string
  price: number
  reserve: number
  crr: number
  wallets_count: number
  delegation_percentage: number
  market_cap: number
}

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')
  const [sortField, setSortField] = useState<SortField>('market_cap')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    fetchTokens()
  }, [sortField, sortDirection])

  useEffect(() => {
    if (selectedToken) {
      fetchTokenHistory()
    }
  }, [selectedToken, timeRange])

  const fetchTokens = async () => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order(sortField, { ascending: sortDirection === 'asc' })

    if (error) {
      console.error('Error fetching tokens:', error)
      return
    }

    setTokens(data || [])
    if (data && data.length > 0 && !selectedToken) {
      setSelectedToken(data[0].symbol)
    }
  }

  const fetchTokenHistory = async () => {
    const now = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
    }

    const { data, error } = await supabase
      .from('token_history')
      .select('*')
      .eq('symbol', selectedToken)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: true })

    if (error) {
      console.error('Error fetching token history:', error)
      return
    }

    if (data) {
      const chartData = {
        labels: data.map(item => format(new Date(item.timestamp), 'HH:mm')),
        datasets: [
          {
            label: `${selectedToken} Price`,
            data: data.map(item => item.price),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }
        ]
      }
      setChartData(chartData)
    }
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2
    }).format(num)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Decimal Token Rating</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="flex space-x-4">
              {[
                { field: 'market_cap', label: 'Market Cap' },
                { field: 'price', label: 'Price' },
                { field: 'reserve', label: 'Reserve' },
                { field: 'crr', label: 'CRR' },
                { field: 'wallets_count', label: 'Wallets' },
                { field: 'delegation_percentage', label: 'Delegation' }
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => {
                    if (sortField === field) {
                      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortField(field as SortField)
                      setSortDirection('desc')
                    }
                  }}
                  className={`px-4 py-2 rounded-md ${
                    sortField === field
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {label} {sortField === field && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <div className="flex space-x-4">
              {[
                { value: '24h', label: '24h' },
                { value: '7d', label: '7d' },
                { value: '30d', label: '30d' },
                { value: '1y', label: '1y' },
                { value: 'all', label: 'All' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value as TimeRange)}
                  className={`px-4 py-2 rounded-md ${
                    timeRange === value
                      ? 'bg-primary text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Token List</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Price</th>
                    <th className="px-4 py-2">Market Cap</th>
                    <th className="px-4 py-2">Reserve</th>
                    <th className="px-4 py-2">CRR</th>
                    <th className="px-4 py-2">Wallets</th>
                    <th className="px-4 py-2">Delegation</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr
                      key={token.symbol}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        selectedToken === token.symbol ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedToken(token.symbol)}
                    >
                      <td className="px-4 py-2">{token.name}</td>
                      <td className="px-4 py-2">${formatNumber(token.price)}</td>
                      <td className="px-4 py-2">${formatNumber(token.market_cap)}</td>
                      <td className="px-4 py-2">${formatNumber(token.reserve)}</td>
                      <td className="px-4 py-2">{formatNumber(token.crr)}%</td>
                      <td className="px-4 py-2">{formatNumber(token.wallets_count)}</td>
                      <td className="px-4 py-2">{formatNumber(token.delegation_percentage)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div>
          {chartData && (
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Price History</h2>
              <Line data={chartData} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 