"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignupPage() {
  const router = useRouter()

  // ✅ 用 state 來存表單值
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault() // ✅ 防止表單自動刷新

    if (password !== confirmPassword) {
      alert('密碼與確認密碼不一致')
      return
    }

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (data.userId) {
      router.push(`/register/step/2?userId=${data.userId}`)
    } else {
      alert('註冊失敗')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          建立新帳戶
        </h1>
        <form className="space-y-4" onSubmit={handleSignup}>
          <Input
            type="email"
            placeholder="電子郵件"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            type="password"
            placeholder="密碼"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="確認密碼"
            required
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            註冊
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          已有帳戶？{" "}
          <Link
            href="/login"
            className="text-teal-600 hover:text-teal-700 transition"
          >
            返回登入
          </Link>
        </p>
      </div>
    </div>
  )
}
