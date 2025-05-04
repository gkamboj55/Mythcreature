import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin Dashboard - Magical Creature Creator",
  description: "Admin dashboard for managing magical creatures",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-purple-700">Magical Creature Admin</h1>
            <a href="/" className="text-purple-600 hover:text-purple-800 text-sm">
              Return to Main Site
            </a>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
