"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { AlertCircle, Upload, FileText, TrendingUp, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PieLabelRenderProps } from "recharts"

// Mock data
const bloodPressureData = [
  { date: "5/15", systolic: 120, diastolic: 80 },
  { date: "5/16", systolic: 118, diastolic: 78 },
  { date: "5/17", systolic: 122, diastolic: 82 },
  { date: "5/18", systolic: 119, diastolic: 79 },
  { date: "5/19", systolic: 121, diastolic: 81 },
  { date: "5/20", systolic: 117, diastolic: 77 },
  { date: "5/21", systolic: 123, diastolic: 83 },
]

const weightData = [
  { date: "5/15", value: 68 },
  { date: "5/16", value: 67.5 },
  { date: "5/17", value: 67.8 },
  { date: "5/18", value: 67.2 },
  { date: "5/19", value: 67 },
  { date: "5/20", value: 66.8 },
  { date: "5/21", value: 66.5 },
]

const sleepData = [
  { date: "5/15", hours: 7.5, quality: 8 },
  { date: "5/16", hours: 6.8, quality: 6 },
  { date: "5/17", hours: 7.2, quality: 7 },
  { date: "5/18", hours: 8, quality: 9 },
  { date: "5/19", hours: 7.5, quality: 8 },
  { date: "5/20", hours: 6.5, quality: 5 },
  { date: "5/21", hours: 7.8, quality: 8 },
]

