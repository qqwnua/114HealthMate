"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Loader2, Zap, Info, ShieldCheck, Activity, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"

// --- TypeScript 定義 ---

interface HealthRecord {
  id?: number;
  date: string;     
  rawDate?: string; 
  systolic?: number;
  diastolic?: number;
  bloodSugar?: number;
  bloodSugarType?: 'fasting' | 'postprandial';
  totalCholesterol?: number;
  hdl?: number;
  ldl?: number;
  triglycerides?: number;
  weight?: number;
  [key: string]: any;
}

interface AIAnalysisResult {
  riskLevel: string; 
  summary: string; 
  metabolicRisk: { status: boolean; detail: string }; 
  framinghamRisk: { percentage: string; level: string }; 
  strokeRisk: { level: string; detail: string }; 
  diabetesRisk: { level: string; detail: string }; 
  hypertensionRisk: { level: string; detail: string }; 
  trendAnalysis: string; 
  suggestions: string[]; 
}

const defaultAnalysis: AIAnalysisResult = {
  riskLevel: "low",
  summary: "尚無數據",
  metabolicRisk: { status: false, detail: "資料不足" },
  framinghamRisk: { percentage: "--", level: "未評估" },
  strokeRisk: { level: "未評估", detail: "--" },
  diabetesRisk: { level: "未評估", detail: "--" },
  hypertensionRisk: { level: "未評估", detail: "--" },
  trendAnalysis: "資料不足，無法分析趨勢。",
  suggestions: ["請開始記錄您的第一筆健康數據。"]
}

