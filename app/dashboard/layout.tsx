"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import { LogOut, Menu, Settings, Bell, Heart, Home, BellRing, Phone, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getValidAccessToken } from "@/lib/auth"

interface SidebarNavItemProps {
  href: string
  icon: React.ElementType
  label: string
  isActive: boolean
  onClick: () => void
}

function SidebarNavItem({ href, icon: Icon, label, isActive, onClick }: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
    >
      <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-600" : "text-gray-400"}`} />
      {label}
    </button>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter()
  const pathname = usePathname()

  // 🔐 Auth check on mount
  useEffect(() => {
    async function validateUser() {
      const token = await getValidAccessToken()
      if (!token) {
        router.replace("/login")
        return
      }

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (!res.ok) throw new Error("Unauthorized")
        return res.json()
      }).then(data => {
        setUser(data)
      }).catch(() => {
        localStorage.clear()
        router.replace("/login")
      }).finally(() => {
        setLoading(false)
      })
    }

    validateUser()
  }, [])


  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken")

      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Optionally ignored so local cleanup still happens
    }

    // Clear client storage no matter what
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("user")

    router.push("/login")
  }


  const handleNavigation = (href: string) => {
    router.push(href)
    setIsSidebarOpen(false)
  }

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Call Logs"
    if (pathname === "/dashboard/customers") return "Notifications"
    if (pathname?.includes("/call-logs")) return "Call Logs"
    if (pathname?.includes("/notifications")) return "Notifications"
    return "Dashboard"
  }

  // ✅ Show loading screen if still checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-gray-700">Verifying session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Track</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden ml-auto"
            onClick={() => setIsSidebarOpen(false)}
          >
            X
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6">
          <SidebarNavItem
            href="/dashboard"
            icon={Home}
            label="Home"
            isActive={pathname === "/dashboard"}
            onClick={() => handleNavigation("/dashboard")}
          />
          <SidebarNavItem
            href="/dashboard/call-logs"
            icon={Phone}
            label="Calllogs"
            isActive={pathname === "/dashboard/call-logs"}
            onClick={() => handleNavigation("/dashboard/call-logs")}
          />
          <SidebarNavItem
            href="/dashboard/notifications"
            icon={BellRing}
            label="Notifications"
            isActive={pathname === "/dashboard/notifications"}
            onClick={() => handleNavigation("/dashboard/notifications")}
          />
        </nav>

        <div className="border-t border-gray-200 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                <div className="flex items-center space-x-3 w-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                      {user?.username?.[0] || "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email || "admin@yourdomain.com"}</p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{getPageTitle()}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white" placeholder="Search..." />
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>
          </div>
        </header>

        <main className="lg:p-6 p-2">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </main>
      </div>
    </div>
  )
}
