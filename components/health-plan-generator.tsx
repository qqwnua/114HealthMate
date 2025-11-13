"use client"

import { useState, useEffect } from "react"
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
  Loader2,
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

// --- 🔴 修正 #4: 新增輔助函式 (放在元件外部或內部皆可) ---

/**
 * 根據生日字串計算年齡
 * @param birthdate - 格式為 "YYYY-MM-DD" 的字串
 * @returns 實際年齡 (number) 或 null
 */
const calculateAge = (birthdate: string): number | null => {
  if (!birthdate) return null;
  try {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch (error) {
    console.error("Calculate age error:", error);
    return null;
  }
};

/**
 * 根據身高(cm)和體重(kg)計算 BMI
 * @param height - 身高 (string, 單位 cm)
 * @param weight - 體重 (string, 單位 kg)
 * @returns BMI (string, 小數點後一位) 或 "N/A"
 */
const calculateBMI = (height: string, weight: string): string => {
  const h = parseFloat(height);
  const w = parseFloat(weight);
  if (!h || !w || h <= 0 || w <= 0) return "N/A";
  try {
    const bmi = w / ((h / 100) * (h / 100));
    return bmi.toFixed(1);
  } catch (error) {
    return "N/A";
  }
};

// --- 主元件 ---
export function HealthPlanGenerator() {
  const [planGenerated, setPlanGenerated] = useState(false)
  const [userTextInput, setUserTextInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaveSuccessful, setIsSaveSuccessful] = useState(false)
  
  const [isDataLoading, setIsDataLoading] = useState(true); // 頁面資料載入中
  const [personalInfo, setPersonalInfo] = useState<any>({});
  const [healthInfo, setHealthInfo] = useState<any>({});

  const [generatedPlan, setGeneratedPlan] = useState<LLMResponse>({
    plan: [],
    schedule: [],
    disclaimer: "",
  })
  
  const [assistantDialogOpen, setAssistantDialogOpen] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading: isChatLoading } = useChat({
    api: "/api/health-assistant",
  })
  
  // --- 🔴 修正 #6: 新增 useEffect 抓取資料 ---
  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        console.warn("No userId found, cannot fetch data.");
        setIsDataLoading(false);
        toast({
          title: "錯誤",
          description: "無法獲取用戶 ID，請重新登入。",
          variant: "destructive",
        });
        return;
      }

      setIsDataLoading(true);
      try {
        // 1. 抓取個人資料 (包含 name, gender, birthdate)
        const personalRes = await fetch(`/api/personal_info?userId=${userId}`);
        if (!personalRes.ok) throw new Error("Failed to fetch personal info");
        const personalData = await personalRes.json();
        setPersonalInfo(personalData);

        // 2. 抓取健康資料 (包含 height, weight, medical_history, lifestyle...)
        const healthRes = await fetch(`/api/health_info?userId=${userId}`);
        if (!healthRes.ok) throw new Error("Failed to fetch health info");
        const healthData = await healthRes.json();
        setHealthInfo(healthData);

      } catch (error) {
        console.error("Failed to fetch user data:", error);
        toast({
          title: "資料載入失敗",
          description: "無法從資料庫取得您的個人與健康資料。",
          variant: "destructive",
        });
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, []); // 僅在組件掛載時執行一次

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

  // --- 生成計畫 ---
  const generateHealthPlan = async () => {
    setIsLoading(true);
    setPlanGenerated(false);
    setIsSaveSuccessful(false); 
    
    // --- 這是最關鍵的修改 ---
    // 1. 從 state 獲取計算值
    const age = calculateAge(personalInfo.birthdate);
    const bmi = calculateBMI(healthInfo.height, healthInfo.weight);

    // 2. 建立要傳送給 AI 的 healthDataPayload (取代 mockHealthData)
    //    我們把資料庫抓來的 (snake_case) 欄位，整合成 AI 易讀的格式
    const healthDataPayload = {
      personalInfo: {
        name: personalInfo.name || "用戶",
        age: age || null,
        gender: personalInfo.gender || "other", // 'male', 'female', 'other'
        height: parseFloat(healthInfo.height) || null,
        weight: parseFloat(healthInfo.weight) || null,
        bmi: parseFloat(bmi) || null,
      },
      healthMetrics: {
        // 依照你的要求，血壓血糖先給 null
        bloodPressure: { systolic: null, diastolic: null },
        bloodSugar: null,
        // (以下欄位 AI 可選用，但你的 DB 目前沒有)
        heartRate: null, 
        sleepHours: null,
        stepsPerDay: null,
        waterIntake: null,
      },
      // 🔴 重點：傳入 health_info 的資料
      lifestyle: {
        smokingStatus: healthInfo.smoking_status || "unknown",
        alcoholConsumption: healthInfo.alcohol_consumption || "unknown",
        exerciseFrequency: healthInfo.exercise_frequency || "unknown",
      },
      // 🔴 重點：傳入 health_info 的病史
      // (我們將 DB 的字串轉為陣列，AI 更易讀)
      healthHistory: healthInfo.medical_history ? [healthInfo.medical_history] : [],
      currentMedications: healthInfo.medications ? [healthInfo.medications] : [],
      allergies: healthInfo.allergies ? [healthInfo.allergies] : [],
      familyHistory: healthInfo.family_history ? [healthInfo.family_history] : [],
    };

    const userGoal = userTextInput;

    try {
      // [修改] 移除 mockApiCall，改用真實 fetch 呼叫
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          healthData: healthDataPayload,
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
            
            {/* 1. 健康數據概覽 (🔴 已修改 🔴) */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center">
                <UserCircle className="mr-2 h-4 w-4 text-teal-600" />
                {isDataLoading 
                  ? "正在載入您的健康數據..." 
                  : `${personalInfo.name || "您"} 的健康數據概覽`
                }
              </h3>

              {isDataLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="h-6 w-6 text-teal-600 animate-spin" />
                  <span className="ml-2 text-gray-500">載入中...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">年齡/性別</span>
                    <p className="font-medium">
                      {/* 🟢 修正：明確檢查 null，而不是用 || */}
                      {calculateAge(personalInfo.birthdate) !== null 
                        ? `${calculateAge(personalInfo.birthdate)}歲` 
                        : "N/A"} /{" "}
                      {personalInfo.gender === "female" ? "女性" 
                       : personalInfo.gender === "male" ? "男性" 
                       : "其他"}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">BMI</span>
                    <p className="font-medium">{calculateBMI(healthInfo.height, healthInfo.weight)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">血壓</span>
                    <p className="font-medium">N/A</p> {/* 依照要求顯示 null/N/A */}
                  </div>
                  <div>
                    <span className="text-gray-500">血糖</span>
                    <p className="font-medium">N/A</p> {/* 依照要求顯示 null/N/A */}
                  </div>
                </div>
              )}
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
                disabled={isDataLoading} // 🔴 載入資料時應禁止輸入
              />
              <p className="text-xs text-gray-500">
                AI 助理將參考您的健康數據 (含生活習慣、病史) 和此目標，生成個人化計畫。
              </p>
            </div>
            
            {/* 3. 生成按鈕 */}
            <div className="flex justify-end pt-6">
              <Button
                onClick={generateHealthPlan}
                disabled={!userTextInput || isLoading || isDataLoading} // 🔴 載入資料時應禁止
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
                  {personalInfo.name || "您"} 的個人化健康計畫
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