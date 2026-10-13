import React, { useEffect, useState } from 'react'
import {
  Users,
  Milk,
  Database,
  Truck,
  Droplet,
  Sparkles,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  UserPlus,
  FilePlus,
  CreditCard,
  BarChart3,
  Thermometer,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type {
  ActivityItem,
  DashboardCharts,
  DashboardMetrics,
  TodaysCollectionSummaryResponse,
} from '../types/mccms'
import {
  fetchDashboardCharts,
  fetchDashboardMetrics,
  fetchRecentActivities,
  fetchTodaysSummary,
} from '../lib/api'

interface DashboardViewProps {
  onNavigate: (view: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [charts, setCharts] = useState<DashboardCharts | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [todaysSummary, setTodaysSummary] = useState<TodaysCollectionSummaryResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [m, c, a, s] = await Promise.all([
          fetchDashboardMetrics(),
          fetchDashboardCharts(),
          fetchRecentActivities(),
          fetchTodaysSummary(),
        ])
        setMetrics(m)
        setCharts(c)
        setActivities(a)
        setTodaysSummary(s)
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading MCCMS Live Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Welcome Banner matching Mockup 1 */}
      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-5 rounded-2xl border border-emerald-100/80 shadow-xs">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Milk className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Good Morning, Manager!</h2>
            <p className="text-xs text-slate-500 font-medium">Friday, 02 October 2026 • Live Monitoring Active</p>
          </div>
        </div>
        <div className="hidden lg:flex items-center space-x-3 text-xs bg-white py-2 px-4 rounded-xl border border-emerald-200/60 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-700">Chilling Station 01:</span>
          <span className="font-bold text-emerald-700">Online & Stabilized (4.2°C)</span>
        </div>
      </div>

      {/* Top Section: 8 KPI Summary Cards (Row 1 & Row 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Farmers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Farmers</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{metrics.active_farmers}</span>
          </div>
          <div className="mt-1 flex items-center text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{metrics.active_farmers_change}</span>
          </div>
        </div>

        {/* Card 2: Today's Collection */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Today's Collection</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Milk className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">
              {Number(metrics.todays_collection_litres).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">L</span>
          </div>
          <div className="mt-1 flex items-center text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{metrics.todays_collection_change}</span>
          </div>
        </div>

        {/* Card 3: Current Stock */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Current Stock</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">
              {Number(metrics.current_stock_litres).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">L</span>
          </div>
          <div className="mt-1 flex items-center text-[11px] font-semibold text-rose-500">
            <TrendingDown className="w-3 h-3 mr-1" />
            <span>{metrics.current_stock_change}</span>
          </div>
        </div>

        {/* Card 4: Today's Dispatch */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Today's Dispatch</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">
              {Number(metrics.todays_dispatch_litres).toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">L</span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            {metrics.todays_dispatch_note}
          </div>
        </div>

        {/* Card 5: Avg. Fat */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Avg. Fat</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Droplet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">{metrics.avg_fat}</span>
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>
          <div className="mt-1 flex items-center text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{metrics.avg_fat_change}</span>
          </div>
        </div>

        {/* Card 6: Avg. SNF */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Avg. SNF</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1.5">
            <span className="text-2xl font-black text-slate-900">{metrics.avg_snf}</span>
            <span className="text-xs font-bold text-slate-500">%</span>
          </div>
          <div className="mt-1 flex items-center text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{metrics.avg_snf_change}</span>
          </div>
        </div>

        {/* Card 7: Pending Farmer Payments */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending Farmer Payments</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-sm font-bold text-slate-600">Rs.</span>
            <span className="text-2xl font-black text-slate-900">
              {Number(metrics.pending_farmer_payments).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            {metrics.pending_farmer_payments_note}
          </div>
        </div>

        {/* Card 8: Pending Input Recovery */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pending Input Recovery</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-sm font-bold text-slate-600">Rs.</span>
            <span className="text-2xl font-black text-slate-900">
              {Number(metrics.pending_input_recovery).toLocaleString('en-US', {
                maximumFractionDigits: 0,
              })}
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-slate-500">
            {metrics.pending_input_recovery_note}
          </div>
        </div>
      </div>

      {/* Middle Section: Collection Bar Chart, Quality Trend Line Chart, and Chilling Stock Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Milk Collection Overview Bar Chart */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Milk Collection Overview</h3>
              <p className="text-[11px] text-slate-400">Morning vs Evening sessions (Litres)</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Last 7 Days
            </span>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.collection_overview || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="morning_litres" name="Morning Session" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="evening_litres" name="Evening Session" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Trend Line Chart */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-800">Quality Trend</h3>
              <p className="text-[11px] text-slate-400">Fat % and SNF % testing averages</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
              Last 7 Days
            </span>
          </div>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts?.quality_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[2, 10]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="fat_pct"
                  name="Fat %"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
                <Line
                  type="monotone"
                  dataKey="snf_pct"
                  name="SNF %"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0284c7' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chilling Stock Status Live Widget */}
        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-800">Chilling Stock</h3>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
              Live
            </span>
          </div>

          <div className="my-3 flex flex-col items-center">
            {/* Chilling Silo / Tank Visual representation */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-slate-300 p-2 flex flex-col justify-end shadow-inner relative overflow-hidden">
                {/* Milk Level Animation */}
                <div
                  className="w-full bg-gradient-to-t from-emerald-100 via-blue-50 to-white rounded-b-xl border-t-2 border-emerald-400 transition-all duration-1000"
                  style={{ height: '72%' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Database className="w-8 h-8 text-slate-400/40" />
                </div>
              </div>
            </div>

            <div className="text-center mt-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {Number(metrics.current_stock_litres).toLocaleString()} L
              </span>
              <p className="text-[11px] font-semibold text-emerald-600">Available Stock (Chilled)</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div className="bg-rose-50/60 p-2 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-500 block">Tank Fat</span>
              <span className="text-xs font-black text-rose-700">{metrics.chilling_stock_fat}%</span>
            </div>
            <div className="bg-sky-50/60 p-2 rounded-xl text-center">
              <span className="text-[10px] font-bold text-sky-500 block">Tank SNF</span>
              <span className="text-xs font-black text-sky-700">{metrics.chilling_stock_snf}%</span>
            </div>
          </div>

          <div className="mt-2 bg-emerald-50/80 p-2.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-800 text-xs font-bold">
              <Thermometer className="w-4 h-4 text-emerald-600" />
              <span>Chamber Temp</span>
            </div>
            <span className="text-xs font-black text-emerald-900">{metrics.chilling_temperature_c} °C</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Today's Collection Table & Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Collection Route Table */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-bold text-sm text-slate-800">
                Today's Collection ({todaysSummary?.date || '02 Oct 2026'})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('collections')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Farmers</th>
                  <th className="py-2.5 px-3">Morning (L)</th>
                  <th className="py-2.5 px-3">Evening (L)</th>
                  <th className="py-2.5 px-3">Total (L)</th>
                  <th className="py-2.5 px-3">Avg Fat %</th>
                  <th className="py-2.5 px-3">Avg SNF %</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                {todaysSummary?.items.map((item) => (
                  <tr key={item.route_code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.route_code}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">{item.farmers_count}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">{item.morning_litres}</td>
                    <td className="py-2.5 px-3 font-semibold text-sky-700">{item.evening_litres}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{item.total_litres}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">{item.avg_fat}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-600">{item.avg_snf}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onNavigate('collections')}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-emerald-50/60 font-bold text-xs text-slate-900 border-t border-emerald-100">
                  <td className="py-3 px-3 uppercase text-[11px]">Total</td>
                  <td className="py-3 px-3">{todaysSummary?.total_farmers}</td>
                  <td className="py-3 px-3 text-emerald-800">{todaysSummary?.total_morning_litres}</td>
                  <td className="py-3 px-3 text-sky-800">{todaysSummary?.total_evening_litres}</td>
                  <td className="py-3 px-3 text-emerald-950 font-black">{todaysSummary?.total_litres}</td>
                  <td className="py-3 px-3">{todaysSummary?.overall_avg_fat}</td>
                  <td className="py-3 px-3">{todaysSummary?.overall_avg_snf}</td>
                  <td className="py-3 px-3 text-right"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Recent Activities Feed */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Recent Activities</h3>
            <span className="text-[11px] font-semibold text-slate-400">Live Feed</span>
          </div>

          <div className="space-y-3">
            {activities.map((act) => (
              <div key={act.id} className="flex items-start space-x-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    act.type === 'collection'
                      ? 'bg-blue-50 text-blue-600'
                      : act.type === 'dispatch'
                      ? 'bg-amber-50 text-amber-600'
                      : act.type === 'sale'
                      ? 'bg-purple-50 text-purple-600'
                      : act.type === 'payment'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {act.type === 'collection' && <Milk className="w-3.5 h-3.5" />}
                  {act.type === 'dispatch' && <Truck className="w-3.5 h-3.5" />}
                  {act.type === 'sale' && <Package className="w-3.5 h-3.5" />}
                  {act.type === 'payment' && <CreditCard className="w-3.5 h-3.5" />}
                  {act.type === 'registration' && <Users className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{act.title}</p>
                  <p className="text-[10px] text-slate-400">{act.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <button
            onClick={() => onNavigate('farmers')}
            className="flex flex-col items-center justify-center p-3 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs transition-all space-y-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Add Farmer</span>
          </button>
          <button
            onClick={() => onNavigate('collections')}
            className="flex flex-col items-center justify-center p-3 bg-blue-50/70 hover:bg-blue-100 text-blue-800 rounded-xl font-bold text-xs transition-all space-y-1.5 shadow-xs"
          >
            <Milk className="w-4 h-4 text-blue-600" />
            <span>New Collection</span>
          </button>
          <button
            onClick={() => onNavigate('dispatch')}
            className="flex flex-col items-center justify-center p-3 bg-purple-50/70 hover:bg-purple-100 text-purple-800 rounded-xl font-bold text-xs transition-all space-y-1.5 shadow-xs"
          >
            <Truck className="w-4 h-4 text-purple-600" />
            <span>Record Dispatch</span>
          </button>
          <button
            onClick={() => onNavigate('input-sales')}
            className="flex flex-col items-center justify-center p-3 bg-amber-50/70 hover:bg-amber-100 text-amber-800 rounded-xl font-bold text-xs transition-all space-y-1.5 shadow-xs"
          >
            <Package className="w-4 h-4 text-amber-600" />
            <span>Issue Input</span>
          </button>
          <button
            onClick={() => onNavigate('expenses')}
            className="flex flex-col items-center justify-center p-3 bg-rose-50/70 hover:bg-rose-100 text-rose-800 rounded-xl font-bold text-xs transition-all space-y-1.5 shadow-xs"
          >
            <FilePlus className="w-4 h-4 text-rose-600" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="flex flex-col items-center justify-center p-3 bg-pink-50/70 hover:bg-pink-100 text-pink-800 rounded-xl font-bold text-xs transition-all space-y-1.5 shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-pink-600" />
            <span>Generate Payments</span>
          </button>
          <button
            onClick={() => onNavigate('daily-reports')}
            className="flex flex-col items-center justify-center p-3 bg-sky-50/70 hover:bg-sky-100 text-sky-800 rounded-xl font-bold text-xs transition-all space-y-1.5 shadow-xs"
          >
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  )
}
