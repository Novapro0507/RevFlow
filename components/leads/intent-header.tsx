'use client'

import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'

export function IntentHeader() {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    // In production, this would trigger the search monitors to run
    await new Promise(resolve => setTimeout(resolve, 2000))
    setRefreshing(false)
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Google Intent Monitor</h1>
        <p className="text-muted-foreground">
          Track people actively searching for your services in real-time
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Scanning...' : 'Run Scan'}
        </Button>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Monitor
        </Button>
      </div>
    </div>
  )
}
