"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          忘記密碼
        </h1>
        <form className="space-y-4">
          <Input type="email" placeholder="輸入你的電子郵件" required />
          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
            發送重設連結
          </Button>
        </form>
        <p className="text-sm text-center text-gray-500 mt-4">
          想起密碼了？{" "}
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
