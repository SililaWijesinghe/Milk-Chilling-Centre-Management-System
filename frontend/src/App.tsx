import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DashboardView } from './components/DashboardView'
import { FarmersManagementView } from './components/FarmersManagementView'
import { DailyMilkCollectionView } from './views/DailyMilkCollectionView'
import { QualityAnalysisView } from './views/QualityAnalysisView'
import { ChillingStockView } from './views/ChillingStockView'
import { BowserDispatchView } from './views/BowserDispatchView'

export function App() {
  const [currentView, setCurrentView] = useState<string>('dashboard')
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null)

  const handleNavigate = (view: string) => {
    setCurrentView(view)
    if (view !== 'farmers') {
      setSelectedFarmerId(null)
    }
  }

  const handleSelectFarmer = (id: string | null) => {
    setSelectedFarmerId(id)
    if (id) {
      setCurrentView('farmers')
    }
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans antialiased overflow-hidden">
      {/* 1. Dark Green Brand Sidebar */}
      <Sidebar
        currentView={currentView}
        onSelectView={(view) => handleNavigate(view)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* 2. Top Bar Navigation */}
        <TopBar onSearch={(term) => console.log('Searching:', term)} />

        {/* 3. Active View */}
        <main className="flex-1 pb-12">
          {currentView === 'dashboard' && (
            <DashboardView onNavigate={(view) => handleNavigate(view)} />
          )}

          {currentView === 'farmers' && (
            <FarmersManagementView
              selectedFarmerId={selectedFarmerId}
              onSelectFarmer={handleSelectFarmer}
            />
          )}

          {currentView === 'collections' && (
            <DailyMilkCollectionView />
          )}

          {currentView === 'quality' && (
            <QualityAnalysisView />
          )}

          {currentView === 'stock' && (
            <ChillingStockView />
          )}

          {currentView === 'dispatch' && (
            <BowserDispatchView />
          )}

          {![
            'dashboard',
            'farmers',
            'collections',
            'quality',
            'stock',
            'dispatch',
          ].includes(currentView) && (
            <div className="p-8 max-w-[1200px] mx-auto text-center space-y-4">
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-black text-2xl">
                  {currentView.substring(0, 2).toUpperCase()}
                </div>
                <h2 className="text-xl font-black text-slate-800 capitalize tracking-tight">
                  {currentView.replace('-', ' ')} Module
                </h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-2">
                  This Level 2 MCCMS module is scheduled for development in the next phase. You can navigate back to the Dashboard or Farmers directory.
                </p>
                <div className="mt-6 flex items-center justify-center space-x-3">
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigate('farmers')}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                  >
                    View Farmers Directory
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
