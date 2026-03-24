'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ScrollText } from 'lucide-react'
import { getValidAccessToken } from '@/lib/auth'
import { API_URL } from '@/lib/config'

interface LogItem {
  ts?: string
  type?: string
  source?: string
  level?: string
  message?: string
  details?: unknown
  route?: string
  itemId?: string
  error?: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getValidAccessToken()
      if (!token) throw new Error('Unauthorized')

      const res = await fetch(`${API_URL}/logs?limit=150`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Logs fetch failed')
      setLogs(data.logs || [])
    } catch (e) {
      console.error('Logs fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-blue-600" /> App and Server Logs
          </CardTitle>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && logs.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {!loading && logs.length === 0 && (
            <p className="text-sm text-gray-500">No logs available yet.</p>
          )}

          {logs.map((log, index) => (
            <div key={`${log.ts || 'no-ts'}-${index}`} className="rounded-lg border border-gray-200 p-3 text-sm">
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                <span>{log.ts || 'No timestamp'}</span>
                <span>{log.level || log.type || 'info'}</span>
                <span>{log.source || log.route || 'server'}</span>
              </div>
              <div className="mt-2 font-medium text-gray-900">
                {log.message || log.type || 'Log entry'}
              </div>
              {log.itemId && <div className="mt-1 text-xs text-gray-600">itemId: {log.itemId}</div>}
              {log.error && <div className="mt-1 text-xs text-red-600">error: {log.error}</div>}
              {log.details && (
                <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-700">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
