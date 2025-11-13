"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card" // [新增] 引入 CardFooter
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Progress } from "@/components/ui/progress" // 已移除
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // 已移除
import { Badge } from "@/components/ui/badge"
import {
  // [新增] 引入 Save
  Target,
  UserCircle,
  Activity,
  Brain,
  Send,
  Bot,
  User,
  Zap,
  CheckCircle2,
  Calendar,
  Save,
} from "lucide-react"
// import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from "recharts" // 已移除
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useChat } from "ai/react"
import { toast } from "@/hooks/use-toast" // [新增] 引入 toast

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


// --- 主元件 ---
export function HealthPlanGenerator() {
  const [planGenerated, setPlanGenerated] = useState(false)
  const [userTextInput, setUserTextInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaveSuccessful, setIsSaveSuccessful] = useState(false)
  
  const [generatedPlan, setGeneratedPlan] = useState<LLMResponse>({
    plan: [],
    schedule: [],
    disclaimer: "",
  })
  
  const [assistantDialogOpen, setAssistantDialogOpen] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: "/api/health-assistant",
  })

  // --- [已修改] 儲存排程至 localStorage ---
  const registerReminders = () => {
    if (!generatedPlan.schedule || generatedPlan.schedule.length === 0) {
      toast({
        title: "沒有排程可儲存",
        description: "AI 尚未生成任何排程。",
        variant: "destructive",
      })
      return;
    }

    // 1. 將 AI 排程 (ScheduleItem) 轉換為 提醒器 (Reminder) 格式
    // 這是 health-plan-reminder.tsx 所需的格式
    const newReminders = generatedPlan.schedule.map((item, index) => ({
      id: Date.now() + index, // 產生唯一的 ID
      title: item.task, // AI 的任務名稱
      description: "", // AI 未提供，讓使用者自行編輯
      time: item.time, // AI 提供的時間
      type: "general", // 給一個預設類型
      completed: false, // 預設為未完成
      color: "teal", // 預設顏色
      notificationEnabled: true, // 預設開啟通知
      snoozed: false, // 預設未延遲
    }));

    // 2. 將轉換後的陣列存入 localStorage
    try {
      localStorage.setItem('healthReminders', JSON.stringify(newReminders));
      
      // 3. 提供成功反饋
      toast({
        title: "儲存成功！",
        description: `已將 ${newReminders.length} 個排程項目儲存至您的「健康計畫提醒」列表。`,
      });

      // 1. 設定為儲存成功
      setIsSaveSuccessful(true); 

      // 2. 3秒後自動清除「已儲存」字樣
      setTimeout(() => {
        setIsSaveSuccessful(false);
      }, 3000);

    } catch (error) {
      console.error("Failed to save reminders to localStorage", error);
      toast({
        title: "儲存失敗",
        description: "無法將排程儲存至提醒列表，請稍後再試。",
        variant: "destructive",
      });
    }
  }

  // --- [保持不變] 生成計畫 ---
  const generateHealthPlan = async () => {
    setIsLoading(true);
    setPlanGenerated(false);
    setIsSaveSuccessful(false); // 重設儲存狀態
    
    const healthData = mockHealthData; // 實務上這會從資料庫拉取
    const userGoal = userTextInput;

    try {
      // [修改] 移除 mockApiCall，改用真實 fetch 呼叫
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          healthData: healthData,
          userGoal: userGoal,
        }),
      });

      if (!response.ok) {
        // 如果 API 回傳錯誤 (例如 500)
        const errorData = await response.json();
        console.error("API Error:", errorData.details || errorData.error);
        toast({
          title: "生成失敗",
          description: `後端 API 發生錯誤: ${errorData.error}`,
          variant: "destructive",
        });
        throw new Error(`API error: ${errorData.error}`);
      }

      // [修改] 取得 API 回傳的 JSON
      const parsedResult: LLMResponse = await response.json();

      // 檢查回傳的 JSON 結構是否完整
      if (!parsedResult.plan || !parsedResult.schedule) {
        console.error("API Error: Invalid JSON structure received", parsedResult);
        toast({
          title: "生成失敗",
          description: "AI 回傳的資料格式不正確。",
          variant: "destructive",
        });
        throw new Error("Invalid JSON structure received from API");
      }

      setGeneratedPlan(parsedResult);
      setPlanGenerated(true);

    } catch (error) {
      console.error("生成計畫失敗:", error);
      // 這裡的 toast 會捕捉 fetch 網路錯誤或 JSON 解析錯誤
      if (!(error instanceof Error && error.message.includes("API error"))) {
        toast({
          title: "生成失敗",
          description: "無法連線至 API 路由，請檢查網路或後端服務。",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  // --- 主佈局 (已簡化) ---
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">生成健康計畫</CardTitle>
      </CardHeader>

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

        {/* 區塊 2: 生成中提示 */}
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

        {/* 區塊 3: 結果卡片 */}
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
              {/* --- [新增] 儲存按鈕 --- */}
              <CardFooter className="flex justify-end items-center pt-4 space-x-3">
                {isSaveSuccessful && (
                  <span className="text-sm text-green-600 font-medium">
                    已儲存
                  </span>
                )}

                <Button onClick={registerReminders}>
                  <Save className="mr-2 h-4 w-4" />
                  儲存排程至提醒列表
                </Button>
              </CardFooter>
            </Card>

            {/* 3. 免責聲明 */}
            <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
              <strong>免責聲明：</strong>{generatedPlan.disclaimer}
            </div>
          </div>
        )}
      </div>

      {/* 智能助理按鈕 (已保留) */}
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
}