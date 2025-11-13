"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Target,
  TrendingUp,
  BarChart3,
  UserCircle,
  Activity,
  Brain,
  Send,
  Bot,
  User,
  Zap,
  CheckCircle2,
  Calendar,
} from "lucide-react"
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useChat } from "ai/react"

// --- TypeScript 類型定義 ---

interface HealthData {
  personalInfo: {
    name: string;
    age: number;
    gender: "female" | "male" | "other";
    height: number;
    weight: number;
    bmi: number;
  };
  healthMetrics: {
    bloodPressure: { systolic: number; diastolic: number };
    bloodSugar: number;
    heartRate: number;
    sleepHours: number;
    stepsPerDay: number;
    waterIntake: number;
  };
  healthHistory: string[];
  currentMedications: string[];
  activityLevel: "light" | "moderate" | "active";
}

interface ScheduleItem {
  time: string;
  task: string;
}

interface LLMResponse {
  plan: string[];
  schedule: ScheduleItem[];
  disclaimer: string;
}

// --- Mock Data ---

const mockHealthData: HealthData = {
  personalInfo: {
    name: "林先生",
    age: 35,
    gender: "female",
    height: 165,
    weight: 68,
    bmi: 25.0,
  },
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

const progressData = [
  { week: "第1週", weight: 68, target: 67.5, waterIntake: 85, exercise: 90, sleep: 75, bloodPressure: 125 },
  { week: "第2週", weight: 67.2, target: 67, waterIntake: 90, exercise: 85, sleep: 80, bloodPressure: 122 },
  { week: "第3週", weight: 66.8, target: 66.5, waterIntake: 95, exercise: 88, sleep: 85, bloodPressure: 120 },
  { week: "第4週", weight: 66.3, target: 66, waterIntake: 88, exercise: 92, sleep: 78, bloodPressure: 118 },
  { week: "第5週", weight: 65.9, target: 65.5, waterIntake: 92, exercise: 95, sleep: 82, bloodPressure: 115 },
]

// --- 模擬 AI 後端 API ---
const mockApiCall = (healthData: HealthData, userGoal: string): Promise<LLMResponse> => {
  console.log("正在將以下資料傳送至 AI API：", { healthData, userGoal })

  const mockLLMResponse: LLMResponse = {
    plan: [
      `**建立規律的飲食習慣**：由於您有高血壓和家族糖尿病史，均衡的飲食非常重要。建議您每天固定三餐，避免暴飲暴食，同時選擇低糖、低鹽、低脂的食物。`,
      `**增加體育活動**：規律的體育活動可以幫助您控制血壓和潛在的血糖風險。建議您每天至少进行 30 分鐘的中等強度體育活動，例如快走、騎自行車或游泳。`,
      `**監測健康狀況**：建議您定期監測您的血壓，同時記錄您的食物攝入和體育活動，以便更好地控制您的健康狀況。`,
      `**改善睡眠品質**：您的睡眠時間 (6.5小時) 略低於建議。嘗試建立固定的睡眠時間，睡前 1 小時放鬆，以改善睡眠。`,
    ],
    schedule: [
      { time: "07:00", task: "起床量測血壓" },
      { time: "07:10", task: "晨間運動 (快走)" },
      { time: "08:00", task: "健康早餐 (低鹽、全麥)" },
      { time: "12:30", task: "午餐 (多蔬菜)" },
      { time: "18:30", task: "晚餐 (輕食、低脂)" },
      { time: "20:00", task: "晚間伸展運動" },
      { time: "22:00", task: "準備就寢 (放下手機)" },
    ],
    disclaimer: "本健康計畫僅供參考，使用者應諮詢專業醫療人員以獲得個性化的健康建議和診斷。使用者應了解，任何健康計畫都應該根據個人的具體情況和健康狀況進行制定和調整。",
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockLLMResponse)
    }, 1500)
  })
}

