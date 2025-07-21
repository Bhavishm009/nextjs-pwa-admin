'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Loader2, Bell, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getAppIconPath } from "@/utils/getAppIconPath";
import { getValidAccessToken } from '@/lib/auth';


interface NotificationMessage {
  title: string;
  text: string;
}

interface NotificationLog {
  _id: string;
  app: string;
  title: string;
  text: string;
  time: number;
  groupedMessages?: NotificationMessage[];
}

const NotificationSkeleton = () => (
  <Card className="overflow-hidden">
    <CardContent className="p-6 space-y-4">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      <div className="h-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
    </CardContent>
  </Card>
);

export default function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [skip, setSkip] = useState(0);
  const limit = 12;

  const [selectedMessages, setSelectedMessages] = useState<NotificationMessage[]>([]);


  const fetchNotifications = useCallback(async (skipCount: number) => {
    setLoading(true)
  
    try {
      const token = await getValidAccessToken()
      if (!token) {
        throw new Error("Unauthorized – No valid access token")
      }
  
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications?limit=${limit}&skip=${skipCount}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ Add token here!
          },
          mode: "cors",
        }
      )
  
      const data = await res.json()
  
      if (!res.ok) {
        throw new Error(data.message || "Fetch failed")
      }
  
      if (skipCount === 0) {
        setLogs(data.logs)
        setTotalCount(data.total || 0)
      } else {
        setLogs((prev) => [...prev, ...data.logs])
      }
  
      setHasMore(data.logs.length === limit)
    } catch (err: any) {
      console.error("Fetch error:", err.message || err)
    } finally {
      setLoading(false)
    }
  }, [limit])
  

  useEffect(() => {
    fetchNotifications(0);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= document.documentElement.scrollHeight - 1000 &&
        hasMore &&
        !loading
      ) {
        const newSkip = skip + limit;
        setSkip(newSkip);
        fetchNotifications(newSkip);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [skip, hasMore, loading, fetchNotifications]);

  // 🔍 Check whether notification is from last 30 mins
  const isRecent = (timestamp: number) => {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
    return Number(timestamp) > thirtyMinutesAgo;
  };

  return (
    <div className="space-y-6 lg:px-6 px-2 pb-12">
      {/* Stat Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="lg:p-6 p-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notification Logs</CardTitle>
              <p className="text-sm text-gray-600 mt-1">View and manage your notifications</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className='lg:p-6 p-[10px]'>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {logs?.map((log, i) => {
              const showRecentStyle = isRecent(log.time);
              return (
                <Dialog key={`${log._id}-${i}`}>
                  <DialogTrigger asChild>
                    <Card
                      className={`cursor-pointer transition border hover:shadow ${showRecentStyle ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      onClick={() => setSelectedMessages(log?.groupedMessages || [])}
                    >
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{log.title || '(no title)'}</h3>
                          <Badge variant="outline" className="text-xs">
                          {/* {log.app?.slice(0, 22)} */}
                            <img
                              src={getAppIconPath(log.app)}
                              alt={log.app}
                              className="h-6 w-6 rounded"
                            /></Badge>
                        </div>
                        <p className="text-sm text-gray-600">{log.text || '(no text)'}</p>

                        <p className="text-xs text-gray-400">{new Date(Number(log.time)).toLocaleString()}</p>

                        {log.groupedMessages && log.groupedMessages.length > 0 && (
                          <div className="flex items-center gap-2 text-sm mt-2 text-blue-700">
                            <MessageSquare className="h-4 w-4" />
                            {log.groupedMessages.length} Messages
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                  {log?.groupedMessages?.length > 0 && (
                    <DialogContent className='w-[90%] mx-auto'>
                      <DialogHeader>
                        <DialogTitle>Grouped Messages</DialogTitle>
                        <DialogDescription>{log?.groupedMessages?.length} messages grouped in this notification.</DialogDescription>
                      </DialogHeader>

                      <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
                        {log?.groupedMessages.map((msg, index) => (
                          <div
                            key={index}
                            className="p-3 bg-gray-100 border rounded space-y-1 text-sm"
                          >
                            <p className="font-semibold">{msg.title}</p>
                            <p className="text-gray-700">{msg.text}</p>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              );
            })}

            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <NotificationSkeleton key={`loading-${index}`} />
              ))}
          </div>

          {loading && logs?.length > 0 && (
            <div className="flex justify-center py-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span>Loading more notifications...</span>
              </div>
            </div>
          )}

          {!hasMore && logs?.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              You've reached the end of the notification list!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
