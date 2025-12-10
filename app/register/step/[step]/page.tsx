"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type PersonalInfo = {
  name: string
  gender: string
  birthDate: string
  address: string
  avatar: string | null
}

type HealthInfo = {
  height: string
  weight: string
  bloodType: string // 目前改為 A+/A-/B+...
  allergies: string
  medications: string
  medicalHistory: string
  familyHistory: string // 新增家族病史
}

export default function RegisterStep() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")

  const [step, setStep] = useState(2)

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: "",
    gender: "",
    birthDate: "",
    address: "",
    avatar: null,
  })

  const [healthInfo, setHealthInfo] = useState<HealthInfo>({
    height: "",
    weight: "",
    bloodType: "",
    allergies: "",
    medications: "",
    medicalHistory: "",
    familyHistory: "",
  })

  const handleNext = async () => {
    if (!userId) {
      alert("找不到使用者 ID")
      return
    }

    try {
      if (step === 2) {
        const payload = {
          ...personalInfo,
          userId,
          birthDate: personalInfo.birthDate || null,
        }

        const res = await fetch("/api/personal_info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }

      if (step === 3) {
        const payload = {
          ...healthInfo,
          userId,
          height: healthInfo.height || null,
          weight: healthInfo.weight || null,
        }

        const res = await fetch("/api/health_info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }

      if (step < 3) setStep(step + 1)
      else router.push("/") // 完成導向主畫面
    } catch (err: any) {
      alert("儲存失敗：" + err.message)
    }
  }

  const handlePrev = () => {
    if (step > 2) setStep(step - 1)
  }

  const handleCancel = () => {
    router.push("/") // 取消註冊直接回首頁
  }

  const progressText = ["Step 2：基本資料", "Step 3：健康資料"]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">{progressText[step - 2]}</CardTitle>
          <CardDescription>完成此步驟可提升健康建議的精準度</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <Label>姓名</Label>
                <Input
                  value={personalInfo.name}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, name: e.target.value })
                  }
                  placeholder="王小明"
                />
              </div>
              <div>
                <Label>性別</Label>
                <Select
                  value={personalInfo.gender}
                  onValueChange={(value) =>
                    setPersonalInfo({ ...personalInfo, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇性別" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">男性</SelectItem>
                    <SelectItem value="female">女性</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>出生日期</Label>
                <Input
                  type="date"
                  value={personalInfo.birthDate}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, birthDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>地址</Label>
                <Input
                  value={personalInfo.address}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, address: e.target.value })
                  }
                  placeholder="台北市大安區..."
                />
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <Label>身高 (cm)</Label>
                <Input
                  value={healthInfo.height}
                  onChange={(e) =>
                    setHealthInfo({ ...healthInfo, height: e.target.value })
                  }
                  placeholder="170"
                />
              </div>
              <div>
                <Label>體重 (kg)</Label>
                <Input
                  value={healthInfo.weight}
                  onChange={(e) =>
                    setHealthInfo({ ...healthInfo, weight: e.target.value })
                  }
                  placeholder="65"
                />
              </div>
              <div>
                <Label>血型</Label>
                <Select
                  value={healthInfo.bloodType}
                  onValueChange={(value) =>
                    setHealthInfo({ ...healthInfo, bloodType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇血型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>過敏史</Label>
                <Input
                  placeholder="如花粉、藥物"
                  value={healthInfo.allergies}
                  onChange={(e) =>
                    setHealthInfo({ ...healthInfo, allergies: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>目前用藥</Label>
                <Input
                  placeholder="如高血壓藥"
                  value={healthInfo.medications}
                  onChange={(e) =>
                    setHealthInfo({ ...healthInfo, medications: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>重要病史</Label>
                <Input
                  placeholder="如糖尿病、心臟病"
                  value={healthInfo.medicalHistory}
                  onChange={(e) =>
                    setHealthInfo({ ...healthInfo, medicalHistory: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>家族病史</Label>
                <Input
                  placeholder="如糖尿病、心臟病"
                  value={healthInfo.familyHistory}
                  onChange={(e) =>
                    setHealthInfo({ ...healthInfo, familyHistory: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handlePrev} disabled={step === 2}>
              上一步
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button onClick={handleNext}>{step === 3 ? "完成" : "下一步"}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
