'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Download,
  Loader,
  Loader2,
  Mic,
  PhoneCall,
  PhoneOff,
} from 'lucide-react'
import { getValidAccessToken } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { formatTimestamp12Hour } from '@/lib/datetime'

interface CallLog {
  _id: string
  timestamp: string
  name: string
  phoneNumber: string
  duration: string
  type: string
}

interface RecordingItem {
  _id: string
  itemId: string
  originalName?: string
  mimetype?: string
  size?: number
  metadata?: { phoneNumber?: string; audioSource?: string; durationMs?: number }
  createdAt: string
}

const normalizePhone = (value?: string) => (value || '').replace(/\D/g, '')

const phonesMatch = (left?: string, right?: string) => {
  const a = normalizePhone(left)
  const b = normalizePhone(right)

  if (!a || !b) return false
  if (a === b) return true

  const shorter = a.length <= b.length ? a : b
  const longer = a.length > b.length ? a : b

  return shorter.length >= 7 && longer.endsWith(shorter)
}

const parseRecordingTimestamp = (recording: RecordingItem) => {
  const idx = recording.itemId?.lastIndexOf('_') ?? -1
  const ts = idx >= 0 ? Number(recording.itemId.slice(idx + 1)) : NaN

  if (Number.isFinite(ts)) return ts

  return new Date(recording.createdAt).getTime()
}

const getTypeIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case 'INCOMING':
      return <ArrowDownLeft className="h-6 w-6 text-green-600" />
    case 'OUTGOING':
      return <ArrowUpRight className="h-6 w-6 text-blue-600" />
    case 'MISSED':
      return <PhoneOff className="h-6 w-6 text-red-600" />
    default:
      return <PhoneCall className="h-6 w-6 text-gray-500" />
  }
}

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  if (mins > 0) {
    return `${mins}m ${secs}s`
  }

  return `${secs}s`
}

export default function CallLogsPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [recordings, setRecordings] = useState<RecordingItem[]>([])
  const [audioMap, setAudioMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [recordingsLoading, setRecordingsLoading] = useState(false)
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const limit = 12

  const fetchCallLogs = useCallback(async (skipCount: number) => {
    setLoading(true)
    try {
      const token = await getValidAccessToken()
      if (!token) {
        throw new Error('Unauthorized: No valid access token found.')
      }

      const res = await fetch(`${API_URL}/calllogs?limit=${limit}&skip=${skipCount}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        mode: 'cors',
      })

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

  const fetchRecordings = useCallback(async () => {
    setRecordingsLoading(true)
    try {
      const token = await getValidAccessToken()
      if (!token) {
        throw new Error('Unauthorized: No valid access token found.')
      }

      const res = await fetch(`${API_URL}/recordings?limit=200&skip=0`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Recording fetch failed')
      }

      setRecordings(data.records || [])
    } catch (error) {
      console.error('Failed to fetch recordings:', error)
    } finally {
      setRecordingsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCallLogs(0)
    fetchRecordings()
  }, [fetchCallLogs, fetchRecordings])

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
  }, [skip, loading, hasMore, fetchCallLogs])

  useEffect(() => {
    return () => {
      Object.values(audioMap).forEach(url => URL.revokeObjectURL(url))
    }
  }, [])

  const loadAudio = async (id: string) => {
    try {
      setAudioLoadingId(id)

      const token = await getValidAccessToken()
      if (!token) throw new Error('Unauthorized')

      const existingUrl = audioMap[id]
      if (existingUrl) {
        URL.revokeObjectURL(existingUrl)
      }

      const res = await fetch(`${API_URL}/recordings/file/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Audio fetch failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      setAudioMap(prev => ({ ...prev, [id]: url }))
    } catch (error) {
      console.error('Audio load error', error)
    } finally {
      setAudioLoadingId(null)
    }
  }

  const downloadAudio = async (id: string, fallbackName?: string) => {
    try {
      const token = await getValidAccessToken()
      if (!token) throw new Error('Unauthorized')

      const res = await fetch(`${API_URL}/recordings/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Download failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = fallbackName || `${id}.m4a`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Audio download error', error)
    }
  }

  const getMatchedRecordings = (log: CallLog) => {
    const callTs = Number(log.timestamp || 0)

    return recordings
      .filter(recording => {
        const recordingTs = parseRecordingTimestamp(recording)

        return (
          phonesMatch(recording.metadata?.phoneNumber, log.phoneNumber) &&
          Math.abs(recordingTs - callTs) <= 4 * 60 * 60 * 1000
        )
      })
      .sort((a, b) => {
        const aDelta = Math.abs(parseRecordingTimestamp(a) - callTs)
        const bDelta = Math.abs(parseRecordingTimestamp(b) - callTs)
        return aDelta - bDelta
      })
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Call Records</CardTitle>
          <p className="text-sm text-gray-600">
            Call history with matched recordings and all timestamps shown in 12-hour format.
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {logs.map(log => {
          const matchedRecordings = getMatchedRecordings(log)

          return (
            <Card key={log._id} className="overflow-hidden border-gray-200 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-500">{log.name || 'Unknown contact'}</p>
                      <p className="text-xl font-semibold tracking-tight text-gray-900">{log.phoneNumber}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                        <PhoneCall className="h-4 w-4" />
                        {formatDuration(Number(log.duration || 0))}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                        <Clock className="h-4 w-4" />
                        {formatTimestamp12Hour(Number(log.timestamp))}
                      </span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="flex w-fit items-center gap-2 px-3 py-1 text-sm">
                    {getTypeIcon(log.type)}
                    {log.type}
                  </Badge>
                </div>

                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium text-gray-900">Matched call recordings</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {recordingsLoading ? 'Checking recordings...' : `${matchedRecordings.length} found`}
                    </span>
                  </div>

                  {matchedRecordings.length === 0 ? (
                    <p className="text-sm text-gray-500">No recording available for this call.</p>
                  ) : (
                    <div className="space-y-3">
                      {matchedRecordings.map(recording => (
                        <div key={recording._id} className="rounded-xl border border-gray-200 bg-white p-3">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-900">
                                {recording.originalName || recording.itemId}
                              </p>
                              <p className="text-xs text-gray-500">
                                Recorded at {formatTimestamp12Hour(parseRecordingTimestamp(recording))}
                              </p>
                              <p className="text-xs text-gray-500">
                                Source: {recording.metadata?.audioSource || 'Unknown'}
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => loadAudio(recording._id)}
                                disabled={audioLoadingId === recording._id}
                              >
                                {audioLoadingId === recording._id ? 'Loading...' : audioMap[recording._id] ? 'Reload audio' : 'Load audio'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadAudio(recording._id, recording.originalName)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          </div>

                          {audioMap[recording._id] && (
                            <audio controls src={audioMap[recording._id]} className="mt-3 w-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {loading && (
        <div className="flex items-center justify-center h-screen">
          <div className="flex flex-col items-center space-y-4 text-blue-600">
            <Loader className="h-20 w-20 animate-spin" />
            <p className="text-lg font-semibold">Loading, please wait...</p>
          </div>
        </div>
      )}

      {recordingsLoading && !loading && logs.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          Matching recordings with calls...
        </div>
      )}

      {!hasMore && logs.length > 0 && (
        <div className="text-center text-gray-500 py-4">
          You&apos;ve reached the end of the call log list.
        </div>
      )}
    </div>
  )
}
