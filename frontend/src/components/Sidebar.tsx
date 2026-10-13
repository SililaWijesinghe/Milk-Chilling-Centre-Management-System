import React from 'react'
import {
  LayoutDashboard,
  Users,
  MapPin,
  Milk,
  FlaskConical,
  Database,
  Truck,
  CreditCard,
  ShoppingBag,
  Receipt,
  BookOpen,
  FileText,
  UserCheck,
  FileSpreadsheet,
  PieChart,
  ShieldCheck,
  Calculator,
  Settings as SettingsIcon,
  FileClock,
} from 'lucide-react'

interface SidebarProps {
  currentView: string
  onSelectView: (view: string) => void
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  return (
    <aside className="w-64 bg-[#0a2f1d] text-white flex flex-col flex-shrink-0 select-none border-r border-[#13492e] h-screen sticky top-0 overflow-y-auto">
      {/* Brand Logo Header */}
      <div className="p-4 flex items-center space-x-3 border-b border-[#14482f]/60">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center p-1.5 shadow-inner">
          <svg viewBox="0 0 40 40" fill="none" className="w-full h-full text-white">
            <path
              d="M12 10C8 10 5 14 6 18C7 22 10 23 12 25C13 32 17 35 20 35C23 35 27 32 28 25C30 23 33 22 34 18C35 14 32 10 28 10C26 10 24 13 20 13C16 13 14 10 12 10Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="22" r="1.5" fill="currentColor" />
            <circle cx="24" cy="22" r="1.5" fill="currentColor" />
            <path d="M18 28C19 29 21 29 22 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <h1 className="font-extrabold text-lg tracking-wider text-white">MCCMS</h1>
          <p className="text-[10px] text-emerald-300/80 leading-tight">Milk Chilling Centre<br />Management System</p>
        </div>
      </div>

      {/* Main Dashboard item */}
      <div className="px-3 pt-3">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
            currentView === 'dashboard'
              ? 'bg-[#10b981] text-white shadow-lg shadow-emerald-900/40'
              : 'text-emerald-100 hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Section: OPERATIONS */}
      <div className="px-3 pt-5">
        <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-emerald-400/70 uppercase">
          Operations
        </div>
        <nav className="space-y-0.5">
          <SidebarItem
            icon={<Users className="w-4 h-4" />}
            label="Farmers"
            active={currentView === 'farmers' || currentView === 'farmer-detail'}
            onClick={() => onSelectView('farmers')}
          />
          <SidebarItem
            icon={<MapPin className="w-4 h-4" />}
            label="Routes & Vehicles"
            active={currentView === 'routes'}
            onClick={() => onSelectView('routes')}
          />
          <SidebarItem
            icon={<Milk className="w-4 h-4" />}
            label="Milk Collection"
            active={currentView === 'collections'}
            onClick={() => onSelectView('collections')}
          />
          <SidebarItem
            icon={<FlaskConical className="w-4 h-4" />}
            label="Quality Analysis"
            active={currentView === 'quality'}
            onClick={() => onSelectView('quality')}
          />
          <SidebarItem
            icon={<Database className="w-4 h-4" />}
            label="Chilling Stock"
            active={currentView === 'stock'}
            onClick={() => onSelectView('stock')}
          />
          <SidebarItem
            icon={<Truck className="w-4 h-4" />}
            label="Bowser Dispatch"
            active={currentView === 'dispatch'}
            onClick={() => onSelectView('dispatch')}
          />
        </nav>
      </div>

      {/* Section: FINANCE */}
      <div className="px-3 pt-5">
        <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-emerald-400/70 uppercase">
          Finance
        </div>
        <nav className="space-y-0.5">
          <SidebarItem
            icon={<CreditCard className="w-4 h-4" />}
            label="Farmer Payments"
            active={currentView === 'payments'}
            onClick={() => onSelectView('payments')}
          />
          <SidebarItem
            icon={<ShoppingBag className="w-4 h-4" />}
            label="Input Sales"
            active={currentView === 'input-sales'}
            onClick={() => onSelectView('input-sales')}
          />
          <SidebarItem
            icon={<Receipt className="w-4 h-4" />}
            label="Expenses"
            active={currentView === 'expenses'}
            onClick={() => onSelectView('expenses')}
          />
          <SidebarItem
            icon={<BookOpen className="w-4 h-4" />}
            label="Buyer Ledger"
            active={currentView === 'buyer-ledger'}
            onClick={() => onSelectView('buyer-ledger')}
          />
        </nav>
      </div>

      {/* Section: REPORTS */}
      <div className="px-3 pt-5">
        <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-emerald-400/70 uppercase">
          Reports
        </div>
        <nav className="space-y-0.5">
          <SidebarItem
            icon={<FileText className="w-4 h-4" />}
            label="Daily Reports"
            active={currentView === 'daily-reports'}
            onClick={() => onSelectView('daily-reports')}
          />
          <SidebarItem
            icon={<UserCheck className="w-4 h-4" />}
            label="Farmer Reports"
            active={currentView === 'farmer-reports'}
            onClick={() => onSelectView('farmer-reports')}
          />
          <SidebarItem
            icon={<FileSpreadsheet className="w-4 h-4" />}
            label="Collection Reports"
            active={currentView === 'collection-reports'}
            onClick={() => onSelectView('collection-reports')}
          />
          <SidebarItem
            icon={<PieChart className="w-4 h-4" />}
            label="Financial Reports"
            active={currentView === 'financial-reports'}
            onClick={() => onSelectView('financial-reports')}
          />
        </nav>
      </div>

      {/* Section: SYSTEM */}
      <div className="px-3 pt-5 pb-6">
        <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-emerald-400/70 uppercase">
          System
        </div>
        <nav className="space-y-0.5">
          <SidebarItem
            icon={<ShieldCheck className="w-4 h-4" />}
            label="Users & Roles"
            active={currentView === 'users'}
            onClick={() => onSelectView('users')}
          />
          <SidebarItem
            icon={<Calculator className="w-4 h-4" />}
            label="Pricing Matrix"
            active={currentView === 'pricing'}
            onClick={() => onSelectView('pricing')}
          />
          <SidebarItem
            icon={<SettingsIcon className="w-4 h-4" />}
            label="Settings"
            active={currentView === 'settings'}
            onClick={() => onSelectView('settings')}
          />
          <SidebarItem
            icon={<FileClock className="w-4 h-4" />}
            label="Audit Logs"
            active={currentView === 'audit'}
            onClick={() => onSelectView('audit')}
          />
        </nav>
      </div>
    </aside>
  )
}

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-emerald-600/30 text-emerald-300 font-semibold'
          : 'text-emerald-100/80 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-emerald-400' : 'text-emerald-300/70'}>{icon}</span>
      <span>{label}</span>
    </button>
  )
}
