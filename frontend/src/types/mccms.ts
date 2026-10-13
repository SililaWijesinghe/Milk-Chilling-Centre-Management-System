export interface Envelope<T> {
  success: boolean
  data: T | null
  error: { code: string; message: string } | null
}

export interface DashboardMetrics {
  active_farmers: number
  active_farmers_change: string
  todays_collection_litres: string
  todays_collection_change: string
  current_stock_litres: string
  current_stock_change: string
  todays_dispatch_litres: string
  todays_dispatch_note: string
  avg_fat: string
  avg_fat_change: string
  avg_snf: string
  avg_snf_change: string
  pending_farmer_payments: string
  pending_farmer_payments_note: string
  pending_input_recovery: string
  pending_input_recovery_note: string
  chilling_temperature_c: string
  chilling_stock_fat: string
  chilling_stock_snf: string
}

export interface DailyCollectionPoint {
  date: string
  morning_litres: string
  evening_litres: string
  total_litres: string
}

export interface QualityTrendPoint {
  date: string
  fat_pct: string
  snf_pct: string
}

export interface DashboardCharts {
  collection_overview: DailyCollectionPoint[]
  quality_trend: QualityTrendPoint[]
}

export interface RouteCollectionSummary {
  route_code: string
  route_name: string
  farmers_count: number
  morning_litres: string
  evening_litres: string
  total_litres: string
  avg_fat: string
  avg_snf: string
}

export interface TodaysCollectionSummaryResponse {
  date: string
  items: RouteCollectionSummary[]
  total_farmers: number
  total_morning_litres: string
  total_evening_litres: string
  total_litres: string
  overall_avg_fat: string
  overall_avg_snf: string
}

export interface ActivityItem {
  id: string
  title: string
  timestamp: string
  type: 'collection' | 'dispatch' | 'sale' | 'payment' | 'registration'
}

export interface RouteSimple {
  id: string
  route_code: string
  route_name: string
}

export interface FarmerPerformance {
  total_milk_litres: string
  avg_fat: string
  avg_snf: string
  gross_earnings: string
}

export interface Farmer {
  id: string
  farmer_code: string
  full_name: string
  route_id: string | null
  phone: string
  nic: string
  address: string | null
  bank_name: string
  bank_branch: string
  account_number: string
  account_name: string
  status: string
  registered_at: string | null
  created_at: string | null
  route: RouteSimple | null
  performance?: FarmerPerformance | null
}

export interface FarmerListResponse {
  items: Farmer[]
  page: number
  page_size: number
  total: number
}

// ==========================================
// LEVEL 1 OPERATIONAL TYPES
// ==========================================

export interface CollectionItem {
  id: string
  collection_date: string
  session: 'Morning' | 'Evening'
  farmer_id: string
  farmer_code: string
  farmer_name: string
  route_id: string | null
  route_code: string | null
  route_name: string | null
  quantity_litres: string
  fat_pct: string
  snf_pct: string
  temperature_c: string
  status: 'Accepted' | 'Rejected' | 'Acidic'
  final_rate: string
  total_amount: string
  created_at: string
}

export interface CollectionSessionTotals {
  total_farmers: number
  accepted_litres: string
  rejected_litres: string
  acidic_litres: string
  total_litres: string
  total_amount: string
  avg_fat: string
  avg_snf: string
  avg_temp: string
}

export interface CollectionListResponse {
  items: CollectionItem[]
  totals: CollectionSessionTotals
  page: number
  page_size: number
  total: number
}

export interface CollectionFormData {
  session: 'Morning' | 'Evening'
  route_id: string
  farmer_id: string
  quantity_litres: string
  fat_pct: string
  snf_pct: string
  temperature_c: string
  status: 'Accepted' | 'Rejected' | 'Acidic'
}

export interface ChillingStockLogItem {
  id: string
  log_date: string
  opening_stock_litres: string
  collected_litres: string
  dispatched_litres: string
  closing_stock_litres: string
  avg_fat: string
  avg_snf: string
  temperature_c: string
  variance: string
}

export interface ChillingStockStatus {
  target_date: string
  tank_capacity_litres: string
  current_stock_litres: string
  opening_stock_litres: string
  collected_litres: string
  dispatched_litres: string
  closing_stock_litres: string
  avg_fat: string
  avg_snf: string
  temperature_c: string
  temperature_status: 'Optimal' | 'Acceptable' | 'Warning'
  temperature_note: string
  utilization_pct: string
  recent_logs: ChillingStockLogItem[]
}

export interface BowserDispatchItem {
  id: string
  dispatch_code: string
  dispatch_date: string
  bowser_number: string
  driver_name: string
  buyer_id: string | null
  buyer_name: string
  dispatched_litres: string
  accepted_litres: string | null
  variance_litres: string | null
  buyer_rate: string | null
  buyer_amount: string | null
  temperature_c: string | null
  fat_pct: string | null
  snf_pct: string | null
  status: 'Dispatched' | 'Pending' | 'Reconciled'
  created_at: string
}

export interface BowserDispatchListResponse {
  items: BowserDispatchItem[]
  today_dispatched_litres: string
  active_bowsers_count: number
  pending_reconciliation_count: number
  page: number
  page_size: number
  total: number
}

export interface NewDispatchFormData {
  dispatch_code?: string
  dispatch_date?: string
  bowser_number: string
  driver_name: string
  buyer_id?: string
  dispatched_litres: string
  temperature_c?: string
  fat_pct?: string
  snf_pct?: string
}

export interface QualityStatusDistributionItem {
  status: string
  count: number
  percentage: string
  litres: string
  color: string
}

export interface SessionQualityStats {
  count: number
  litres: string
  avg_fat: string
  avg_snf: string
  avg_temp: string
  accepted_count: number
  rejection_count: number
  acceptance_rate: string
}

export interface QualitySummaryData {
  total_tests: number
  acceptance_rate: string
  rejection_rate: string
  acidic_rate: string
  avg_fat: string
  avg_snf: string
  avg_temperature_c: string
  accepted_litres: string
  rejected_litres: string
  acidic_litres: string
  total_litres: string
  status_distribution: QualityStatusDistributionItem[]
  session_breakdown: {
    morning: SessionQualityStats
    evening: SessionQualityStats
  }
}

export interface QualityTrendPoint {
  date: string
  iso_date: string
  avg_fat: string
  avg_snf: string
  avg_temp: string
  total_litres: string
  accepted_litres: string
  rejected_litres: string
  acidic_litres: string
  rejection_rate_pct: string
}

export interface DailyQualityBreakdownItem {
  date: string
  session: string
  route_code: string
  samples: number
  total_litres: string
  avg_fat: string
  avg_snf: string
  avg_temp: string
  quality_grade: 'Grade A' | 'Standard' | 'Review'
}

export interface DailyQualityBreakdownResponse {
  items: DailyQualityBreakdownItem[]
  page: number
  page_size: number
  total: number
}

