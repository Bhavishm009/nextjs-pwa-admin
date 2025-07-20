export async function getValidAccessToken(): Promise<string | null> {
    const accessToken = localStorage.getItem("accessToken")
    const refreshToken = localStorage.getItem("refreshToken")
  
    if (!accessToken) return null
  
    // Decode expiration (optional)
    const payload = JSON.parse(atob(accessToken.split(".")[1]))
    const exp = payload.exp * 1000 // JWT expiry is in seconds
  
    if (Date.now() < exp - 60_000) {
      return accessToken // ✅ still valid
    }
  
    // 🌐 Access token expired -> refresh
    if (!refreshToken) return null
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
  
      const data = await res.json()
  
      if (!res.ok) throw new Error("Token refresh failed")
  
      localStorage.setItem("accessToken", data.accessToken)
      return data.accessToken
    } catch (err) {
      console.error("Token refresh error:", err)
      localStorage.clear()
      return null
    }
  }
  