"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  Clock,
  TrendingUp,
  BarChart3,
  ListTodo,
  UserCircle,
  Activity,
  Droplets,
  Utensils,
  Moon,
  Dumbbell,
  Bot,
  User,
  Bell,
  Zap,
  CheckCircle2,
  Calendar,
  Timer,
} from "lucide-react"
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useChat } from "ai/react"
import { Switch } from "@/components/ui/switch"

/**
 * health-plan-generator-ai.tsx
 *
 * 這個檔案示範如何把原本的「前端硬編碼計畫產生邏輯」改成
 * 「呼叫 AI 生成 JSON 計畫 -> 前端負責渲染」的做法。
 *
 * 要點：
 * - 保留原本 UI 風格（Card、Badge、Progress、圖表等）
 * - 使用者輸入目標（簡短文字），系統會從後端抓取使用者健康資料
 * - 呼叫 /api/ai/generate-plan（後端負責呼叫 GPT / LLaMA）
 * - 後端回傳結構化 JSON (或包含 JSON 的文字)，前端嘗試解析並安全顯示
 *
 * 注意：後端 API 路徑 `/api/user/health` 與 `/api/ai/generate-plan` 為範例，請依專案實際端點調整。
 */

type HealthData = any // 依實際 schema 調整

type AiPlan = {
  summary?: string
  recommendations?: string[]
  schedule?: Array<{ time: string; task: string; type?: string; duration?: string }>
  reminders?: Array<{ time: string; message: string; type?: string }>
  tracking?: string[]
  raw?: any
}

