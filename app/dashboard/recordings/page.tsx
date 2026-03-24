'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Mic, Clock, PhoneCall, Download } from 'lucide-react'
import { getValidAccessToken } from '@/lib/auth'
import { API_URL } from '@/lib/config'
import { formatTimestamp12Hour } from '@/lib/datetime'

interface RecordingItem {
  _id: string
  itemId: string
  originalName?: string
  mimetype?: string
  size?: number
  metadata?: { phoneNumber?: string }
  createdAt: string
}

export default function RecordingsPage() {
  const [items, setItems] = useState<RecordingItem[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [skip, setSkip] = useState(0)
  const [audioMap, setAudioMap] = useState<Record<string, string>>({})
  const limit = 12

  const fetchRecordings = useCallback(async (skipCount: number) => {
    setLoading(true)
    try {
      const token = await getValidAccessToken()
      if (!token) throw new Error('Unauthorized')

      const res = await fetch(
        `${API_URL}/recordings?limit=${limit}&skip=${skipCount}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fetch failed')

      if (skipCount === 0) {
        setItems(data.records)
      } else {
        setItems(prev => [...prev, ...data.records])
      }
      setHasMore(data.records.length === limit)
    } catch (e) {
      console.error('Recording fetch error', e)
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchRecordings(0)
  }, [fetchRecordings])

  useEffect(() => {
    return () => {
      Object.values(audioMap).forEach(url => URL.revokeObjectURL(url))
    }
  }, [audioMap])

  const loadAudio = async (id: string) => {
    try {
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
    } catch (e) {
      console.error('Audio load error', e)
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
    } catch (e) {
      console.error('Audio download error', e)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" /> Call Recordings
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item._id} className="border border-gray-200">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneCall className="h-4 w-4" />
                    <span>{item.metadata?.phoneNumber || 'Unknown number'}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {(item.size ? item.size / 1024 / 1024 : 0).toFixed(1)} MB
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-4 w-4" />
                  {formatTimestamp12Hour(item.createdAt)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadAudio(item._id)}
                  >
                    {audioMap[item._id] ? 'Reload' : 'Load'} audio
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadAudio(item._id, item.originalName)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
                {audioMap[item._id] && (
                  <audio controls src={audioMap[item._id]} className="w-full mt-2" />
                )}
              </CardContent>
            </Card>
          ))}

          {loading && (
            <div className="flex items-center justify-center py-8 col-span-full">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          )}

          {!hasMore && items.length === 0 && !loading && (
            <p className="text-gray-500 text-sm col-span-full">No recordings yet.</p>
          )}
        </CardContent>
      </Card>

      {!loading && hasMore && (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => { const s = skip + limit; setSkip(s); fetchRecordings(s); }}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
