"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Target,
  UserCircle,
  Activity,
  Zap,
  CheckCircle2,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

// --- TypeScript 類型定義 ---

interface ScheduleItem {
  time: string;
  task: string;
}

interface LLMResponse {
  plan: string[];
  schedule: ScheduleItem[];
  disclaimer: string;
}

// [新增] 用於儲存最新量測數據的介面
interface LatestMetrics {
  systolic_bp: number | null;
  diastolic_bp: number | null;
  blood_sugar: number | null;
}

// --- 輔助函式 ---

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
  
  const [isDataLoading, setIsDataLoading] = useState(true); 
  const [personalInfo, setPersonalInfo] = useState<any>({});
  const [healthInfo, setHealthInfo] = useState<any>({});
  
  // [新增] 儲存最新的血壓血糖數據 state
  const [latestMetrics, setLatestMetrics] = useState<LatestMetrics>({
    systolic_bp: null,
    diastolic_bp: null,
    blood_sugar: null
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveSuccessful, setIsSaveSuccessful] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

  const [generatedPlan, setGeneratedPlan] = useState<LLMResponse>({
    plan: [],
    schedule: [],
    disclaimer: "",
  })
  
  // --- useEffect 抓取資料 ---
  useEffect(() => {
    const fetchData = async () => {
      const id = localStorage.getItem("userId");
      setUserId(id);
      
      if (!id) {
        setIsDataLoading(false);
        return; 
      }

      setIsDataLoading(true);
      try {
        // 1. 抓取個人資料
        const personalRes = await fetch(`/api/personal_info?userId=${id}`);
        const personalData = personalRes.ok ? await personalRes.json() : {};
        setPersonalInfo(personalData);

        // 2. 抓取基本健康資料 (身高體重等)
        const healthRes = await fetch(`/api/health_info?userId=${id}`);
        const healthData = healthRes.ok ? await healthRes.json() : {};
        setHealthInfo(healthData);

        // 3. [新增] 抓取最新的量測數據 (血壓、血糖)
        // 使用剛建立的 API
        const metricRes = await fetch(`/api/latest-health-metric?userId=${id}`);
        if (metricRes.ok) {
          const metrics = await metricRes.json();
          setLatestMetrics({
            systolic_bp: metrics.systolic_bp,
            diastolic_bp: metrics.diastolic_bp,
            blood_sugar: metrics.blood_sugar
          });
        }

      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 未登入狀態檢查 ---
  if (userId === null && !isDataLoading) {
    return (
      <div className="p-8 text-center max-w-3xl mx-auto border rounded-lg shadow-lg bg-white mt-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900">請先登入</h3>
        <p className="text-gray-500 mt-2">
          此功能需要您的個人健康數據才能生成專屬計畫。
        </p>
        <Button className="mt-6 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.href = '/login'}>
          前往登入
        </Button>
      </div>
    );
  }

  // --- 儲存排程 (保持不變) ---
  const handleSavePlanToDatabase = async () => {
    if (!generatedPlan.schedule || generatedPlan.schedule.length === 0) return;
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsSaving(true);
    setIsSaveSuccessful(false);

    try {
      const response = await fetch('/api/save-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId, 10),
          userGoal: userTextInput,
          generatedPlan: generatedPlan,
        }),
      });

      if (!response.ok) throw new Error('儲存計畫失敗');

      toast({
        title: "儲存成功！",
        description: `排程已加入您的提醒列表。`,
      });
      setIsSaveSuccessful(true);
      setTimeout(() => setIsSaveSuccessful(false), 3000);
    } catch (error) {
      toast({ title: "儲存失敗", description: "無法連線至伺服器。", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const formatPlanText = (text: string) => {
    if (!text) return "";
    // 使用正則表達式將 **內容** 替換為 <strong>內容</strong>
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-teal-700">$1</strong>');
  };

  // --- 生成計畫 ---
  const generateHealthPlan = async () => {
    setIsLoading(true);
    setPlanGenerated(false);
    setIsSaveSuccessful(false); 
    
    const age = calculateAge(personalInfo.birthdate);
    const bmi = calculateBMI(healthInfo.height, healthInfo.weight);

    // [修改] 將真實抓取到的數據放入 Payload 傳給 AI
    const healthDataPayload = {
      personalInfo: {
        name: personalInfo.name || "用戶",
        age: age || null,
        gender: personalInfo.gender || "other",
        height: parseFloat(healthInfo.height) || null,
        weight: parseFloat(healthInfo.weight) || null,
        bmi: parseFloat(bmi) || null,
      },
      healthMetrics: {
        // 使用從 health_records 抓取的最新數據
        bloodPressure: { 
          systolic: latestMetrics.systolic_bp, 
          diastolic: latestMetrics.diastolic_bp 
        },
        bloodSugar: latestMetrics.blood_sugar,
        
        // 這些欄位目前資料庫沒有直接對應，暫時維持 null
        heartRate: null, 
        sleepHours: null,
        stepsPerDay: null,
        waterIntake: null,
      },
      lifestyle: {
        smokingStatus: healthInfo.smoking_status || "unknown",
        alcoholConsumption: healthInfo.alcohol_consumption || "unknown",
        exerciseFrequency: healthInfo.exercise_frequency || "unknown",
      },
      healthHistory: healthInfo.medical_history ? [healthInfo.medical_history] : [],
      currentMedications: healthInfo.medications ? [healthInfo.medications] : [],
      allergies: healthInfo.allergies ? [healthInfo.allergies] : [],
      familyHistory: healthInfo.family_history ? [healthInfo.family_history] : [],
    };

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          healthData: healthDataPayload,
          userGoal: userTextInput,
        }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const parsedResult: LLMResponse = await response.json();
      setGeneratedPlan(parsedResult);
      setPlanGenerated(true);

    } catch (error) {
      console.error("生成計畫失敗:", error);
      toast({ title: "生成失敗", description: "請稍後再試。", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  // --- 主佈局 ---
  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">生成健康計畫</CardTitle>
      </CardHeader>

      <div className="space-y-6">
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
                  {/* [修改] 顯示真實血壓 */}
                  <div>
                    <span className="text-gray-500">血壓 (mmHg)</span>
                    <p className="font-medium">
                      {latestMetrics.systolic_bp && latestMetrics.diastolic_bp
                        ? `${latestMetrics.systolic_bp}/${latestMetrics.diastolic_bp}`
                        : "N/A"}
                    </p>
                  </div>
                  {/* [修改] 顯示真實血糖 */}
                  <div>
                    <span className="text-gray-500">血糖 (mg/dL)</span>
                    <p className="font-medium">
                      {latestMetrics.blood_sugar
                        ? `${latestMetrics.blood_sugar}`
                        : "N/A"}
                    </p>
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
                placeholder="例如：我想在3個月內減重5公斤、改善睡眠品質..."
                value={userTextInput}
                onChange={(e) => setUserTextInput(e.target.value)}
                className="text-base p-4"
                disabled={isLoading}
              />
            </div>
            
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

        {planGenerated && !isLoading && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                  {personalInfo.name || "您"} 的個人化健康計畫
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">建議計畫：</h3>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    {generatedPlan.plan.map((item, index) => (
                      <li 
                        key={index} 
                        // 這裡呼叫上面修改後的 formatPlanText
                        // 結果範例： <strong>建立正規睡眠習慣</strong>：每晚維持...
                        dangerouslySetInnerHTML={{ __html: formatPlanText(item) }} 
                      />
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

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
              <CardFooter className="flex justify-end items-center pt-4 space-x-3">
                {isSaveSuccessful && (
                  <span className="text-sm text-green-600 font-medium">已儲存</span>
                )}
                <Button onClick={handleSavePlanToDatabase} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? "儲存中..." : "儲存排程至提醒列表"}
                </Button>
              </CardFooter>
            </Card>

            <div className="text-xs text-gray-500 p-4 bg-gray-50 rounded-lg">
              <strong>免責聲明：</strong>{generatedPlan.disclaimer}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}