const nutritionData = [
  { name: "蛋白質", value: 25 },
  { name: "碳水化合物", value: 45 },
  { name: "脂肪", value: 20 },
  { name: "纖維", value: 10 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export function HealthManagement() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [fileUploaded, setFileUploaded] = useState(false)
  const [openDialog, setOpenDialog] = useState<string | null>(null)
  const [bloodPressureForm, setBloodPressureForm] = useState({ systolic: "", diastolic: "" })
  const [weightForm, setWeightForm] = useState({ value: "" })
  const [sleepForm, setSleepForm] = useState({ hours: "", quality: "" })
  const [nutritionForm, setNutritionForm] = useState({ protein: "", carbs: "", fat: "", fiber: "" })

  const handleFileUpload = () => {
    // Simulate file upload
    setFileUploaded(true)
  }

  const handleSaveBloodPressure = () => {
    console.log("血壓數據:", bloodPressureForm)
    setOpenDialog(null)
    setBloodPressureForm({ systolic: "", diastolic: "" })
  }

  const handleSaveWeight = () => {
    console.log("體重數據:", weightForm)
    setOpenDialog(null)
    setWeightForm({ value: "" })
  }

  const handleSaveSleep = () => {
    console.log("睡眠數據:", sleepForm)
    setOpenDialog(null)
    setSleepForm({ hours: "", quality: "" })
  }

  const handleSaveNutrition = () => {
    console.log("營養數據:", nutritionForm)
    setOpenDialog(null)
    setNutritionForm({ protein: "", carbs: "", fat: "", fiber: "" })
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">個人化健康管理</CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="dashboard">健康儀表板</TabsTrigger>
          <TabsTrigger value="reports">健檢報告解讀</TabsTrigger>
          <TabsTrigger value="trends">健康趨勢分析</TabsTrigger>
          <TabsTrigger value="alerts">異常監控</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">血壓追蹤</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bloodPressureData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="systolic" stroke="#0ea5e9" name="收縮壓" />
                      <Line type="monotone" dataKey="diastolic" stroke="#14b8a6" name="舒張壓" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setOpenDialog("bloodPressure")}>
                    添加數據
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">體重追蹤</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#14b8a6" name="體重(kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setOpenDialog("weight")}>
                    添加數據
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">睡眠追蹤</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sleepData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="hours" fill="#14b8a6" name="睡眠時間(小時)" />
                      <Bar dataKey="quality" fill="#0ea5e9" name="睡眠品質(1-10)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setOpenDialog("sleep")}>
                    添加數據
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">營養攝取</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nutritionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={(props) => {
                          const name = props.name ?? ""
                          const percent = Number(props.percent ?? 0)   // ← 顯式轉型
                          return `${name} ${(percent * 100).toFixed(0)}%`
                        }}
                      >
                        {nutritionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setOpenDialog("nutrition")}>
                    添加數據
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">健康指標摘要</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>BMI 指數</Label>
                    <span className="text-sm font-medium">22.1 (正常)</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>平均血壓</Label>
                    <span className="text-sm font-medium">120/80 mmHg (正常)</span>
                  </div>
                  <Progress value={70} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>平均睡眠時間</Label>
                    <span className="text-sm font-medium">7.3 小時 (良好)</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>每日活動量</Label>
                    <span className="text-sm font-medium">6,500 步 (中等)</span>
                  </div>
                  <Progress value={55} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardContent className="p-6">
              {!fileUploaded ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-teal-50">
                    <Upload className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">上傳健康檢查報告</h3>
                  <p className="text-sm text-gray-500 mb-4">上傳您的健康檢查報告，系統將自動解析並提供專業解讀</p>
                  <div className="flex flex-col items-center gap-2">
                    <Button onClick={handleFileUpload}>
                      <FileText className="mr-2 h-4 w-4" />
                      選擇檔案
                    </Button>
                    <p className="text-xs text-gray-500">支援 PDF, JPG, PNG 格式</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">2023年度健康檢查報告解讀</h3>
                    <Badge>已解析</Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">血液檢查</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>血紅素 (Hb)</span>
                          <div className="flex items-center">
                            <span className="mr-2">14.2 g/dL</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              正常
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>白血球計數 (WBC)</span>
                          <div className="flex items-center">
                            <span className="mr-2">6,500 /μL</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              正常
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>血小板計數 (PLT)</span>
                          <div className="flex items-center">
                            <span className="mr-2">230,000 /μL</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              正常
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>總膽固醇</span>
                          <div className="flex items-center">
                            <span className="mr-2">210 mg/dL</span>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700">
                              稍高
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">肝功能檢查</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>AST (麩草酸轉氨酶)</span>
                          <div className="flex items-center">
                            <span className="mr-2">25 U/L</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              正常
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>ALT (麩丙酸轉氨酶)</span>
                          <div className="flex items-center">
                            <span className="mr-2">28 U/L</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              正常
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">尿液檢查</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>尿蛋白</span>
                          <div className="flex items-center">
                            <span className="mr-2">陰性</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              正常
                            </Badge>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>尿糖</span>
                          <div className="flex items-center">
                            <span className="mr-2">陰性</span>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              正常
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-teal-50 p-4 rounded-md">
                      <h4 className="font-medium mb-2 flex items-center text-teal-700">
                        <FileText className="mr-2 h-4 w-4" />
                        報告總結與建議
                      </h4>
                      <p className="text-sm text-teal-700">
                        您的健康檢查結果大部分指標正常，只有總膽固醇略高於正常範圍。建議：
                      </p>
                      <ul className="list-disc list-inside text-sm text-teal-700 mt-2">
                        <li>控制飲食中的飽和脂肪和膽固醇攝入</li>
                        <li>增加纖維攝入，如全穀物、蔬菜和水果</li>
                        <li>保持規律運動，每週至少150分鐘中等強度活動</li>
                        <li>6個月後再次檢查膽固醇水平</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">健康趨勢分析</h3>
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-teal-600 mr-1" />
                  <span className="text-sm text-teal-600">過去3個月數據</span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">血壓趨勢</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...Array(30)].map((_, i) => ({
                          date: `${Math.floor(i / 10) + 3}/${(i % 10) + 1}`,
                          systolic: 120 + Math.floor(Math.random() * 10) - 5,
                          diastolic: 80 + Math.floor(Math.random() * 8) - 4,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="systolic" stroke="#0ea5e9" name="收縮壓" />
                        <Line type="monotone" dataKey="diastolic" stroke="#14b8a6" name="舒張壓" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>分析：您的血壓在過去3個月保持穩定，維持在正常範圍內。</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">體重趨勢</h4>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[...Array(30)].map((_, i) => ({
                          date: `${Math.floor(i / 10) + 3}/${(i % 10) + 1}`,
                          value: 68 - i * 0.05 + (Math.random() * 0.4 - 0.2),
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[65, 70]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#14b8a6" name="體重(kg)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>分析：您的體重在過去3個月呈現緩慢下降趨勢，總計減少約1.5公斤。</p>
                  </div>
                </div>

                <div className="bg-teal-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2 flex items-center text-teal-700">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    趨勢總結
                  </h4>
                  <p className="text-sm text-teal-700">
                    根據您過去3個月的健康數據分析，您的整體健康狀況呈現穩定向好的趨勢：
                  </p>
                  <ul className="list-disc list-inside text-sm text-teal-700 mt-2">
                    <li>血壓維持在正常範圍，波動小</li>
                    <li>體重呈現健康的緩慢下降趨勢</li>
                    <li>睡眠質量有所提升</li>
                    <li>活動量增加了約15%</li>
                  </ul>
                  <p className="text-sm text-teal-700 mt-2">建議繼續保持目前的生活方式，並考慮增加有氧運動的頻率。</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">異常監控與風險預警</h3>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  目前無高風險警報
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-50">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                    <h4 className="font-medium text-amber-700">膽固醇水平輕度偏高</h4>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">
                    您的總膽固醇為210 mg/dL，略高於正常範圍（&lt;200 mg/dL）。
                  </p>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-300 hover:bg-amber-100 bg-transparent"
                    >
                      查看建議
                    </Button>
                  </div>
                </div>

                <div className="border-l-4 border-teal-500 pl-4 py-2 bg-teal-50">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-teal-500 mr-2" />
                    <h4 className="font-medium text-teal-700">睡眠時間偶有不足</h4>
                  </div>
                  <p className="text-sm text-teal-600 mt-1">過去兩週內，有3天您的睡眠時間少於7小時。</p>
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-teal-600 border-teal-300 hover:bg-teal-100 bg-transparent"
                    >
                      查看建議
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-3">風險評估</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>心血管疾病風險</Label>
                        <span className="text-sm font-medium text-green-600">低風險 (5%)</span>
                      </div>
                      <Progress value={5} className="h-2 bg-gray-100" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>糖尿病風險</Label>
                        <span className="text-sm font-medium text-green-600">低風險 (3%)</span>
                      </div>
                      <Progress value={3} className="h-2 bg-gray-100" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>高血壓風險</Label>
                        <span className="text-sm font-medium text-amber-600">中低風險 (15%)</span>
                      </div>
                      <Progress value={15} className="h-2 bg-gray-100" />
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mt-4">
                  <h4 className="font-medium mb-2">預防建議</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>定期監測血壓和膽固醇水平</li>
                    <li>保持健康飲食，減少飽和脂肪和鹽的攝入</li>
                    <li>每週至少進行150分鐘中等強度的有氧運動</li>
                    <li>確保充足的睡眠（每晚7-8小時）</li>
                    <li>定期進行健康檢查</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog components for each data entry form */}
      {/* Blood Pressure Dialog */}
      <Dialog open={openDialog === "bloodPressure"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加血壓數據</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="systolic">收縮壓 (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
                placeholder="例如：120"
                value={bloodPressureForm.systolic}
                onChange={(e) => setBloodPressureForm({ ...bloodPressureForm, systolic: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic">舒張壓 (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                placeholder="例如：80"
                value={bloodPressureForm.diastolic}
                onChange={(e) => setBloodPressureForm({ ...bloodPressureForm, diastolic: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              取消
            </Button>
            <Button onClick={handleSaveBloodPressure}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Weight Dialog */}
      <Dialog open={openDialog === "weight"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加體重數據</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="weight">體重 (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="例如：67.5"
                value={weightForm.value}
                onChange={(e) => setWeightForm({ value: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              取消
            </Button>
            <Button onClick={handleSaveWeight}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sleep Dialog */}
      <Dialog open={openDialog === "sleep"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加睡眠數據</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="hours">睡眠時間 (小時)</Label>
              <Input
                id="hours"
                type="number"
                step="0.1"
                placeholder="例如：7.5"
                value={sleepForm.hours}
                onChange={(e) => setSleepForm({ ...sleepForm, hours: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">睡眠品質 (1-10)</Label>
              <Input
                id="quality"
                type="number"
                min="1"
                max="10"
                placeholder="例如：8"
                value={sleepForm.quality}
                onChange={(e) => setSleepForm({ ...sleepForm, quality: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              取消
            </Button>
            <Button onClick={handleSaveSleep}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nutrition Dialog */}
      <Dialog open={openDialog === "nutrition"} onOpenChange={(open) => !open && setOpenDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加營養數據</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="protein">蛋白質 (%)</Label>
              <Input
                id="protein"
                type="number"
                placeholder="例如：25"
                value={nutritionForm.protein}
                onChange={(e) => setNutritionForm({ ...nutritionForm, protein: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">碳水化合物 (%)</Label>
              <Input
                id="carbs"
                type="number"
                placeholder="例如：45"
                value={nutritionForm.carbs}
                onChange={(e) => setNutritionForm({ ...nutritionForm, carbs: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">脂肪 (%)</Label>
              <Input
                id="fat"
                type="number"
                placeholder="例如：20"
                value={nutritionForm.fat}
                onChange={(e) => setNutritionForm({ ...nutritionForm, fat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">纖維 (%)</Label>
              <Input
                id="fiber"
                type="number"
                placeholder="例如：10"
                value={nutritionForm.fiber}
                onChange={(e) => setNutritionForm({ ...nutritionForm, fiber: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)}>
              取消
            </Button>
            <Button onClick={handleSaveNutrition}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