export default function HealthPlanGeneratorAI() {
  const [userHealth, setUserHealth] = useState<HealthData | null>(null)
  const [userGoalInput, setUserGoalInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<AiPlan | null>(null)
  const [activeTab, setActiveTab] = useState("generator")
  const [assistantDialogOpen, setAssistantDialogOpen] = useState(false)

  // 內建 mock: 如果後端不可用，會使用此假資料渲染 UI
  const mockHealthData: HealthData = {
    personalInfo: { age: 35, gender: "female", height: 165, weight: 68, bmi: 25.0 },
    healthMetrics: {
      bloodPressure: { systolic: 125, diastolic: 82 },
      bloodSugar: 95,
      heartRate: 72,
      sleepHours: 6.5,
      stepsPerDay: 6500,
      waterIntake: 1800,
    },
    healthHistory: ["高血壓", "家族糖尿病史"],
    currentMedications: ["降血壓藥物"],
    activityLevel: "light",
  }

  useEffect(() => {
    // 嘗試從後端抓使用者健康資料；若失敗使用 mock
    fetch("/api/user/health")
      .then((r) => {
        if (!r.ok) throw new Error("no health api")
        return r.json()
      })
      .then((data) => setUserHealth(data))
      .catch(() => setUserHealth(mockHealthData))
  }, [])

  // 嘗試從 AI 回傳中安全解析 JSON
  function safeParseAIResponse(text: string): AiPlan | null {
    // 1) 直接 parse
    try {
      const parsed = JSON.parse(text)
      return { ...parsed, raw: parsed }
    } catch (e) {
      // 2) 嘗試從文字中抽出第一個 JSON 區塊
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed2 = JSON.parse(jsonMatch[0])
          return { ...parsed2, raw: parsed2 }
        } catch (e2) {
          // ignore
        }
      }
    }

    return null
  }

  async function handleGeneratePlan() {
    if (!userGoalInput.trim()) return
    setIsGenerating(true)
    setGeneratedPlan(null)

    // 構建要送給後端的 payload
    const payload = {
      goal: userGoalInput,
      healthData: userHealth,
      // 你可以在這裡加入更多選項，例如語言、計畫周數、是否包含用藥建議等
      options: { durationWeeks: 12, includeReminders: true },
    }

    try {
      const res = await fetch("/api/ai/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        // 後端可能直接把模型的原始回覆放在 body
        const plan = safeParseAIResponse(text)
        if (plan) setGeneratedPlan(plan)
        else throw new Error("AI 生成失敗: " + text)
      } else {
        const data = await res.json()
        // 後端若已回傳結構化 JSON，直接使用
        if (data && (data.recommendations || data.schedule || data.reminders || data.summary)) {
          setGeneratedPlan({ ...data, raw: data })
        } else if (typeof data === "string") {
          // 有些情況後端直接回傳文字（含 JSON 區塊）
          const plan = safeParseAIResponse(data)
          if (plan) setGeneratedPlan(plan)
          else setGeneratedPlan({ summary: data, raw: data })
        } else {
          // 嘗試把整個 response 序列化成 AiPlan
          setGeneratedPlan({ summary: JSON.stringify(data), raw: data })
        }
      }

      setActiveTab("tracking")
    } catch (err: any) {
      console.error(err)
      alert("生成失敗: " + (err.message || err))
    } finally {
      setIsGenerating(false)
    }
  }

  // UI helper: 安全取值
  const gp = (k: keyof AiPlan, fallback: any = []) => (generatedPlan && (generatedPlan as any)[k] ? (generatedPlan as any)[k] : fallback)

  // Recharts demo data: 若後端無 weeklyProgress，可從 userHealth 或 generatedPlan.raw 補值
  const demoProgress = [
    { week: "第1週", weight: 68, bloodPressure: 125, waterIntake: 85, exercise: 80, sleep: 70 },
    { week: "第2週", weight: 67.3, bloodPressure: 122, waterIntake: 88, exercise: 82, sleep: 74 },
    { week: "第3週", weight: 66.9, bloodPressure: 120, waterIntake: 90, exercise: 85, sleep: 76 },
    { week: "第4週", weight: 66.5, bloodPressure: 118, waterIntake: 92, exercise: 88, sleep: 78 },
  ]

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">健康計畫管理系統（AI 生成版）</CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="generator" className="flex items-center">
            <Zap className="mr-2 h-4 w-4" />
            智能健康計畫生成
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center">
            <BarChart3 className="mr-2 h-4 w-4" />
            計畫進度追蹤
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-teal-600" />
                  一鍵生成個人化健康計畫
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="bg-teal-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-3 flex items-center">
                        <UserCircle className="mr-2 h-4 w-4 text-teal-600" /> 您的健康數據概覽
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">年齡/性別</span>
                          <p className="font-medium">{userHealth?.personalInfo?.age ?? "--"}歲 / {userHealth?.personalInfo?.gender === "female" ? "女性" : userHealth?.personalInfo?.gender ?? "--"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">BMI</span>
                          <p className="font-medium">{userHealth?.personalInfo?.bmi ?? "--"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">血壓</span>
                          <p className="font-medium">{userHealth?.healthMetrics?.bloodPressure?.systolic ?? "--"}/{userHealth?.healthMetrics?.bloodPressure?.diastolic ?? "--"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">血糖</span>
                          <p className="font-medium">{userHealth?.healthMetrics?.bloodSugar ?? "--"} mg/dL</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>輸入您的健康目標（簡短敘述）</Label>
                      <textarea
                        value={userGoalInput}
                        onChange={(e) => setUserGoalInput(e.target.value)}
                        placeholder="例如：控制血糖、12 週內減重 6 公斤、改善睡眠"
                        className="w-full border rounded p-3 resize-none h-28"
                      />

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500">AI 會根據您的健康資料與目標產出完整的計畫（含排程、提醒與追蹤項目）</div>
                        <div className="space-x-2">
                          <Button onClick={() => { setUserGoalInput(""); setGeneratedPlan(null); }} variant="ghost">清除</Button>
                          <Button onClick={handleGeneratePlan} disabled={isGenerating || !userGoalInput.trim()} className="bg-teal-600 hover:bg-teal-700">
                            {isGenerating ? "生成中..." : (
                              <>
                                <Zap className="mr-2 h-4 w-4 inline" /> 生成個人化健康計畫
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-1 space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center text-sm">
                          <Bell className="mr-2 h-4 w-4 text-teal-600" /> 常見提醒選項
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>喝水提醒</span>
                            <Badge variant="outline">建議</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>運動提醒</span>
                            <Badge variant="outline">建議</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>用藥提醒</span>
                            <Badge variant="outline">可選</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>睡前放鬆提醒</span>
                            <Badge variant="outline">可選</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">範例快速指令</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          {["我要控制血糖並減重","12 週內減重 6KG","改善睡眠並提升體能"].map((s) => (
                            <Button key={s} variant="outline" className="text-left text-sm" onClick={() => setUserGoalInput(s)}>{s}</Button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 顯示 AI 生成後的結果預覽（若有） */}
            {generatedPlan && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center"><CheckCircle2 className="mr-2 h-5 w-5 text-green-600" /> 計畫生成結果</span>
                    <Badge className="bg-teal-100 text-teal-800">AI 提案</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-700">{generatedPlan.summary}</div>

                    <div>
                      <h4 className="font-medium">具體建議</h4>
                      <ul className="list-disc pl-5 text-sm">
                        {gp("recommendations", []).map((r: string, i: number) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-medium">今日排程範例</h4>
                      <div className="grid gap-2">
                        {gp("schedule", []).map((item: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 border rounded bg-gray-50">
                            <div className="flex items-center space-x-3"><span className="font-mono">{item.time}</span><span>{item.task}</span></div>
                            <Badge variant="outline">{item.duration ?? item.type ?? ""}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium">提醒</h4>
                      <div className="grid gap-2">
                        {gp("reminders", []).map((r: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                            <div className="flex items-center space-x-2"><Timer className="h-4 w-4 text-gray-400" /><span className="font-mono">{r.time}</span><span>{r.message}</span></div>
                            <Badge variant="outline" className="text-xs">{r.type ?? "提醒"}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium">建議追蹤項目</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {gp("tracking", ["體重","血壓"]).map((t: string, i: number) => (
                          <Badge key={i}>{t}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={() => { /* TODO: persist plan to backend */ alert('已儲存（範例）') }} className="bg-teal-600 hover:bg-teal-700">儲存計畫</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tracking">{/* 保留舊版風格的追蹤頁面 */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-teal-600" /> 執行進度概覽</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium">階段完成狀況</h4>
                      <div className="space-y-3">
                        {/* 這裡可以放入由後端取得的 stageProgress */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3"><span className="font-medium">第一階段</span><Badge className="bg-green-100 text-green-800">已完成</Badge></div>
                          <span className="text-sm text-gray-500">100%</span>
                        </div>
                        <Progress value={100} className="h-3" />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium">今日任務狀態</h4>
                      {[{ task: "喝水", completed: 6, target: 8, unit: "杯" }, { task: "有氧運動", completed: 20, target: 30, unit: "分鐘" }].map((task, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center"><span className="font-medium text-sm">{task.task}</span><span className="text-xs text-gray-500">{task.completed}/{task.target} {task.unit}</span></div>
                          <Progress value={(task.completed / task.target) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center"><ListTodo className="mr-2 h-5 w-5 text-teal-600" /> 生理數據概覽</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={demoProgress}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="weight" name="體重(kg)" stroke="#ef4444" strokeWidth={2} />
                          <Line type="monotone" dataKey="bloodPressure" name="收縮壓(mmHg)" stroke="#8b5cf6" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h4 className="font-medium">習慣追蹤</h4>
                      <div className="mt-2 space-y-2 text-sm text-gray-600">運動與喝水習慣穩定，睡眠仍有改善空間。</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 智能助理 (保留簡化版) */}
            <div className="fixed bottom-6 right-6">
              <Dialog open={assistantDialogOpen} onOpenChange={setAssistantDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="rounded-full shadow-lg bg-teal-600 hover:bg-teal-700"><Bot className="h-5 w-5 mr-2" /> 健康助理</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center"><Bot className="mr-2 h-5 w-5 text-teal-600" /> 智能健康助理</DialogTitle>
                  </DialogHeader>
                  <div className="p-4">此處保留原本助理的對話功能（與 /api/health-assistant 串接）</div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
