import React, { useEffect, useState } from 'react'
import {
  Truck,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react'
import type {
  BowserDispatchItem,
  BowserDispatchListResponse,
  NewDispatchFormData,
} from '../types/mccms'
import {
  createBowserDispatch,
  deleteBowserDispatch,
  fetchChillingStock,
  fetchDispatches,
  updateBowserDispatch,
} from '../lib/api'

export const BowserDispatchView: React.FC = () => {
  const [dispatches, setDispatches] = useState<BowserDispatchItem[]>([])
  const [listData, setListData] = useState<BowserDispatchListResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [availableStock, setAvailableStock] = useState<string>('5820.00')

  // Modals
  const [newModalOpen, setNewModalOpen] = useState<boolean>(false)
  const [reconcileModalOpen, setReconcileModalOpen] = useState<boolean>(false)
  const [selectedDispatch, setSelectedDispatch] = useState<BowserDispatchItem | null>(null)

  // New Dispatch Form State
  const [bowserNumber, setBowserNumber] = useState<string>('WP-BOW-5678')
  const [driverName, setDriverName] = useState<string>('Kasun Bandara')
  const [dispatchedLitres, setDispatchedLitres] = useState<string>('2500.00')
  const [tempC, setTempC] = useState<string>('4.2')
  const [fatPct, setFatPct] = useState<string>('3.65')
  const [snfPct, setSnfPct] = useState<string>('8.30')
  const [buyerName, setBuyerName] = useState<string>('Milco Dairy Ltd')
  const [creating, setCreating] = useState<boolean>(false)

  // Reconciliation Form State
  const [acceptedLitres, setAcceptedLitres] = useState<string>('2490.00')
  const [buyerRate, setBuyerRate] = useState<string>('195.00')
  const [reconciling, setReconciling] = useState<boolean>(false)

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const loadData = async () => {
    setLoading(true)
    try {
      const [dispRes, stockRes] = await Promise.all([
        fetchDispatches({ status: statusFilter }),
        fetchChillingStock(),
      ])
      setListData(dispRes)
      setDispatches(dispRes.items)
      setAvailableStock(stockRes.current_stock_litres)
    } catch (err: any) {
      console.error('Failed to load dispatches:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [statusFilter])

  // Handle New Dispatch Submission
  const handleCreateDispatch = async (e: React.FormEvent) => {
    e.preventDefault()
    const volNum = parseFloat(dispatchedLitres) || 0
    const stockNum = parseFloat(availableStock) || 0

    if (volNum > stockNum) {
      setFeedback({
        type: 'error',
        text: `Cannot dispatch ${volNum} L: Exceeds available chilling stock (${stockNum} L).`,
      })
      return
    }

    setCreating(true)
    setFeedback(null)
    try {
      const payload: NewDispatchFormData = {
        bowser_number: bowserNumber,
        driver_name: driverName,
        dispatched_litres: dispatchedLitres,
        temperature_c: tempC,
        fat_pct: fatPct,
        snf_pct: snfPct,
      }

      await createBowserDispatch(payload)
      setNewModalOpen(false)
      setFeedback({
        type: 'success',
        text: `Dispatch successfully created for Bowser ${bowserNumber} (${dispatchedLitres} L). Chilling stock updated.`,
      })
      loadData()
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to create dispatch' })
    } finally {
      setCreating(false)
    }
  }

  // Open Reconcile Modal
  const openReconcile = (d: BowserDispatchItem) => {
    setSelectedDispatch(d)
    setAcceptedLitres(d.accepted_litres || d.dispatched_litres)
    setBuyerRate('195.00')
    setReconcileModalOpen(true)
  }

  // Handle Confirm Reconciliation
  const handleConfirmReconcile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDispatch) return

    setReconciling(true)
    try {
      await updateBowserDispatch(selectedDispatch.id, {
        accepted_litres: acceptedLitres,
        buyer_rate: buyerRate,
        status: 'Reconciled',
      })
      setReconcileModalOpen(false)
      setFeedback({
        type: 'success',
        text: `Dispatch ${selectedDispatch.dispatch_code} reconciled: ${acceptedLitres} L accepted by buyer.`,
      })
      loadData()
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to reconcile dispatch' })
    } finally {
      setReconciling(false)
    }
  }

  // Handle Delete Dispatch
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete dispatch ${code}? Chilling stock will be restored.`)) {
      return
    }
    try {
      await deleteBowserDispatch(id)
      setFeedback({ type: 'success', text: `Dispatch ${code} removed and chilling stock restored.` })
      loadData()
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete dispatch' })
    }
  }

  // Computed variance for reconciliation preview
  const dispVolNum = selectedDispatch ? parseFloat(selectedDispatch.dispatched_litres) : 0
  const accVolNum = parseFloat(acceptedLitres) || 0
  const varianceNum = dispVolNum - accVolNum
  const rateNum = parseFloat(buyerRate) || 0
  const payableAmountNum = accVolNum * rateNum

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            <span>Transport Logistics • UI Mockup 7</span>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Bowser Dispatch & Reconciliation
          </h1>
          <p className="text-xs text-slate-500">
            Bowser tanker loading, transfer reconciliation, transit variances, and buyer ledger integration
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => loadData()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all"
            title="Refresh dispatches"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setNewModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Dispatch</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* 2. Dispatches Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Today's Dispatched
            </p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {listData?.today_dispatched_litres || '0.00'}{' '}
              <span className="text-xs font-bold text-slate-500">L</span>
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Deducted from chilling stock
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Available Chilling Stock
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {availableStock}{' '}
              <span className="text-xs font-bold text-slate-500">L</span>
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              Ready for tanker dispatch
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Reconciliation
            </p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">
              {listData?.pending_reconciliation_count || 0}{' '}
              <span className="text-xs font-bold text-slate-500">Loads</span>
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Awaiting buyer acceptance slips
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Tanker Fleet
            </p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {listData?.active_bowsers_count || 1}{' '}
              <span className="text-xs font-bold text-slate-500">Bowsers</span>
            </p>
            <p className="text-[11px] text-slate-500 font-semibold mt-1">
              Milco & Nestle distribution
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-black">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Dispatches Tracking Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-800">
              Bowser Dispatches Directory
            </h2>
            <p className="text-xs text-slate-500">
              Complete log of tanker dispatches, driver assignments, and transit variances
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-3 py-1.5 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Pending">Pending</option>
              <option value="Reconciled">Reconciled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Dispatch Code</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Bowser & Driver</th>
                <th className="py-2.5 px-3">Buyer Destination</th>
                <th className="py-2.5 px-3 text-right">Dispatched (L)</th>
                <th className="py-2.5 px-3 text-right">Accepted (L)</th>
                <th className="py-2.5 px-3 text-center">Variance (L)</th>
                <th className="py-2.5 px-3 text-center">Quality</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading bowser dispatches...
                  </td>
                </tr>
              ) : dispatches.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No bowser dispatches recorded yet.
                  </td>
                </tr>
              ) : (
                dispatches.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-2.5 px-3">
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        {d.dispatch_code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {d.dispatch_date}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-extrabold text-slate-800">{d.bowser_number}</div>
                      <div className="text-[10px] text-slate-400">{d.driver_name}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {d.buyer_name}
                    </td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900 font-mono">
                      {d.dispatched_litres} L
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {d.accepted_litres ? (
                        <span className="font-bold text-emerald-700">
                          {d.accepted_litres} L
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Pending</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {d.variance_litres ? (
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded-md text-[10px] ${
                            parseFloat(d.variance_litres) === 0
                              ? 'bg-slate-100 text-slate-700'
                              : parseFloat(d.variance_litres) > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {d.variance_litres} L
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-[10px] font-semibold text-slate-600">
                      {d.fat_pct}% F • {d.snf_pct}% S • {d.temperature_c}°C
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          d.status === 'Reconciled'
                            ? 'bg-emerald-100 text-emerald-800'
                            : d.status === 'Dispatched'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {d.status !== 'Reconciled' && (
                          <button
                            onClick={() => openReconcile(d)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-all"
                            title="Reconcile with buyer"
                          >
                            Reconcile
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(d.id, d.dispatch_code)}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-bold rounded-lg transition-all"
                          title="Delete dispatch"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: New Bowser Dispatch */}
      {newModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-800">
                  New Bowser Tanker Dispatch
                </h3>
              </div>
              <button
                onClick={() => setNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDispatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Bowser Tanker Number
                  </label>
                  <input
                    type="text"
                    value={bowserNumber}
                    onChange={(e) => setBowserNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Driver Name
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Buyer Destination
                </label>
                <select
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="Milco Dairy Ltd">Milco Dairy Ltd (Narahenpita, Colombo)</option>
                  <option value="Nestle Lanka PLC">Nestle Lanka PLC (Pannala Factory)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Dispatched Quantity (Litres)
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600">
                    Available: {availableStock} L
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    value={dispatchedLitres}
                    onChange={(e) => setDispatchedLitres(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-800 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                  <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">
                    Litres
                  </span>
                </div>
                {parseFloat(dispatchedLitres) > parseFloat(availableStock) && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    Exceeds available chilling stock! Cannot dispatch.
                  </p>
                )}
              </div>

              {/* Quality testing at load */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Load Fat %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fatPct}
                    onChange={(e) => setFatPct(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Load SNF %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={snfPct}
                    onChange={(e) => setSnfPct(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Load Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempC}
                    onChange={(e) => setTempC(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    creating ||
                    parseFloat(dispatchedLitres) > parseFloat(availableStock)
                  }
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {creating ? 'Dispatching...' : 'Confirm Bowser Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Buyer Reconciliation */}
      {reconcileModalOpen && selectedDispatch && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-extrabold text-slate-800">
                  Buyer Reconciliation ({selectedDispatch.dispatch_code})
                </h3>
              </div>
              <button
                onClick={() => setReconcileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Bowser Tanker:</span>
                <span className="font-bold text-slate-800">{selectedDispatch.bowser_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Destination Buyer:</span>
                <span className="font-bold text-slate-800">{selectedDispatch.buyer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Center Dispatched Volume:</span>
                <span className="font-black text-slate-900">{selectedDispatch.dispatched_litres} L</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReconcile} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Buyer Accepted / Received Litres
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.0"
                  value={acceptedLitres}
                  onChange={(e) => setAcceptedLitres(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Buyer Agreed Rate (Rs. / Litre)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.0"
                  value={buyerRate}
                  onChange={(e) => setBuyerRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-800 focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              {/* Live Reconciliation Calculations */}
              <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Transit Variance (Dispatched - Accepted):</span>
                  <span
                    className={`font-mono font-black ${
                      varianceNum > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {varianceNum.toFixed(2)} L
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-700/60 pt-2">
                  <span className="text-slate-400">Buyer Payable Total:</span>
                  <span className="text-base font-black text-emerald-400">
                    Rs. {payableAmountNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReconcileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reconciling}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {reconciling ? 'Reconciling...' : 'Confirm Reconciliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BowserDispatchView
