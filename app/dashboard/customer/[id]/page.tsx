"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Mail, Building, User } from "lucide-react"

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  image: string
  address: {
    address: string
    city: string
    state: string
    country: string
    postalCode: string
  }
  company: {
    name: string
    title: string
    department: string
  }
  age: number
  gender: string
  birthDate: string
  bloodGroup: string
  height: number
  weight: number
  eyeColor: string
  hair: {
    color: string
    type: string
  }
  bank: {
    cardExpire: string
    cardNumber: string
    cardType: string
    currency: string
    iban: string
  }
}

const DetailSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
      <div className="lg:col-span-2 space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      </div>
    </div>
  </div>
)

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`https://dummyjson.com/users/${params.id}`)
        const data = await response.json()
        setCustomer(data)
      } catch (error) {
        console.error("Error fetching customer:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCustomer()
  }, [params.id])

  const handleBack = () => {
    const lastListingPage = localStorage.getItem("lastListingPage") || "/dashboard/customers"
    router.push(lastListingPage)
  }

  if (loading) {
    return <DetailSkeleton />
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <Card>
          <CardContent className="p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer not found</h2>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Customers
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="h-24 w-24 mx-auto mb-4">
              <AvatarImage
                src={customer.image || "/placeholder.svg"}
                alt={`${customer.firstName} ${customer.lastName}`}
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                {getInitials(customer.firstName, customer.lastName)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {customer.firstName} {customer.lastName}
            </h2>
            <p className="text-gray-600 mb-4">{customer.company.title}</p>
            <div className="flex justify-center space-x-2 mb-4">
              <Badge variant="outline">{customer.gender}</Badge>
              <Badge variant="secondary">Age {customer.age}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="mr-2 h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{customer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <p className="text-gray-900">
                  {customer.address.address}, {customer.address.city}, {customer.address.state}{" "}
                  {customer.address.postalCode}, {customer.address.country}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Company</label>
                  <p className="text-gray-900">{customer.company.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-gray-900">{customer.company.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Birth Date</label>
                  <p className="text-gray-900">{new Date(customer.birthDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Blood Group</label>
                  <p className="text-gray-900">{customer.bloodGroup}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Eye Color</label>
                  <p className="text-gray-900">{customer.eyeColor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Height / Weight</label>
                  <p className="text-gray-900">
                    {customer.height}cm / {customer.weight}kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
