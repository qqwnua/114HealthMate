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
import { Switch } from "@/components/ui/switch"

type PersonalInfo = {
  name: string
  gender: string
  birthdate: string
  address: string
  avatar: string | null
}

type HealthInfo = {
  bloodType: string
  chronicDiseases: string[]
  allergies: string[]
  medications: string
  familyHistory: string[]
  height: string
  weight: string
}

type Preferences = {
  notifications: boolean
  notifyMethods: string[]
  language: string
  consentAI: boolean
}

export default function RegisterStep() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId") // 從 URL 拿 userId

  const [step, setStep] = useState(2)

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    name: "",
    gender: "",
    birthdate: "",
    address: "",
    avatar: null,
  })

  const [healthInfo, setHealthInfo] = useState<HealthInfo>({
    bloodType: "",
    chronicDiseases: [],
    allergies: [],
    medications: "",
    familyHistory: [],
    height: "",
    weight: "",
  })

  const [preferences, setPreferences] = useState<Preferences>({
    notifications: true,
    notifyMethods: ["App"],
    language: "zh",
    consentAI: true,
  })

  const handleNext = async () => {
    if (!userId) {
      alert("找不到使用者 ID")
      return
    }

    try {
      if (step === 2) {
        // 將空字串轉 null，避免 DATE 欄位錯誤
        const payload = {
          ...personalInfo,
          userId,
          birthdate: personalInfo.birthdate || null,
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

      if (step === 4) {
        const res = await fetch("/api/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...preferences, userId }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
      }

      if (step < 4) setStep(step + 1)
      else router.push("/") // 完成導向主畫面
    } catch (err: any) {
      alert("儲存失敗：" + err.message)
    }
  }

  const handlePrev = () => {
    if (step > 2) setStep(step - 1)
  }

  const handleSkip = () => {
    handleNext()
  }

  const progressText = [
    "Step 2：基本資料",
    "Step 3：健康資料",
    "Step 4：偏好與安全設定",
  ]

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
                  value={personalInfo.birthdate}
                  onChange={(e) =>
                    setPersonalInfo({ ...personalInfo, birthdate: e.target.value })
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
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>慢性疾病（多選）</Label>
                <Input
                  placeholder="如高血壓, 糖尿病"
                  value={healthInfo.chronicDiseases.join(", ")}
                  onChange={(e) =>
                    setHealthInfo({
                      ...healthInfo,
                      chronicDiseases: e.target.value
                        .split(",")
                        .map((s) => s.trim()),
                    })
                  }
                />
              </div>
              <div>
                <Label>過敏史</Label>
                <Input
                  placeholder="如花粉、藥物"
                  value={healthInfo.allergies.join(", ")}
                  onChange={(e) =>
                    setHealthInfo({
                      ...healthInfo,
                      allergies: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>
              <div>
                <Label>服用藥物</Label>
                <Input
                  placeholder="如高血壓藥"
                  value={healthInfo.medications}
                  onChange={(e) =>
                    setHealthInfo({ ...healthInfo, medications: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>健康提醒通知</Label>
                <Switch
                  checked={preferences.notifications}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, notifications: checked })
                  }
                />
              </div>
              <div>
                <Label>偏好語言</Label>
                <Select
                  value={preferences.language}
                  onValueChange={(value) =>
                    setPreferences({ ...preferences, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇語言" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>同意 AI 使用健康資料</Label>
                <Switch
                  checked={preferences.consentAI}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, consentAI: checked })
                  }
                />
              </div>
            </div>
          )}

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handlePrev} disabled={step === 2}>
              上一步
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSkip}>
                略過
              </Button>
              <Button onClick={handleNext}>{step === 4 ? "完成" : "下一步"}</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
