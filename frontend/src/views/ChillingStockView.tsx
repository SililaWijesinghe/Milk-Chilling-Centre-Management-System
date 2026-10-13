import React, { useEffect, useState } from 'react'
import {
  Database,
  Thermometer,
  RefreshCw,
  Plus,
  Minus,
  Equal,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import type { ChillingStockStatus } from '../types/mccms'
import {
  fetchChillingStock,
  logChamberTemperature,
  recalculateChillingStock,
} from '../lib/api'

export const ChillingStockView: React.FC = () => {
  const [stock, setStock] = useState<ChillingStockStatus | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [recalculating, setRecalculating] = useState<boolean>(false)

  // Log temperature modal state
  const [tempModalOpen, setTempModalOpen] = useState<boolean>(false)
  const [newTemp, setNewTemp] = useState<string>('4.2')
  const [loggingTemp, setLoggingTemp] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const loadStockData = async () => {
    setLoading(true)
    try {
      const data = await fetchChillingStock()
      setStock(data)
    } catch (err) {
      console.error('Failed to load chilling stock data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStockData()
  }, [])

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      const updated = await recalculateChillingStock()
      setStock(updated)
      setToastMessage('Stock levels successfully recalculated and verified')
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to recalculate stock')
    } finally {
      setRecalculating(false)
    }
  }

  const handleSaveTemp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingTemp(true)
    try {
      const updated = await logChamberTemperature(newTemp)
      setStock(updated)
      setTempModalOpen(false)
      setToastMessage(`Chamber temperature logged at ${newTemp}°C`)
    } catch (err: any) {
      setToastMessage(err.message || 'Failed to log temperature')
    } finally {
      setLoggingTemp(false)
    }
  }

  const fillPercentage = stock
    ? Math.min(
        100,
        Math.max(
          0,
          (parseFloat(stock.current_stock_litres) /
            parseFloat(stock.tank_capacity_litres)) *
            100
        )
      )
    : 38.8

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Silo & Cold Storage • UI Mockup 6</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Chilling Stock & Tank Inventory
          </h1>
          <p className="text-xs text-slate-500">
            Automated stock recalculation engine enforcing: Opening Stock + Collection - Dispatch = Closing Stock
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTempModalOpen(true)}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
          >
            <Thermometer className="w-4 h-4 text-rose-500" />
            <span>Log Chamber Temp</span>
          </button>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`}
            />
            <span>Recalculate Stock</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Visual Tank Inventory + Temperature Monitoring Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Visual Tank (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
                Live Silo Tank 01
              </span>
              <span className="text-xs font-mono text-slate-400">
                Cap: {stock?.tank_capacity_litres || '15,000.00'} L
              </span>
            </div>
            <h2 className="text-xl font-extrabold mt-1">Main Cold Silo Level</h2>
          </div>

          {/* Visual Tank Vessel */}
          <div className="my-6 flex items-center justify-center">
            <div className="w-48 h-64 border-4 border-slate-700 rounded-3xl relative overflow-hidden bg-slate-950/80 shadow-inner flex flex-col justify-end">
              {/* Measurement Ticks */}
              <div className="absolute top-0 bottom-0 right-2 flex flex-col justify-between py-3 text-[9px] font-mono text-slate-500 pointer-events-none select-none">
                <span>15kL</span>
                <span>10kL</span>
                <span>5kL</span>
                <span>0kL</span>
              </div>

              {/* Liquid Wave Filling */}
              <div
                className="w-full bg-gradient-to-t from-emerald-600 via-teal-500 to-emerald-400 transition-all duration-700 ease-out relative"
                style={{ height: `${fillPercentage}%` }}
              >
                {/* Wave Crest Highlight */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 blur-xs" />
                <div className="absolute inset-0 bg-white/5 backdrop-blur-2xs" />
              </div>

              {/* Central Reading Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
                <span className="text-3xl font-black text-white tracking-tight">
                  {fillPercentage.toFixed(1)}%
                </span>
                <span className="text-xs font-bold text-emerald-200">
                  {stock?.current_stock_litres || '5,820.00'} L
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-700/60 pt-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Chilling Chamber Fat
              </span>
              <span className="text-base font-black text-emerald-400">
                {stock?.avg_fat || '3.72'}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                Chilling Chamber SNF
              </span>
              <span className="text-base font-black text-blue-400">
                {stock?.avg_snf || '8.34'}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Chamber Temperature Indicator & Storage Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          {/* Temperature Status Banner */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black">
                <Thermometer className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Chamber Temperature
                </p>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-3xl font-black text-slate-800">
                    {stock?.temperature_c || '4.2'}°C
                  </span>
                  <span
                    className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                      stock?.temperature_status === 'Optimal'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {stock?.temperature_status || 'Acceptable'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  {stock?.temperature_note || 'Within safe threshold (Optimal: 2.0°C - 4.0°C)'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setTempModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all self-start sm:self-center"
            >
              Update Reading
            </button>
          </div>

          {/* Core Balance Formula Overview Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-5 rounded-2xl border border-emerald-100/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>The Core Inventory Balance Equation</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Strict Decimal Invariant
              </span>
            </div>

            {/* Formula Visual Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                <span className="text-[10px] text-slate-400 uppercase font-extrabold block">
                  Opening
                </span>
                <span className="text-sm font-black text-slate-800 mt-1 block">
                  {stock?.opening_stock_litres || '5,000.00'} L
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200/60 shadow-xs">
                <span className="text-[10px] text-emerald-600 uppercase font-extrabold block flex items-center justify-center">
                  <Plus className="w-3 h-3 mr-0.5" /> Collection
                </span>
                <span className="text-sm font-black text-emerald-700 mt-1 block">
                  {stock?.collected_litres || '3,500.00'} L
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-rose-200/60 shadow-xs">
                <span className="text-[10px] text-rose-600 uppercase font-extrabold block flex items-center justify-center">
                  <Minus className="w-3 h-3 mr-0.5" /> Dispatch
                </span>
                <span className="text-sm font-black text-rose-700 mt-1 block">
                  {stock?.dispatched_litres || '2,680.00'} L
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-indigo-200/60 shadow-xs">
                <span className="text-[10px] text-indigo-600 uppercase font-extrabold block flex items-center justify-center">
                  <Equal className="w-3 h-3 mr-0.5" /> Closing
                </span>
                <span className="text-sm font-black text-indigo-700 mt-1 block">
                  {stock?.closing_stock_litres || '5,820.00'} L
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recent Stock History Log Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Chilling Stock Log History
            </h2>
            <p className="text-xs text-slate-500">
              Verified daily balance reconciliation ledger (Opening + Inflow - Outflow = Closing)
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {stock?.recent_logs.length || 0} Daily Records
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Opening Stock (L)</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">+ Collected (L)</th>
                <th className="py-2.5 px-3 text-right text-rose-700">- Dispatched (L)</th>
                <th className="py-2.5 px-3 text-right font-black">Closing Stock (L)</th>
                <th className="py-2.5 px-3 text-center">Avg Fat</th>
                <th className="py-2.5 px-3 text-center">Avg SNF</th>
                <th className="py-2.5 px-3 text-center">Temp (°C)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading stock logs...
                  </td>
                </tr>
              ) : stock?.recent_logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {log.log_date}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {log.opening_stock_litres}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">
                    +{log.collected_litres}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold">
                    -{log.dispatched_litres}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 bg-slate-50/50">
                    {log.closing_stock_litres}
                  </td>
                  <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                    {log.avg_fat}%
                  </td>
                  <td className="py-2.5 px-3 text-center text-blue-700 font-bold">
                    {log.avg_snf}%
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">
                    {log.temperature_c}°C
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Balanced
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Log Chamber Temperature */}
      {tempModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Log Chamber Temperature
                </h3>
              </div>
              <button
                onClick={() => setTempModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTemp} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Chamber Probe Reading (°C)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={newTemp}
                    onChange={(e) => setNewTemp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-800 focus:outline-hidden focus:border-rose-500"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                    °C
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Optimal range: 2.0°C to 4.0°C. Readings &gt; 4.8°C trigger warning.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTempModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingTemp}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {loggingTemp ? 'Recording...' : 'Save Temperature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChillingStockView
