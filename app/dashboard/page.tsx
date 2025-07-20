'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, PhoneCall, Clock, ArrowDownLeft, ArrowUpRight, PhoneOff, Loader } from 'lucide-react'

interface CallLog {
  _id: string
  timestamp: string
  name: string
  phoneNumber: string
  duration: string
  type: string
}

export default function DashboardPage() {
  

  return (
    <div className="space-y-6">
      Home
    </div>
  )
}
