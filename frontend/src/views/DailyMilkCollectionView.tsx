import React, { useEffect, useState } from 'react'
import {
  Milk,
  Sun,
  Moon,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calculator,
  RefreshCw,
  Plus,
  Thermometer,
  Droplet,
  Sparkles,
  User,
} from 'lucide-react'
import type {
  CollectionFormData,
  CollectionItem,
  CollectionSessionTotals,
  Farmer,
} from '../types/mccms'
import {
  fetchCollections,
  fetchFarmers,
  recordMilkCollection,
} from '../lib/api'

export const DailyMilkCollectionView: React.FC = () => {
  // Session & Filter state
  const [session, setSession] = useState<'Morning' | 'Evening'>('Morning')
  const [selectedRoute, setSelectedRoute] = useState<string>('All')
  const [collectionDate, setCollectionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  // Data state
  const [collections, setCollections] = useState<CollectionItem[]>([])
  const [totals, setTotals] = useState<CollectionSessionTotals | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Farmers lookup state
  const [allFarmers, setAllFarmers] = useState<Farmer[]>([])
  const [farmerSearch, setFarmerSearch] = useState<string>('')
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)

  // Form inputs
  const [quantity, setQuantity] = useState<string>('35.00')
  const [fat, setFat] = useState<string>('3.70')
  const [snf, setSnf] = useState<string>('8.30')
  const [temperature, setTemperature] = useState<string>('4.2')
  const [status, setStatus] = useState<'Accepted' | 'Rejected' | 'Acidic'>('Accepted')

  // Real-time calculated rate & gross amount preview
  const [previewRate, setPreviewRate] = useState<string>('183.00')
  const [previewGross, setPreviewGross] = useState<string>('6405.00')

  // Load farmers once for autocomplete
  useEffect(() => {
    async function loadFarmers() {
      try {
        const res = await fetchFarmers({ pageSize: 100, status: 'Active' })
        setAllFarmers(res.items)
        if (res.items.length > 0 && !selectedFarmer) {
          setSelectedFarmer(res.items[0])
        }
      } catch (err) {
        console.error('Failed to load farmers list:', err)
      }
    }
    loadFarmers()
  }, [])

  // Load collections whenever session, date, or route changes
  const loadCollectionsList = async () => {
    setLoading(true)
    try {
      const res = await fetchCollections({
        collectionDate,
        session,
        routeId: selectedRoute !== 'All' ? selectedRoute : undefined,
      })
      setCollections(res.items)
      setTotals(res.totals)
    } catch (err) {
      console.error('Failed to load collections:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCollectionsList()
  }, [session, collectionDate, selectedRoute])

  // Recalculate dynamic preview rate
  useEffect(() => {
    if (status === 'Rejected' || status === 'Acidic') {
      setPreviewRate('0.00')
      setPreviewGross('0.00')
      return
    }

    const fatNum = parseFloat(fat) || 3.5
    const snfNum = parseFloat(snf) || 8.0
    const qtyNum = parseFloat(quantity) || 0

    // Dynamic pricing formula: Rate = 179.00 + (fat - 3.50)*5.00 + (snf - 8.00)*10.00
    const calculatedRate = Math.max(
      0,
      179.0 + (fatNum - 3.5) * 5.0 + (snfNum - 8.0) * 10.0
    )
    const grossVal = qtyNum * calculatedRate

    setPreviewRate(calculatedRate.toFixed(2))
    setPreviewGross(grossVal.toFixed(2))
  }, [fat, snf, quantity, status])

  // Handle submit collection
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFarmer) {
      setErrorMessage('Please select a farmer')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const payload: CollectionFormData = {
        session,
        route_id: selectedFarmer.route_id || '',
        farmer_id: selectedFarmer.id,
        quantity_litres: parseFloat(quantity).toFixed(2),
        fat_pct: parseFloat(fat).toFixed(2),
        snf_pct: parseFloat(snf).toFixed(2),
        temperature_c: parseFloat(temperature).toFixed(1),
        status,
      }

      await recordMilkCollection(payload)
      setSuccessMessage(
        `Collection recorded: ${quantity} L from ${selectedFarmer.full_name} (${selectedFarmer.farmer_code})`
      )
      // Reset some fields for next entry
      setQuantity('30.00')
      loadCollectionsList()
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record collection')
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered farmers list for autocomplete
  const filteredFarmers = allFarmers.filter((f) => {
    const q = farmerSearch.toLowerCase()
    return (
      f.farmer_code.toLowerCase().includes(q) ||
      f.full_name.toLowerCase().includes(q) ||
      f.phone.includes(q)
    )
  })

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* 1. Header Bar with Session Toggle and Date */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Milk className="w-4 h-4" />
            <span>Operational Intake • UI Mockup 4</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Daily Milk Collection
          </h1>
          <p className="text-xs text-slate-500">
            Twice-daily counter milk intake, quality grading, and real-time gross rate calculation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <span className="text-slate-400">Date:</span>
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              className="bg-transparent font-bold focus:outline-hidden text-slate-800 cursor-pointer"
            />
          </div>

          {/* Session Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setSession('Morning')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session === 'Morning'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Morning Session</span>
            </button>
            <button
              onClick={() => setSession('Evening')}
              className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                session === 'Evening'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Evening Session</span>
            </button>
          </div>

          <button
            onClick={() => loadCollectionsList()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Refresh session data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Session Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {session} Total Volume
            </p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {totals?.total_litres || '0.00'}{' '}
              <span className="text-xs font-bold text-slate-500">L</span>
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block mr-1" />
              {totals?.accepted_litres || '0.00'} L Accepted
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <Milk className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Gross Value
            </p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              Rs. {totals?.total_amount || '0.00'}
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Active Dynamic Rate applied
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Calculator className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quality Averages
            </p>
            <div className="flex items-center space-x-3 mt-1">
              <div>
                <span className="text-xs text-slate-400 font-medium">Fat: </span>
                <span className="text-lg font-black text-emerald-600">
                  {totals?.avg_fat || '3.72'}%
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-xs text-slate-400 font-medium">SNF: </span>
                <span className="text-lg font-black text-blue-600">
                  {totals?.avg_snf || '8.34'}%
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Avg Temp: {totals?.avg_temp || '4.2'}°C
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Farmers Recorded
            </p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {totals?.total_farmers || 0}{' '}
              <span className="text-xs font-bold text-slate-500">Deliveries</span>
            </p>
            <div className="flex items-center space-x-2 text-[11px] mt-1 font-semibold">
              <span className="text-rose-600">
                {totals?.rejected_litres || '0.00'} L Rej
              </span>
              <span>•</span>
              <span className="text-amber-600">
                {totals?.acidic_litres || '0.00'} L Acidic
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-emerald-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700"
          >
            ✕
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-800 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 3. Main Workspace: Entry Form (Left) & Recent Records Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Data Entry Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-base font-extrabold text-slate-800">
                Counter Collection Intake
              </h2>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg">
              {session} Shift
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Farmer Selection with Quick Autocomplete */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Select Active Farmer</span>
                {selectedFarmer && (
                  <span className="text-[10px] text-emerald-600 font-extrabold">
                    {selectedFarmer.farmer_code} • {selectedFarmer.bank_name}
                  </span>
                )}
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Type farmer code or name (e.g. FAR-001)..."
                  value={farmerSearch}
                  onChange={(e) => setFarmerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-hidden focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Quick Suggestion Chips */}
              {farmerSearch.length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-0.5">
                  {filteredFarmers.slice(0, 5).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setSelectedFarmer(f)
                        setFarmerSearch('')
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-emerald-50 flex items-center justify-between transition-all"
                    >
                      <div>
                        <span className="font-bold text-slate-800">{f.farmer_code}</span>{' '}
                        <span className="text-slate-600">- {f.full_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {f.route?.route_code || 'Route R-001'}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Farmer Mini Card */}
              {selectedFarmer && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {selectedFarmer.farmer_code.slice(-3)}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">
                        {selectedFarmer.full_name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Phone: {selectedFarmer.phone} • Route: {selectedFarmer.route?.route_code || 'R-001'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Active
                  </span>
                </div>
              )}
            </div>

            {/* Quantity in Litres */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Milk Quantity (Litres)</span>
                <span className="text-[11px] text-slate-400 font-semibold">Decimals: 2</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
                <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                  Litres
                </span>
              </div>
              {/* Quick increment buttons */}
              <div className="flex items-center space-x-2 pt-1">
                {['+5', '+10', '+20', '+50'].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      const cur = parseFloat(quantity) || 0
                      const add = parseFloat(step.replace('+', ''))
                      setQuantity((cur + add).toFixed(2))
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                  >
                    {step} L
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Test Inputs (Fat, SNF, Temperature) */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1 mb-1">
                  <Droplet className="w-3 h-3 text-amber-500" />
                  <span>Fat %</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.0"
                  max="15.0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1 mb-1">
                  <Sparkles className="w-3 h-3 text-blue-500" />
                  <span>SNF %</span>
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.0"
                  max="15.0"
                  value={snf}
                  onChange={(e) => setSnf(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1 mb-1">
                  <Thermometer className="w-3 h-3 text-rose-500" />
                  <span>Temp (°C)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Quality Status Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Intake Status Validation</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('Accepted')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                    status === 'Accepted'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accepted</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Rejected')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                    status === 'Rejected'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Rejected</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('Acidic')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 border transition-all ${
                    status === 'Acidic'
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Acidic</span>
                </button>
              </div>
            </div>

            {/* Real-time Dynamic Pricing Calculator Output */}
            <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl text-white space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                <span>Active Dynamic Formula</span>
                <span className="text-emerald-400 font-mono">Qty × Rate</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Rate per Litre
                  </span>
                  <span className="text-lg font-black text-emerald-400">
                    Rs. {previewRate}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Gross Value
                  </span>
                  <span className="text-xl font-black text-white">
                    Rs. {previewGross}
                  </span>
                </div>
              </div>
              {status !== 'Accepted' && (
                <p className="text-[10px] text-amber-300 font-medium">
                  Notice: Milk marked {status} is not priced (Rs. 0.00) and excluded from chilling stock.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Recording Entry...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Record Milk Collection</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Session Records Table */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-800">
                {session} Collections Log
              </h2>
              <p className="text-xs text-slate-500">
                {collections.length} entries recorded on {collectionDate}
              </p>
            </div>

            {/* Route filter selector */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-bold">Route:</span>
              <select
                value={selectedRoute}
                onChange={(e) => setSelectedRoute(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden"
              >
                <option value="All">All Routes</option>
                <option value="1744016e-8f6f-4e33-a679-4cf03d6efb36">Route R-001</option>
                <option value="2">Route R-002</option>
                <option value="3">Route R-003</option>
                <option value="4">Route R-004</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Farmer</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3 text-right">Qty (L)</th>
                  <th className="py-2.5 px-3 text-center">Fat %</th>
                  <th className="py-2.5 px-3 text-center">SNF %</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Total (Rs.)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading session collections...
                    </td>
                  </tr>
                ) : collections.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Milk className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No collection entries recorded for this session yet.
                    </td>
                  </tr>
                ) : (
                  collections.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-all">
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-800">
                          {item.farmer_code}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.farmer_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-600">
                          {item.route_code || 'R-001'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        {item.quantity_litres}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-bold">
                        {item.fat_pct}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-700 font-bold">
                        {item.snf_pct}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-600">
                        {item.final_rate}
                      </td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                        {item.total_amount}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            item.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyMilkCollectionView
