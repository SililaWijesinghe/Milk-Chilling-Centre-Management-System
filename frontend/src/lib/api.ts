import axios from 'axios'
import type {
  ActivityItem,
  BowserDispatchItem,
  BowserDispatchListResponse,
  ChillingStockStatus,
  CollectionFormData,
  CollectionItem,
  CollectionListResponse,
  DailyQualityBreakdownResponse,
  DashboardCharts,
  DashboardMetrics,
  Envelope,
  Farmer,
  FarmerListResponse,
  NewDispatchFormData,
  QualitySummaryData,
  QualityTrendPoint,
  TodaysCollectionSummaryResponse,
} from '../types/mccms'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Global response interceptor to unpack envelope safely
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorBody = error.response?.data?.error
    const message = errorBody?.message || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await api.get<Envelope<DashboardMetrics>>('/api/dashboard/metrics')
  if (!res.data.data) throw new Error('Missing metrics data')
  return res.data.data
}

export async function fetchDashboardCharts(): Promise<DashboardCharts> {
  const res = await api.get<Envelope<DashboardCharts>>('/api/dashboard/charts')
  if (!res.data.data) throw new Error('Missing charts data')
  return res.data.data
}

export async function fetchRecentActivities(): Promise<ActivityItem[]> {
  const res = await api.get<Envelope<ActivityItem[]>>('/api/dashboard/activities')
  if (!res.data.data) throw new Error('Missing activities data')
  return res.data.data
}

export async function fetchTodaysSummary(): Promise<TodaysCollectionSummaryResponse> {
  const res = await api.get<Envelope<TodaysCollectionSummaryResponse>>('/api/collections/todays-summary')
  if (!res.data.data) throw new Error('Missing collection summary')
  return res.data.data
}

export async function fetchFarmers(params?: {
  page?: number
  pageSize?: number
  search?: string
  routeId?: string
  status?: string
}): Promise<FarmerListResponse> {
  const res = await api.get<Envelope<FarmerListResponse>>('/api/farmers', {
    params: {
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 50,
      search: params?.search || undefined,
      route_id: params?.routeId || undefined,
      status: params?.status && params.status !== 'All' ? params.status : undefined,
    },
  })
  if (!res.data.data) throw new Error('Missing farmers data')
  return res.data.data
}

export async function fetchFarmerById(id: string): Promise<Farmer> {
  const res = await api.get<Envelope<Farmer>>(`/api/farmers/${id}`)
  if (!res.data.data) throw new Error('Missing farmer details')
  return res.data.data
}

export async function createFarmer(data: Partial<Farmer>): Promise<Farmer> {
  const res = await api.post<Envelope<Farmer>>('/api/farmers', data)
  if (!res.data.data) throw new Error('Failed to create farmer')
  return res.data.data
}

export async function updateFarmer(id: string, data: Partial<Farmer>): Promise<Farmer> {
  const res = await api.patch<Envelope<Farmer>>(`/api/farmers/${id}`, data)
  if (!res.data.data) throw new Error('Failed to update farmer')
  return res.data.data
}

// ==========================================
// 1. COLLECTIONS API
// ==========================================

