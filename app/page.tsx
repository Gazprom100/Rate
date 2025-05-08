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

export default function Home() {
  const [tokens, setTokens] = useState<any[]>([])
  const [selectedToken, setSelectedToken] = useState<string>('')
  const [timeRange, setTimeRange] = useState<string>('24h')
  const [chartData, setChartData] = useState<any>(null)

  useEffect(() => {
    fetchTokens()
  }, [])

  useEffect(() => {
    if (selectedToken) {
      fetchTokenHistory()
    }
  }, [selectedToken, timeRange])

  const fetchTokens = async () => {
    const { data, error } = await supabase
      .from('tokens')
      .select('*')
      .order('market_cap', { ascending: false })

    if (error) {
      console.error('Error fetching tokens:', error)
      return
    }

    setTokens(data || [])
    if (data && data.length > 0) {
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
      default:
        startDate.setHours(startDate.getHours() - 24)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Decimal Token Rating</h1>
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Token
        </label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          {tokens.map((token) => (
            <option key={token.symbol} value={token.symbol}>
              {token.name} ({token.symbol})
            </option>
          ))}
        </select>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Time Range
        </label>
        <div className="flex space-x-4">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-md ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {chartData && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <Line data={chartData} />
        </div>
      )}
    </div>
  )
} 