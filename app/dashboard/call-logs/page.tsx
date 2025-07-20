'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, PhoneCall, Clock, ArrowDownLeft, ArrowUpRight, PhoneOff, Loader } from 'lucide-react'
import { getValidAccessToken } from '@/lib/auth'

interface CallLog {
  _id: string
  timestamp: string
  name: string
  phoneNumber: string
  duration: string
  type: string
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const limit = 12

  const fetchCallLogs = useCallback(async (skipCount: number) => {
    setLoading(true);
    try {
      const token = await getValidAccessToken()

      if (!token) {
        throw new Error("Unauthorized: No valid access token found.")
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/calllogs?limit=${limit}&skip=${skipCount}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // ✅ Send access token here
          },
          mode: 'cors',
        }
      )

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`)
      }

      const data = await res.json()

      if (skipCount === 0) {
        setLogs(data.logs)
      } else {
        setLogs(prev => [...prev, ...data.logs])
      }

      setHasMore(data.logs.length === limit)
    } catch (error) {
      console.error('Failed to fetch call logs:', error)
    } finally {
      setLoading(false)
    }
  }, [limit])


  useEffect(() => {
    fetchCallLogs(0)
  }, [fetchCallLogs])

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.scrollHeight - 100 &&
        hasMore &&
        !loading
      ) {
        const newSkip = skip + limit
        setSkip(newSkip)
        fetchCallLogs(newSkip)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [skip, loading, hasMore, fetchCallLogs]);


  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getTypeIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "INCOMING":
        return <ArrowDownLeft className="h-6 w-6 text-green-600" />;
      case "OUTGOING":
        return <ArrowUpRight className="h-6 w-6 text-blue-600" />;
      case "MISSED":
        return <PhoneOff className="h-6 w-6 text-red-600" />;
      default:
        return <PhoneCall className="h-6 w-6 text-gray-500" />;
    }
  };



  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-2">
        {logs.map((log) => (
          <Card key={log._id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{log.name || 'Unknown'}</p>
                  <p className="text-lg font-semibold">{log.phoneNumber}</p>
                </div>
                <div className="bg-blue-100 text-blue-700 font-medium px-2 py-1 rounded text-xs flex justify-center items-center">
                  <p>{getTypeIcon(log.type)}</p>
                  <p>{log.type}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <PhoneCall className="h-4 w-4" /> {formatDuration(Number(log.duration))}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(Number(log.timestamp)).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4 text-blue-600">
            <Loader className="h-20 w-20 animate-spin" />
            <p className="text-lg font-semibold">Loading, please wait...</p>
          </div>
        </div>

      )}

      {!hasMore && logs.length > 0 && (
        <div className="text-center text-gray-500 py-4">
          You've reached the end of the call log list!
        </div>
      )}
    </div>
  )
}