export async function fetchCollections(params?: {
  collectionDate?: string
  session?: string
  routeId?: string
  farmerId?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<CollectionListResponse> {
  const res = await api.get<Envelope<CollectionListResponse>>('/api/collections', {
    params: {
      collection_date: params?.collectionDate || undefined,
      session: params?.session && params.session !== 'All' ? params.session : undefined,
      route_id: params?.routeId || undefined,
      farmer_id: params?.farmerId || undefined,
      status: params?.status && params.status !== 'All' ? params.status : undefined,
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 50,
    },
  })
  if (!res.data.data) throw new Error('Missing collections data')
  return res.data.data
}

export async function recordMilkCollection(data: CollectionFormData): Promise<CollectionItem> {
  const res = await api.post<Envelope<CollectionItem>>('/api/collections', data)
  if (!res.data.data) throw new Error('Failed to record milk collection')
  return res.data.data
}

// ==========================================
// 2. CHILLING STOCK API
// ==========================================

export async function fetchChillingStock(asOfDate?: string): Promise<ChillingStockStatus> {
  const res = await api.get<Envelope<ChillingStockStatus>>('/api/chilling-stock', {
    params: { as_of_date: asOfDate || undefined },
  })
  if (!res.data.data) throw new Error('Missing chilling stock data')
  return res.data.data
}

export async function logChamberTemperature(
  temperatureC: string | number,
  logDate?: string
): Promise<ChillingStockStatus> {
  const res = await api.post<Envelope<ChillingStockStatus>>('/api/chilling-stock/temperature', {
    temperature_c: String(temperatureC),
    log_date: logDate || undefined,
  })
  if (!res.data.data) throw new Error('Failed to log chamber temperature')
  return res.data.data
}

export async function recalculateChillingStock(targetDate?: string): Promise<ChillingStockStatus> {
  const res = await api.post<Envelope<ChillingStockStatus>>('/api/chilling-stock/recalculate', {
    target_date: targetDate || undefined,
  })
  if (!res.data.data) throw new Error('Failed to recalculate chilling stock')
  return res.data.data
}

// ==========================================
// 3. BOWSER DISPATCHES API
// ==========================================

export async function fetchDispatches(params?: {
  dispatchDate?: string
  status?: string
  page?: number
  pageSize?: number
}): Promise<BowserDispatchListResponse> {
  const res = await api.get<Envelope<BowserDispatchListResponse>>('/api/dispatches', {
    params: {
      dispatch_date: params?.dispatchDate || undefined,
      status: params?.status && params.status !== 'All' ? params.status : undefined,
      page: params?.page ?? 1,
      page_size: params?.pageSize ?? 50,
    },
  })
  if (!res.data.data) throw new Error('Missing dispatches data')
  return res.data.data
}

export async function createBowserDispatch(data: NewDispatchFormData): Promise<BowserDispatchItem> {
  const res = await api.post<Envelope<BowserDispatchItem>>('/api/dispatches', data)
  if (!res.data.data) throw new Error('Failed to create dispatch')
  return res.data.data
}

export async function updateBowserDispatch(
  id: string,
  data: {
    accepted_litres?: string
    buyer_rate?: string
    status?: string
    driver_name?: string
    bowser_number?: string
  }
): Promise<BowserDispatchItem> {
  const res = await api.patch<Envelope<BowserDispatchItem>>(`/api/dispatches/${id}`, data)
  if (!res.data.data) throw new Error('Failed to update dispatch')
  return res.data.data
}

export async function deleteBowserDispatch(id: string): Promise<void> {
  await api.delete(`/api/dispatches/${id}`)
}

// ==========================================
// 4. QUALITY ANALYSIS API
// ==========================================

export async function fetchQualitySummary(params?: {
  dateFrom?: string
  dateTo?: string
  routeId?: string
}): Promise<QualitySummaryData> {
  const res = await api.get<Envelope<QualitySummaryData>>('/api/quality/summary', {
    params: {
      date_from: params?.dateFrom || undefined,
      date_to: params?.dateTo || undefined,
      route_id: params?.routeId || undefined,
    },
  })
  if (!res.data.data) throw new Error('Missing quality summary data')
  return res.data.data
}

export async function fetchQualityTrends(days = 7): Promise<QualityTrendPoint[]> {
  const res = await api.get<Envelope<{ items: QualityTrendPoint[] }>>('/api/quality/trends', {
    params: { days },
  })
  if (!res.data.data) throw new Error('Missing quality trends data')
  return res.data.data.items
}

export async function fetchQualityDailyBreakdown(
  page = 1,
  pageSize = 20
): Promise<DailyQualityBreakdownResponse> {
  const res = await api.get<Envelope<DailyQualityBreakdownResponse>>('/api/quality/daily-breakdown', {
    params: { page, page_size: pageSize },
  })
  if (!res.data.data) throw new Error('Missing quality daily breakdown')
  return res.data.data
}

