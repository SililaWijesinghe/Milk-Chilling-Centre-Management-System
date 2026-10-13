import React, { useEffect, useState } from 'react'
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Thermometer,
  TrendingUp,
  RefreshCw,
  Sun,
  Moon,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type {
  DailyQualityBreakdownItem,
  QualitySummaryData,
  QualityTrendPoint,
} from '../types/mccms'
import {
  fetchQualityDailyBreakdown,
  fetchQualitySummary,
  fetchQualityTrends,
} from '../lib/api'

export const QualityAnalysisView: React.FC = () => {
  const [summary, setSummary] = useState<QualitySummaryData | null>(null)
  const [trends, setTrends] = useState<QualityTrendPoint[]>([])
  const [breakdown, setBreakdown] = useState<DailyQualityBreakdownItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [trendDays, setTrendDays] = useState<number>(7)

  const loadData = async () => {
    setLoading(true)
    try {
      const [sumRes, trendRes, breakRes] = await Promise.all([
        fetchQualitySummary(),
        fetchQualityTrends(trendDays),
        fetchQualityDailyBreakdown(1, 20),
      ])
      setSummary(sumRes)
      setTrends(trendRes)
      setBreakdown(breakRes.items)
    } catch (err) {
      console.error('Failed to load quality data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [trendDays])

  // Chart colors for pie
  const STATUS_COLORS: Record<string, string> = {
    Accepted: '#10b981',
    Rejected: '#ef4444',
    Acidic: '#f59e0b',
  }

  const pieData = summary?.status_distribution.map((item) => ({
    name: item.status,
    value: parseFloat(item.litres) || item.count,
    color: STATUS_COLORS[item.status] || '#64748b',
  })) || []

  if (loading && !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading Quality Analytics & Lab Metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <FlaskConical className="w-4 h-4" />
            <span>Laboratory & Testing Analytics • UI Mockup 5</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Quality Analysis & Compliance
          </h1>
          <p className="text-xs text-slate-500">
            Real-time quality testing aggregation, Fat & SNF trends, acidity tracking, and route compliance
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Trend Range Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
            <button
              onClick={() => setTrendDays(7)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendDays === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setTrendDays(14)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendDays === 14 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              14 Days
            </button>
            <button
              onClick={() => setTrendDays(30)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                trendDays === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={() => loadData()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Refresh analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Fat % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg Fat %
            </span>
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Target ≥ 3.5%
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-slate-800">
              {summary?.avg_fat || '3.72'}%
            </span>
            <span className="text-[11px] font-bold text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +0.02
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Compliant with dairy matrix
          </p>
        </div>

        {/* SNF % */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Avg SNF %
            </span>
            <span className="text-[10px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
              Target ≥ 8.0%
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-slate-800">
              {summary?.avg_snf || '8.34'}%
            </span>
            <span className="text-[11px] font-bold text-blue-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +0.04
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Solid-not-fat density optimal
          </p>
        </div>

        {/* Acceptance Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Acceptance Rate
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-emerald-600">
              {summary?.acceptance_rate || '97.7'}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {summary?.accepted_litres || '4,820'} L accepted for chilling
          </p>
        </div>

        {/* Acidic Spoilage */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Acidic Spoilage
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-amber-600">
              {summary?.acidic_rate || '0.8'}%
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              ({summary?.acidic_litres || '42'} L)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Rejection: {summary?.rejection_rate || '1.5'}%
          </p>
        </div>

        {/* Reception Temp */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Reception Temp
            </span>
            <Thermometer className="w-4 h-4 text-rose-500" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-black text-slate-800">
              {summary?.avg_temperature_c || '4.5'}°C
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {summary?.total_tests || 128} tests conducted
          </p>
        </div>
      </div>

      {/* 3. Recharts Trend Lines & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Recharts Fat & SNF Trend Lines (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                Quality Trends: Fat % & SNF %
              </h2>
              <p className="text-xs text-slate-500">
                Daily averages tracked against regulatory minimum compliance lines
              </p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-bold">
              <span className="flex items-center text-emerald-600">
                <span className="w-3 h-3 rounded-full bg-emerald-500 mr-1.5" /> Fat %
              </span>
              <span className="flex items-center text-blue-600">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-1.5" /> SNF %
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={600}
                />
                <YAxis
                  domain={[3.0, 9.0]}
                  tickLine={false}
                  stroke="#94a3b8"
                  fontSize={11}
                  fontWeight={600}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <ReferenceLine
                  y={3.5}
                  label={{ value: 'Min Fat 3.5%', position: 'right', fill: '#10b981', fontSize: 10 }}
                  stroke="#10b981"
                  strokeDasharray="4 4"
                />
                <ReferenceLine
                  y={8.0}
                  label={{ value: 'Min SNF 8.0%', position: 'right', fill: '#3b82f6', fontSize: 10 }}
                  stroke="#3b82f6"
                  strokeDasharray="4 4"
                />
                <Line
                  type="monotone"
                  dataKey="fat"
                  name="Fat %"
                  data={trends.map((t) => ({ ...t, fat: parseFloat(t.avg_fat) }))}
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="snf"
                  name="SNF %"
                  data={trends.map((t) => ({ ...t, snf: parseFloat(t.avg_snf) }))}
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quality Status Distribution Donut (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Quality Acceptance Ratio
            </h2>
            <p className="text-xs text-slate-500">
              Breakdown of total milk volume by test verdict
            </p>
          </div>

          <div className="h-48 w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl font-black text-slate-800">
                {summary?.acceptance_rate || '97.7'}%
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Accepted
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            {summary?.status_distribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[item.status] }}
                  />
                  <span className="font-bold text-slate-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-slate-500">{item.litres} L</span>
                  <span className="font-extrabold text-slate-900 w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Session Breakdown Comparison (Morning vs Evening) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Morning Session Card */}
        <div className="bg-gradient-to-br from-amber-50/50 via-white to-white p-5 rounded-2xl border border-amber-200/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Morning Session Quality</h3>
                <p className="text-[11px] text-slate-500">Cooler ambient transport conditions</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {summary?.session_breakdown.morning.acceptance_rate || '98.6'}% Accepted
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Volume</span>
              <span className="text-xs font-black text-slate-800">
                {summary?.session_breakdown.morning.litres || '2,780'} L
              </span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Fat</span>
              <span className="text-xs font-black text-emerald-600">
                {summary?.session_breakdown.morning.avg_fat || '3.74'}%
              </span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">SNF</span>
              <span className="text-xs font-black text-blue-600">
                {summary?.session_breakdown.morning.avg_snf || '8.36'}%
              </span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Rejections</span>
              <span className="text-xs font-black text-rose-600">
                {summary?.session_breakdown.morning.rejection_count || 1}
              </span>
            </div>
          </div>
        </div>

        {/* Evening Session Card */}
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-white p-5 rounded-2xl border border-indigo-200/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800">Evening Session Quality</h3>
                <p className="text-[11px] text-slate-500">Afternoon heat index monitoring</p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
              {summary?.session_breakdown.evening.acceptance_rate || '96.4'}% Accepted
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Volume</span>
              <span className="text-xs font-black text-slate-800">
                {summary?.session_breakdown.evening.litres || '2,157'} L
              </span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Fat</span>
              <span className="text-xs font-black text-emerald-600">
                {summary?.session_breakdown.evening.avg_fat || '3.70'}%
              </span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">SNF</span>
              <span className="text-xs font-black text-blue-600">
                {summary?.session_breakdown.evening.avg_snf || '8.31'}%
              </span>
            </div>
            <div className="text-center p-2 bg-white rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold block">Rejections</span>
              <span className="text-xs font-black text-rose-600">
                {summary?.session_breakdown.evening.rejection_count || 2}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Daily Quality Breakdown Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Daily Quality & Grading Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Historical record of route quality conformance and laboratory ratings
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {breakdown.length} Records
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Session</th>
                <th className="py-2.5 px-3">Route</th>
                <th className="py-2.5 px-3 text-center">Samples</th>
                <th className="py-2.5 px-3 text-right">Volume (L)</th>
                <th className="py-2.5 px-3 text-center">Avg Fat</th>
                <th className="py-2.5 px-3 text-center">Avg SNF</th>
                <th className="py-2.5 px-3 text-center">Temp (°C)</th>
                <th className="py-2.5 px-3 text-center">Quality Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {breakdown.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-2.5 px-3 font-bold text-slate-800">{row.date}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        row.session === 'Morning'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {row.session}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-600">
                    {row.route_code}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                    {row.samples}
                  </td>
                  <td className="py-2.5 px-3 text-right font-black text-slate-900">
                    {row.total_litres}
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-extrabold">
                    {row.avg_fat}%
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-700 font-extrabold">
                    {row.avg_snf}%
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">
                    {row.avg_temp}°C
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        row.quality_grade === 'Grade A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : row.quality_grade === 'Standard'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {row.quality_grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default QualityAnalysisView
