import React, { useState } from 'react'
import { Search, Bell, ChevronDown, User, LogOut, Shield } from 'lucide-react'

interface TopBarProps {
  onSearch?: (term: string) => void
}

export const TopBar: React.FC<TopBarProps> = ({ onSearch }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    if (onSearch) onSearch(e.target.value)
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Search bar matching UI Mockup */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search farmers, routes, dispatch, etc..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      {/* Right controls: notification bell & profile */}
      <div className="flex items-center space-x-4">
        {/* Notification Bell with indicator */}
        <button
          aria-label="Notifications"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* Vertical divider */}
        <div className="h-7 w-px bg-slate-200" />

        {/* Manager Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-inner">
              M
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight">Manager</div>
              <div className="text-[10px] text-slate-500 font-medium">Centre Manager</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">Operational Session</p>
                <p className="text-[11px] text-emerald-600 font-medium">Active: Morning Shift</p>
              </div>
              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
              >
                <Shield className="w-4 h-4 text-slate-400" />
                <span>Centre Settings</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => setDropdownOpen(false)}
                className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