export function HealthManagement() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [historyData, setHistoryData] = useState<HealthRecord[]>([])
  const [latestAnalysis, setLatestAnalysis] = useState<AIAnalysisResult>(defaultAnalysis)
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const [personalInfo, setPersonalInfo] = useState<any>({})

  const [userId, setUserId] = useState<string | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  const todayStr = new Date().toISOString().split('T')[0];

  // 表單狀態
  const [bpForm, setBpForm] = useState({ systolic: "", diastolic: "", date: todayStr })
  const [sugarForm, setSugarForm] = useState({ value: "", type: "fasting", date: todayStr })
  const [lipidForm, setLipidForm] = useState({ total: "", hdl: "", ldl: "", tri: "", date: todayStr })
  const [weightForm, setWeightForm] = useState({ value: "", date: todayStr })

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return 40; 
    const today = new Date();
    const birth = new Date(birthdate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const triggerAIAnalysis = async (records: HealthRecord[], profile: any) => {
    setIsAnalyzing(true);
    try {
        const response = await fetch('/api/health-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                records: records.slice(-7), 
                profile: {
                    age: calculateAge(profile.birthdate), // 這裡用到 calculateAge
                    gender: profile.gender,
                    smoking: profile.smoking_status,
                    alcohol: profile.alcohol_consumption,
                    exercise: profile.exercise_frequency,
                    medicalHistory: profile.medical_history,
                    medications: profile.medications
                }
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log("前端收到的分析結果:", result);
            setLatestAnalysis(result);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  };

  const fetchDataAndAnalyze = async () => {
    setIsDataLoading(true);

    const id = localStorage.getItem("userId");
    setUserId(id);

    if (!id) {
      setHistoryData([]); 
      setLatestAnalysis(defaultAnalysis);
      setIsDataLoading(false);
      return;
    }

    try {
      // 修正：同時抓取三支 API (包含 health_info)
      const [personalRes, healthInfoRes, recordsRes] = await Promise.all([
        fetch(`/api/personal_info?userId=${id}`),
        fetch(`/api/health_info?userId=${id}`), // <--- 確保這行有加上
        fetch(`/api/health_records?userId=${id}&limit=30`)
      ]);

      // 合併資料邏輯
      let fullProfile = {};
      
      if (personalRes.ok) {
          const pData = await personalRes.json();
          fullProfile = { ...fullProfile, ...pData };
      }

      if (healthInfoRes.ok) {
          const hData = await healthInfoRes.json();
          fullProfile = { ...fullProfile, ...hData };
      }

      setPersonalInfo(fullProfile);

      if (recordsRes.ok) {
        const records = await recordsRes.json();
        
        records.sort((a: any, b: any) => {
           const dateA = a.rawDate ? new Date(a.rawDate).getTime() : 0;
           const dateB = b.rawDate ? new Date(b.rawDate).getTime() : 0;
           return dateA - dateB;
        });

        if (records.length > 0) {
          setHistoryData(records);
          // 這裡呼叫 triggerAIAnalysis 就不會報錯了，因為它已經在上面定義過了
          triggerAIAnalysis(records, fullProfile);
        } else {
          setHistoryData([]);
          setLatestAnalysis(defaultAnalysis);
        }
      } else {
        setHistoryData([]);
        setLatestAnalysis(defaultAnalysis);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchDataAndAnalyze();
  }, []);

  
  const handleSaveData = async (type: string, data: any) => {
    // [修改] 直接使用 state 中的 userId
    if (!userId) {
        toast({ title: "儲存失敗", description: "無法獲取使用者 ID，請先登入。", variant: "destructive" });
        return;
    }

    const { date, ...healthData } = data;
    
    // 1. 初始化最終的 Payload
    let finalPayload: any = { userId, recordDate: date };

    // 2. 根據數據類型 (type) 進行型別轉換與鍵名映射
    if (type === "weight" && healthData.value) {
        // 體重：將 value 轉換為 number (包含小數)，並使用 weight 鍵
        finalPayload.weight = parseFloat(healthData.value); 
    } else if (type === "bloodSugar" && healthData.value) {
        // 血糖：將 value 轉換為 number，並使用 bloodSugar 鍵，保留 type
        finalPayload.bloodSugar = parseFloat(healthData.value);
        finalPayload.bloodSugarType = healthData.type;
    } else if (type === "bloodPressure") {
        // 血壓：將收縮壓 (systolic) 和舒張壓 (diastolic) 轉換為 number
        finalPayload.systolic = parseFloat(healthData.systolic);
        finalPayload.diastolic = parseFloat(healthData.diastolic);
    } else if (type === "bloodLipids") {
        // 血脂：將所有血脂相關數值轉換為 number，並使用正確的鍵名
        finalPayload.totalCholesterol = parseFloat(healthData.total);
        finalPayload.hdl = parseFloat(healthData.hdl);
        finalPayload.ldl = parseFloat(healthData.ldl);
        finalPayload.triglycerides = parseFloat(healthData.tri);
    }
    
    // 3. 執行 API 呼叫，使用修正後的 finalPayload
    try {
        await fetch('/api/health_records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalPayload) // <--- ✅ 這裡使用修正後的物件
        });
        setOpenDialog(null);
        toast({ title: "數據已儲存", description: "正在更新圖表與 AI 分析..." });
        // 儲存成功後，重新獲取資料並觸發 AI 分析
        await fetchDataAndAnalyze();
    } catch (error) {
        console.error("Save failed", error);
        toast({ title: "儲存失敗", variant: "destructive" });
    }
  };

  const getRiskBadgeColor = (level: string) => {
    if (!level) return "outline";
    if (level.includes("高")) return "destructive"; // 紅
    if (level.includes("中")) return "default"; // 黑/深色
    if (level.includes("低") || level.includes("正常")) return "secondary"; // 綠
    return "outline"; // 未評估 (灰色)
  };

  // 判斷代謝症候群的 Badge
  const getMetabolicBadge = (data: { status: boolean; detail: string }) => {
    // 如果 detail 包含缺資料或未評估，則顯示未評估 Badge
    if (data.detail && (data.detail.includes("資料不足") || data.detail.includes("缺") || data.detail.includes("未評估"))) {
        return <Badge variant="outline">未評估</Badge>;
    }
    return data.status ? <Badge variant="destructive">高風險</Badge> : <Badge variant="secondary">正常</Badge>;
  };

  const getLatest = (key: keyof HealthRecord) => {
    if (historyData.length === 0) return "--";
    
    // 從最後一筆往回找，找到第一個有值的
    for (let i = historyData.length - 1; i >= 0; i--) {
      const val = historyData[i][key];
      // 確保值不是 undefined, null, 或空字串
      if (val !== undefined && val !== null && val !== "") { 
        // 為了顯示友好，如果它是數值，我們進行四捨五入
        if (typeof val === 'number') {
            return parseFloat(val.toFixed(1)); 
        }
        return val;
      }
    }
    return "--";
  };

  if (userId === null && !isDataLoading) {
    return (
      <div className="p-8 text-center max-w-3xl mx-auto border rounded-lg shadow-lg bg-white mt-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900">請先登入</h3>
        <p className="text-gray-500 mt-2">
          此功能需要您的健康記錄與個人數據才能提供個人化儀表板與 AI 風險評估。<br/>
          請登入以開始記錄您的健康數據。
        </p>
        <Button className="mt-6 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.href = '/login'}>
          前往登入
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* 標題與免責聲明 */}
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-xl text-teal-600">個人化健康管理</CardTitle>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Info size={16} className="mr-2" />
          <span>此系統提供的建議僅供參考，不能替代專業醫療診斷</span>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="dashboard">健康儀表板</TabsTrigger>
          <TabsTrigger value="trends">趨勢與解讀</TabsTrigger>
          <TabsTrigger value="alerts">風險評估</TabsTrigger>
        </TabsList>

        {/* 儀錶板 */}
        <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {/* 1. 血壓 */}
                <Card className="flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-gray-700">血壓監測</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="min-h-[5rem]">
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                        {getLatest('systolic')}/{getLatest('diastolic')}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">mmHg</span>
                    </div>
                    </div>
                    <div className="h-[120px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} dot={{r: 2}} name="收縮壓" connectNulls />
                        <Line type="monotone" dataKey="diastolic" stroke="#f97316" strokeWidth={2} dot={{r: 2}} name="舒張壓" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                    <Button className="w-full mt-4" variant="outline" onClick={() => setOpenDialog("bp")}>記錄血壓</Button>
                </CardContent>
                </Card>

                {/* 2. 血糖 */}
                <Card className="flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-gray-700">血糖追蹤</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="min-h-[5rem]">
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-gray-900">{getLatest('bloodSugar')}</span>
                        <span className="text-sm text-gray-500 ml-2">mg/dL</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {(() => {
                            // 1. 往回找最近一筆有血糖的紀錄
                            const latestSugarRecord = [...historyData].reverse().find(r => r.bloodSugar != null);
                            
                            if (latestSugarRecord && latestSugarRecord.bloodSugarType) {
                              // 【修正重點】加上 "as string" 來解決 TypeScript 錯誤
                              const type = latestSugarRecord.bloodSugarType as string;

                              // 現在 .includes 就不會報錯了
                              if (type === 'fasting' || type.includes('fasting')) return "(空腹)";
                              if (type === 'postprandial' || type.includes('postprandial')) return "(飯後)";
                            }
                            return "";
                          })()}
                        </span>
                    </div>
                    </div>
                    <div className="h-[120px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="bloodSugar" stroke="#3b82f6" strokeWidth={2} dot={{r: 2}} name="血糖" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                    <Button className="w-full mt-4" variant="outline" onClick={() => setOpenDialog("sugar")}>記錄血糖</Button>
                </CardContent>
                </Card>

                {/* 3. 血脂 */}
                <Card className="flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-gray-700">血脂指標</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="min-h-[5rem]">
                        <div className="flex justify-between items-end mb-1">
                            <div>
                                <span className="text-3xl font-bold text-gray-900">{getLatest('totalCholesterol')}</span>
                                <span className="text-sm text-gray-500 ml-2">mg/dL</span>
                            </div>
                        </div>
                        <div className="flex space-x-3 text-sm text-gray-600 bg-gray-50 p-1.5 rounded-md">
                            <span>HDL: <span className="font-medium text-gray-900">{getLatest('hdl')}</span></span>
                            <span className="text-gray-300">|</span>
                            <span>LDL: <span className="font-medium text-gray-900">{getLatest('ldl')}</span></span>
                        </div>
                    </div>
                    <div className="h-[120px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="totalCholesterol" stroke="#8b5cf6" strokeWidth={2} dot={{r: 2}} name="總膽固醇" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                    <Button className="w-full mt-4" variant="outline" onClick={() => setOpenDialog("lipid")}>記錄血脂</Button>
                </CardContent>
                </Card>

                {/* 4. 體重 */}
                <Card className="flex flex-col h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium text-gray-700">體重管理</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="min-h-[5rem]">
                    <div className="mb-2">
                        <span className="text-3xl font-bold text-gray-900">{getLatest('weight')}</span>
                        <span className="text-sm text-gray-500 ml-2">kg</span>
                    </div>
                    </div>
                    <div className="h-[120px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData.slice(-7)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="date" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                        <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{r: 2}} name="體重" connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                    <Button className="w-full mt-4" variant="outline" onClick={() => setOpenDialog("weight")}>記錄體重</Button>
                </CardContent>
                </Card>
            </div>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">趨勢深度分析</h3>
                
                {/* 新增：手動重新分析按鈕 (除錯用，也方便使用者) */}
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fetchDataAndAnalyze()} 
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 text-orange-500" />}
                        <span className="ml-2">{isAnalyzing ? "AI 分析中..." : "重新分析"}</span>
                    </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                 <h4 className="font-medium mb-2 text-gray-900">整體趨勢解讀</h4>
                 {/* 如果是預設文字，顯示提示 */}
                 <p className="text-gray-700 text-sm leading-relaxed">
                   <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {latestAnalysis.trendAnalysis ? (
                        latestAnalysis.trendAnalysis
                          // 1. 用 "【" 切割字串
                          .split('【')
                          // 2. 過濾掉因為切割產生的空字串
                          .filter(item => item.trim() !== "")
                          // 3. 把切開的每一段變成一個獨立的 div
                          .map((item, index) => (
                            <div key={index} className="flex items-start">
                              {/* 把 "【" 加回來，並設為粗體顏色 */}
                              <span className="font-bold text-teal-700 mr-1">
                                【{item.split('】')[0]}】
                              </span>
                              {/* 顯示剩餘的文字內容 */}
                              <span>
                                {item.split('】')[1]}
                              </span>
                            </div>
                          ))
                      ) : (
                        "尚無趨勢分析資料"
                      )}
                    </div>
                 </p>
              </div>

              {/* 綜合圖表 */}
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="收縮壓" connectNulls />
                      <Line type="monotone" dataKey="bloodSugar" stroke="#3b82f6" name="血糖" connectNulls />
                      <Line type="monotone" dataKey="weight" stroke="#10b981" name="體重" connectNulls />
                      <Line type="monotone" dataKey="totalCholesterol" stroke="#8b5cf6" name="總膽固醇" connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                {/* 左側標題：加上 ShieldCheck 圖示讓它比較好看 */}
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium">AI 綜合風險評估</h3>
                </div>

                {/* 右側按鈕：重新分析 */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fetchDataAndAnalyze()} 
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="ml-2">{isAnalyzing ? "AI 分析中..." : "重新分析"}</span>
                  </Button>
                </div>
              </div>
              
              {historyData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">尚無資料，請先輸入數據。</div>
              ) : (
                <div className="space-y-6">
                  
                  {/* 風險卡片列表 */}
                  <div className="grid gap-4 md:grid-cols-2">
                     {/* Framingham */}
                     <div className="p-4 rounded-lg border bg-blue-50/50 border-blue-100 col-span-1 md:col-span-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span>Framingham 心血管風險 (10年內)</span>
                          <span className="font-bold text-lg">
                            {/* ✅ 修正：優先讀取 framinghamRisk，如果沒有才顯示 riskLevel 或未評估 */}
                            {typeof latestAnalysis?.framinghamRisk === 'object' 
                              ? (latestAnalysis.framinghamRisk as any).percentage 
                              : (latestAnalysis?.framinghamRisk || latestAnalysis?.riskLevel || "未評估")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={getRiskBadgeColor(latestAnalysis?.framinghamRisk?.level || "未評估") as any}>
                            {latestAnalysis?.framinghamRisk?.level || "未評估"}
                          </Badge>
                           <span className="text-[10px] text-gray-400">依據: 年齡/性別/血壓/膽固醇/吸菸</span>
                        </div>
                     </div>

                     {[
                       { title: "代謝症候群", data: latestAnalysis.metabolicRisk, basis: "血壓/血糖/血脂/體重" },
                       { title: "中風風險", data: latestAnalysis.strokeRisk, basis: "血壓控制/糖尿病史" },
                       { title: "糖尿病風險", data: latestAnalysis.diabetesRisk, basis: "空腹血糖/體重趨勢" },
                       { title: "高血壓風險", data: latestAnalysis.hypertensionRisk, basis: "收縮壓與舒張壓數值" }
                     ].map((item, idx) => (
                       <div key={idx} className="p-4 rounded-lg border bg-white border-gray-200 flex flex-col justify-between">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{item.title}</span>
                            {/* 使用新的邏輯：若資料不足顯示未評估 */}
                            {item.title === "代謝症候群" ? (
                              getMetabolicBadge(item.data as any)
                            ) : (
                              <Badge variant={getRiskBadgeColor((item.data as any).level) as any}>{(item.data as any).level}</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">*依據: {item.basis}</p>
                       </div>
                     ))}
                  </div>

                  {/* 預防與改善建議 (純清單模式) */}
                  <div className="mt-6 border-t pt-6">
                    <div className="flex items-center mb-4">
                      <ShieldCheck className="h-5 w-5 mr-2 text-teal-600" />
                      <h4 className="font-medium text-lg">預防與改善建議</h4>
                    </div>
                    
                    <div className="bg-teal-50/50 rounded-lg p-5 border border-teal-100">
                      <ul className="space-y-3">
                        {(latestAnalysis?.suggestions ?? []).map((item, idx) => (
                          <li key={idx} className="flex items-start text-sm text-gray-700 leading-relaxed font-medium">
                            <span className="mr-3 text-teal-500">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dialogs */}
        <Dialog open={openDialog === "bp"} onOpenChange={(open) => !open && setOpenDialog(null)}>
            <DialogContent>
            <DialogHeader><DialogTitle>記錄血壓</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                <Label>測量日期</Label>
                <Input type="date" value={bpForm.date} onChange={e => setBpForm({...bpForm, date: e.target.value})} />
                </div>
                <div className="grid gap-2">
                <Label>收縮壓 (mmHg)</Label>
                <Input type="number" value={bpForm.systolic} onChange={e => setBpForm({...bpForm, systolic: e.target.value})} />
                </div>
                <div className="grid gap-2">
                <Label>舒張壓 (mmHg)</Label>
                <Input type="number" value={bpForm.diastolic} onChange={e => setBpForm({...bpForm, diastolic: e.target.value})} />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={() => handleSaveData("bloodPressure", bpForm)}>儲存</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={openDialog === "sugar"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>記錄血糖</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>測量日期</Label>
                <Input type="date" value={sugarForm.date} onChange={e => setSugarForm({...sugarForm, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>血糖值 (mg/dL)</Label>
                <Input type="number" value={sugarForm.value} onChange={e => setSugarForm({...sugarForm, value: e.target.value})} placeholder="例如: 100" />
              </div>
              <div className="grid gap-2">
                <Label>測量時機</Label>
                <Select value={sugarForm.type} onValueChange={(val: any) => setSugarForm({...sugarForm, type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fasting">空腹 (Fasting)</SelectItem>
                    <SelectItem value="postprandial">飯後 (Postprandial)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleSaveData("bloodSugar", sugarForm)}>儲存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openDialog === "lipid"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>記錄血脂</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4 grid-cols-2">
              <div className="grid gap-2 col-span-2">
                <Label>測量日期</Label>
                <Input type="date" value={lipidForm.date} onChange={e => setLipidForm({...lipidForm, date: e.target.value})} />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label>總膽固醇 (Total)</Label>
                <Input type="number" placeholder="例如: 200" value={lipidForm.total} onChange={e => setLipidForm({...lipidForm, total: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>HDL (高密度)</Label>
                <Input type="number" placeholder="例如: 50" value={lipidForm.hdl} onChange={e => setLipidForm({...lipidForm, hdl: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>LDL (低密度)</Label>
                <Input type="number" placeholder="例如: 130" value={lipidForm.ldl} onChange={e => setLipidForm({...lipidForm, ldl: e.target.value})} />
              </div>
              <div className="grid gap-2 col-span-2">
                <Label>三酸甘油酯 (Triglycerides)</Label>
                <Input type="number" placeholder="例如: 150" value={lipidForm.tri} onChange={e => setLipidForm({...lipidForm, tri: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleSaveData("bloodLipids", lipidForm)}>儲存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openDialog === "weight"} onOpenChange={(open) => !open && setOpenDialog(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>記錄體重</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>測量日期</Label>
                <Input type="date" value={weightForm.date} onChange={e => setWeightForm({...weightForm, date: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <Label>體重 (kg)</Label>
                <Input type="number" step="0.1" value={weightForm.value} onChange={e => setWeightForm({...weightForm, value: e.target.value})} placeholder="例如: 65.5" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleSaveData("weight", weightForm)}>儲存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  )
}