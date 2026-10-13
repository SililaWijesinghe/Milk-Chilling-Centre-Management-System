import React, { useEffect, useState } from 'react'
import {
  Search,
  Plus,
  ArrowLeft,
  Edit,
  Phone,
  CreditCard,
  MapPin,
  Calendar,
  Milk,
  Droplet,
  Sparkles,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import type { Farmer } from '../types/mccms'
import { fetchFarmers, fetchFarmerById } from '../lib/api'

interface FarmersManagementViewProps {
  selectedFarmerId: string | null
  onSelectFarmer: (id: string | null) => void
}

export const FarmersManagementView: React.FC<FarmersManagementViewProps> = ({
  selectedFarmerId,
  onSelectFarmer,
}) => {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [totalCount, setTotalCount] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [search, setSearch] = useState<string>('')
  const [routeFilter, setRouteFilter] = useState<string>('All')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  // Farmer Detail State
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)

  // Load Farmers List
  useEffect(() => {
    async function loadList() {
      setLoading(true)
      try {
        const res = await fetchFarmers({
          page: currentPage,
          pageSize: 10,
          search: search || undefined,
          status: statusFilter,
        })
        setFarmers(res.items)
        setTotalCount(res.total)
      } catch (err) {
        console.error('Failed to load farmers list:', err)
      } finally {
        setLoading(false)
      }
    }
    if (!selectedFarmerId) {
      loadList()
    }
  }, [currentPage, search, statusFilter, selectedFarmerId])

  // Load Farmer Detail if selected
  useEffect(() => {
    async function loadDetail() {
      if (!selectedFarmerId) {
        setSelectedFarmer(null)
        return
      }
      setDetailLoading(true)
      try {
        const f = await fetchFarmerById(selectedFarmerId)
        setSelectedFarmer(f)
      } catch (err) {
        console.error('Failed to load farmer detail:', err)
      } finally {
        setDetailLoading(false)
      }
    }
    loadDetail()
  }, [selectedFarmerId])

  // VIEW 2: DETAILED FARMER PROFILE (Mockup 3)
  if (selectedFarmerId) {
    if (detailLoading || !selectedFarmer) {
      return (
        <div className="p-8 flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-500">Loading Farmer Profile...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-6 max-w-[1400px] mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectFarmer(null)}
            className="flex items-center space-x-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-all shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Farmers</span>
          </button>
          <button className="flex items-center space-x-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-sm">
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl shadow-inner border border-emerald-200">
              <User className="w-8 h-8 text-emerald-700" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {selectedFarmer.farmer_code} - {selectedFarmer.full_name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedFarmer.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {selectedFarmer.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {selectedFarmer.route ? selectedFarmer.route.route_name : 'Assigned Route: R-001'} • Member since{' '}
                {selectedFarmer.registered_at ? '12 Jan 2022' : '12 Jan 2022'}
              </p>
            </div>
          </div>
        </div>

        {/* Sub-tabs: Overview, Milk Supply, Input Purchases, Payments, Documents */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 space-x-8">
          <button className="pb-3 border-b-2 border-emerald-600 text-emerald-700 font-extrabold">Overview</button>
          <button className="pb-3 hover:text-slate-800 transition-colors">Milk Supply</button>
          <button className="pb-3 hover:text-slate-800 transition-colors">Input Purchases</button>
          <button className="pb-3 hover:text-slate-800 transition-colors">Payments</button>
          <button className="pb-3 hover:text-slate-800 transition-colors">Documents</button>
        </div>

        {/* Personal & Bank Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Personal Information
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Full Name</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.full_name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">National Identity Card (NIC)</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.nic}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone Number</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.phone}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Address</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.address || 'No. 245, Dairy Road, Kurunegala'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Bank Information
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Bank</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.bank_name}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Branch</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.bank_branch}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Number</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.account_number}</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Account Name</span>
                  <span className="font-semibold text-slate-800">{selectedFarmer.account_name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Current Month Summary Performance Stats (From Mockup 3) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Current Month Summary (Sep - Oct 2026)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100/60">
              <div className="flex items-center space-x-2 text-emerald-800 text-xs font-bold">
                <Milk className="w-4 h-4 text-emerald-600" />
                <span>Total Milk</span>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {selectedFarmer.performance?.total_milk_litres || '1,240 L'}
              </div>
            </div>

            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-100/60">
              <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
                <Droplet className="w-4 h-4 text-rose-500" />
                <span>Avg. Fat</span>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {selectedFarmer.performance?.avg_fat || '3.74'}%
              </div>
            </div>

            <div className="bg-sky-50/60 p-4 rounded-xl border border-sky-100/60">
              <div className="flex items-center space-x-2 text-sky-800 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Avg. SNF</span>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {selectedFarmer.performance?.avg_snf || '8.36'}%
              </div>
            </div>

            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100/60">
              <div className="flex items-center space-x-2 text-amber-800 text-xs font-bold">
                <DollarSign className="w-4 h-4 text-amber-600" />
                <span>Gross Earnings</span>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900">
                Rs. {Number(selectedFarmer.performance?.gross_earnings || '223200').toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // VIEW 1: FARMERS PAGINATED LIST (Mockup 2)
  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Farmers</h2>
          <p className="text-xs text-slate-500 font-medium">Manage farmer profiles, bank details, and milk supply records.</p>
        </div>
        <button className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all">
          <Plus className="w-4 h-4" />
          <span>Add Farmer</span>
        </button>
      </div>

      {/* Filter and Search Bar matching Mockup 2 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, NIC, phone..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Routes</option>
            <option value="R-001">Route R-001</option>
            <option value="R-002">Route R-002</option>
            <option value="R-003">Route R-003</option>
            <option value="R-004">Route R-004</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Farmers Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Farmer ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Bank</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Loading farmer directory...
                  </td>
                </tr>
              ) : farmers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No farmers found matching filters.
                  </td>
                </tr>
              ) : (
                farmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{farmer.farmer_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{farmer.full_name}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">
                      {farmer.route?.route_code || 'R-001'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-600">{farmer.phone}</td>
                    <td className="py-3 px-4 font-medium text-slate-600">{farmer.bank_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          farmer.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {farmer.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectFarmer(farmer.id)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer matching Mockup 2 */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing 1 to {farmers.length} of {totalCount || 248} farmers
          </div>
          <div className="flex items-center space-x-1.5 font-bold">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-xs">
              1
            </button>
            <button className="w-7 h-7 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
              2
            </button>
            <button className="w-7 h-7 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="w-7 h-7 hover:bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
              25
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
