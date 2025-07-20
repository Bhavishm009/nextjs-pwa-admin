"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Star, Package, Truck, Shield, Heart, Share2 } from "lucide-react"
import Image from "next/image"

interface Product {
  id: number
  title: string
  description: string
  price: number
  discountPercentage: number
  rating: number
  stock: number
  brand: string
  category: string
  thumbnail: string
  images: string[]
  warrantyInformation?: string
  shippingInformation?: string
  returnPolicy?: string
}

const DetailSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  </div>
)

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`https://dummyjson.com/products/${params.id}`)
        const data = await response.json()
        setProduct(data)
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handleBack = () => {
    const lastListingPage = localStorage.getItem("lastListingPage") || "/dashboard"
    router.push(lastListingPage)
  }

  if (loading) {
    return <DetailSkeleton />
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Card>
          <CardContent className="p-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h2>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const discountedPrice = product.price * (1 - product.discountPercentage / 100)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="aspect-square relative bg-gray-50">
              <Image
                src={product.images[selectedImage] || product.thumbnail}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </Card>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square relative overflow-hidden rounded-lg border-2 transition-all ${
                    selectedImage === index ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`${product.title} ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="100px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{product.category}</Badge>
                <Badge variant="secondary">{product.brand}</Badge>
                {product.stock < 10 && <Badge variant="destructive">Low Stock</Badge>}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>

              <div className="flex items-center space-x-2 mb-4">
                <div className="flex items-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">({product.rating})</span>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex items-center space-x-2">
                  {product.discountPercentage > 0 && (
                    <span className="text-3xl font-bold text-green-600">${discountedPrice.toFixed(2)}</span>
                  )}
                  <span
                    className={`text-2xl ${
                      product.discountPercentage > 0 ? "line-through text-gray-500" : "font-bold text-gray-900"
                    }`}
                  >
                    ${product.price}
                  </span>
                  {product.discountPercentage > 0 && (
                    <Badge variant="destructive">{product.discountPercentage}% OFF</Badge>
                  )}
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-6">{product.description}</p>

              <div className="flex space-x-3 mb-6">
                <Button className="flex-1" size="lg">
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Product Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-sm font-medium text-gray-600">Stock</p>
                <p className={`text-xl font-bold ${product.stock < 10 ? "text-red-600" : "text-green-600"}`}>
                  {product.stock}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <p className="text-xl font-bold text-gray-900">{product.rating}/5</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {product.shippingInformation || "Free shipping on orders over $50"}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{product.warrantyInformation || "1 year warranty included"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