// --- 主元件 ---
export function HealthPlanGenerator() {
  const [activeTab, setActiveTab] = useState("generator")
  const [planGenerated, setPlanGenerated] = useState(false)
  const [userTextInput, setUserTextInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [generatedPlan, setGeneratedPlan] = useState<LLMResponse>({
    plan: [],
    schedule: [],
    disclaimer: "",
  })
  
  const [assistantDialogOpen, setAssistantDialogOpen] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: "/api/health-assistant",
  })

  const registerReminders = (schedule: ScheduleItem[]) => {
    console.log("正在為以下排程註冊提醒：", schedule)
  }

  const generateHealthPlan = async () => {
    setIsLoading(true)
    setPlanGenerated(false) // 點擊生成時，先清除舊結果
    const healthData = mockHealthData
    const userGoal = userTextInput

    try {
      const parsedResult = await mockApiCall(healthData, userGoal)
      setGeneratedPlan(parsedResult)
      setPlanGenerated(true) // 標記為已生成
    } catch (error) {
      console.error("生成計畫失敗:", error)
    } finally {
      setIsLoading(false) // 無論成功失敗，都結束 loading
    }
  }

  // --- [已修改] 「計畫生成」介面 ---
  // 現在輸入框和結果會顯示在同一個頁面
  const renderHealthPlanGenerator = () => (
    <div className="space-y-6">
      {/* 區塊 1: 輸入卡片 (始終顯示) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5 text-teal-600" />
            智能健康計畫生成
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 1. 健康數據概覽 */}
          <div className="bg-teal-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3 flex items-center">
              <UserCircle className="mr-2 h-4 w-4 text-teal-600" />
              {mockHealthData.personalInfo.name} (您) 的健康數據概覽
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">年齡/性別</span>
                <p className="font-medium">
                  {mockHealthData.personalInfo.age}歲 /{" "}
                  {mockHealthData.personalInfo.gender === "female" ? "女性" : "男性"}
                </p>
              </div>
              <div>
                <span className="text-gray-500">BMI</span>
                <p className="font-medium">{mockHealthData.personalInfo.bmi}</p>
              </div>
              <div>
                <span className="text-gray-500">血壓</span>
                <p className="font-medium">
                  {mockHealthData.healthMetrics.bloodPressure.systolic}/
                  {mockHealthData.healthMetrics.bloodPressure.diastolic}
                </p>
              </div>
              <div>
                <span className="text-gray-500">血糖</span>
                <p className="font-medium">{mockHealthData.healthMetrics.bloodSugar} mg/dL</p>
              </div>
            </div>
          </div>

          {/* 2. 主要目標輸入 */}
          <div className="space-y-3">
            <Label htmlFor="userGoalInput" className="text-lg font-medium flex items-center">
              <Target className="mr-2 h-5 w-5 text-teal-600" />
              請輸入您的主要健康目標
            </Label>
            <Input
              id="userGoalInput"
              placeholder="例如：我想在3個月內減重5公斤、改善睡眠品質、並降低血壓"
              value={userTextInput}
              onChange={(e) => setUserTextInput(e.target.value)}
              className="text-base p-4"
            />
            <p className="text-xs text-gray-500">
              AI 助理將參考您的健康數據和此目標，生成個人化計畫。
            </p>
          </div>
          
          {/* 3. 生成按鈕 */}
          <div className="flex justify-end pt-6">
            <Button
              onClick={generateHealthPlan}
              disabled={!userTextInput || isLoading}
              className="bg-teal-600 hover:bg-teal-700 w-full md:w-auto"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-pulse" />
                  AI 正在為您生成計畫...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  生成個人化健康計畫
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 區塊 2: 生成中提示 (僅 isLoading 時顯示) */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="flex justify-center items-center text-teal-600">
              <Activity className="mr-2 h-5 w-5 animate-pulse" />
              <span className="text-lg font-medium">AI 正在為您生成計畫，請稍候...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 區塊 3: 結果卡片 (僅 planGenerated 且 !isLoading 時顯示) */}
      {/* 為了有淡入效果，您可以添加一個簡單的 CSS 動畫 (例如 animate-fadeIn) */}
      {planGenerated && !isLoading && (
        <div className="space-y-6">
          {/* 1. 計畫建議 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                {mockHealthData.personalInfo.name} 的個人化健康計畫
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">
                  您好！根據您的數據和目標，以下是 3-5 點具體建議：
                </h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {generatedPlan.plan.map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 2. 計畫排程建議 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-teal-600" />
                建議每日排程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {generatedPlan.schedule.map((task, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-sm text-teal-600">{task.time}</span>
                      <span className="font-medium">{task.task}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. 免責聲明 */}
          <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
            <strong>免責聲明：</strong>{generatedPlan.disclaimer}
          </div>
          
          {/* [已移除] 之前用於跳轉的按鈕已不再需要 */}
          {/* <div className="flex justify-center"> ... </div> */}
        </div>
      )}
    </div>
  )

  // --- 「計畫進度追蹤」介面 (保持不變，已簡化) ---
  const renderProgressTracking = () => (
    <div className="space-y-6">
      
      {/* 生理數據變化趨勢 (核心功能) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-teal-600" />
            生理數據變化趨勢
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weight">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="weight">體重變化</TabsTrigger>
              <TabsTrigger value="bloodPressure">血壓變化</TabsTrigger>
              <TabsTrigger value="habits">習慣養成</TabsTrigger>
              <TabsTrigger value="overall">綜合指標</TabsTrigger>
            </TabsList>

            <TabsContent value="weight">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[64, 69]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="weight" stroke="#ef4444" name="實際體重(kg)" strokeWidth={2} />
                    <Line type="monotone" dataKey="target" stroke="#0ea5e9" strokeDasharray="5 5" name="目標體重(kg)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>進度分析：</strong>您的體重減輕趨勢良好，已減重2.1公斤，達成階段目標的70%。
                </p>
              </div>
            </TabsContent>

            <TabsContent value="bloodPressure">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[110, 130]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bloodPressure"
                      stroke="#8b5cf6"
                      name="收縮壓(mmHg)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>進度分析：</strong>血壓呈現穩定下降趨勢，從125降至115 mmHg，改善效果顯著。
                </p>
              </div>
            </TabsContent>

            <TabsContent value="habits">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="waterIntake" stroke="#0ea5e9" name="喝水完成率%" />
                    <Line type="monotone" dataKey="exercise" stroke="#10b981" name="運動完成率%" />
                    <Line type="monotone" dataKey="sleep" stroke="#8b5cf6" name="睡眠完成率%" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-teal-50 rounded-lg">
                <p className="text-sm text-teal-700">
                  <strong>習慣分析：</strong>運動和喝水習慣養成良好，睡眠品質有待改善。
                </p>
              </div>
            </TabsContent>

            <TabsContent value="overall">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-teal-600">75%</div>
                  <p className="text-sm text-gray-500">整體計畫完成度</p>
                  <Progress value={75} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">85%</div>
                  <p className="text-sm text-gray-500">目標達成率</p>
                  <Progress value={85} className="mt-2" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">92%</div>
                  <p className="text-sm text-gray-500">健康改善指數</p>
                  <Progress value={92} className="mt-2" />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 智能助理按鈕 (保持不變) */}
      <div className="fixed bottom-6 right-6">
        <Dialog open={assistantDialogOpen} onOpenChange={setAssistantDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg bg-teal-600 hover:bg-teal-700">
              <Bot className="h-5 w-5 mr-2" />
              健康助理
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Brain className="mr-2 h-5 w-5 text-teal-600" />
                智能健康助理 - 動態計畫調整
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col h-[60vh]">
              <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-md">
                {messages.length === 0 && (
                  <div className="text-center p-4">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-teal-600" />
                    <h3 className="font-medium text-lg mb-2">您好！我是您的健康助理</h3>
                    <p className="text-gray-500 mb-4">
                      我可以根據您的執行成效、身體反應或突發狀況，動態調整您的健康計畫。
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        "我今天膝蓋疼痛，無法進行跑步運動",
                        "我的血壓下降很快，是否需要調整計畫？",
                        "我想增加運動強度，感覺目前太輕鬆",
                        "最近工作很忙，能否調整運動時間？",
                        "我的體重減輕速度比預期慢",
                        "感冒了，這幾天該如何調整計畫？",
                      ].map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start text-left h-auto py-2 text-sm"
                          onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === "assistant" && <Bot className="h-4 w-4 mt-1 text-teal-600" />}
                        {message.role === "user" && <User className="h-4 w-4 mt-1" />}
                        <span className="text-sm">{message.content}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4 text-teal-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="flex space-x-2 mt-4">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="描述您的執行狀況、身體反應或需要調整的地方..."
                  className="flex-1"
                />
                <Button type="submit" disabled={isChatLoading || !input}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

  // --- 主佈局 (保持不變) ---
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">健康計畫管理系統</CardTitle>
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

        <TabsContent value="generator">{renderHealthPlanGenerator()}</TabsContent>

        <TabsContent value="tracking">{renderProgressTracking()}</TabsContent>
      </Tabs>
    </div>
  )
}