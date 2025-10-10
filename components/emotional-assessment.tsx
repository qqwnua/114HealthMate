"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, BarChart3, MessageSquare, MicIcon, Save } from "lucide-react"

// Mock data
const emotionalRadarData = [
  { subject: "焦慮", A: 3, fullMark: 10 },
  { subject: "壓力", A: 7, fullMark: 10 },
  { subject: "情緒穩定", A: 6, fullMark: 10 },
  { subject: "幸福感", A: 5, fullMark: 10 },
  { subject: "社交滿足", A: 4, fullMark: 10 },
  { subject: "自信", A: 6, fullMark: 10 },
]

const emotionalTrendData = [
  { date: "5/15", anxiety: 5, stress: 8, happiness: 4 },
  { date: "5/16", anxiety: 6, stress: 7, happiness: 4 },
  { date: "5/17", anxiety: 4, stress: 6, happiness: 5 },
  { date: "5/18", anxiety: 3, stress: 5, happiness: 6 },
  { date: "5/19", anxiety: 4, stress: 6, happiness: 5 },
  { date: "5/20", anxiety: 3, stress: 4, happiness: 7 },
  { date: "5/21", anxiety: 2, stress: 3, happiness: 8 },
]

export function EmotionalAssessment() {
  const [activeTab, setActiveTab] = useState("assessment")
  const [emotionalValues, setEmotionalValues] = useState({
    anxiety: 3,
    stress: 7,
    mood: 6,
    happiness: 5,
    social: 4,
    confidence: 6,
  })

  const handleEmotionalChange = (key: string, value: number[]) => {
    setEmotionalValues({
      ...emotionalValues,
      [key]: value[0],
    })
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">情緒與風險評估</CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="assessment">情緒狀態評估</TabsTrigger>
          <TabsTrigger value="analysis">情緒分析</TabsTrigger>
          <TabsTrigger value="trends">情緒趨勢</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Heart className="mr-2 h-5 w-5 text-teal-600" />
                  今日情緒評估
                </h3>
                <span className="text-sm text-gray-500">2023/05/21</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>焦慮程度</Label>
                      <span className="text-sm">{emotionalValues.anxiety}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.anxiety]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("anxiety", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>壓力程度</Label>
                      <span className="text-sm">{emotionalValues.stress}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.stress]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("stress", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>情緒穩定度</Label>
                      <span className="text-sm">{emotionalValues.mood}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.mood]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("mood", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>幸福感</Label>
                      <span className="text-sm">{emotionalValues.happiness}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.happiness]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("happiness", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>社交滿足度</Label>
                      <span className="text-sm">{emotionalValues.social}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.social]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("social", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>自信程度</Label>
                      <span className="text-sm">{emotionalValues.confidence}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.confidence]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("confidence", value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="emotional-notes" className="text-base mb-2 block">
                    今日情緒筆記
                  </Label>
                  <Textarea
                    id="emotional-notes"
                    placeholder="記錄今天的情緒感受、壓力來源或任何想法..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    儲存評估
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-teal-600" />
                  情緒分析
                </h3>
              </div>

              <div className="space-y-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={emotionalRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} />
                      <Radar name="情緒狀態" dataKey="A" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-teal-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">情緒分析摘要</h4>
                  <p className="text-sm text-gray-700">
                    根據您的評估，目前壓力水平較高（7/10），可能需要關注。
                    情緒穩定度和自信程度中等（6/10），幸福感和社交滿足度略低於平均水平。
                    焦慮程度較低（3/10），這是一個積極的指標。
                  </p>
                  <h4 className="font-medium mt-3 mb-2">建議</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>考慮增加壓力管理活動，如冥想或深呼吸練習</li>
                    <li>增加社交互動以提高社交滿足度</li>
                    <li>保持目前有效的焦慮管理策略</li>
                    <li>嘗試增加能提升幸福感的活動，如戶外活動或愛好</li>
                  </ul>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">情緒語意分析</h4>
                  <div className="flex items-center mb-4">
                    <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
                    <Label htmlFor="text-analysis" className="sr-only">
                      文字分析
                    </Label>
                    <Textarea
                      id="text-analysis"
                      placeholder="輸入一段文字，系統將分析其中的情緒..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <div className="flex items-center">
                    <MicIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <Button variant="outline" className="w-full">
                      開始語音情緒分析
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">情緒趨勢分析</h3>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">過去7天</span>
                </div>
              </div>

              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emotionalTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="anxiety" stroke="#ef4444" name="焦慮" />
                    <Line type="monotone" dataKey="stress" stroke="#f97316" name="壓力" />
                    <Line type="monotone" dataKey="happiness" stroke="#14b8a6" name="幸福感" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-teal-50 p-4 rounded-md">
                <h4 className="font-medium mb-2">趨勢分析</h4>
                <p className="text-sm text-gray-700">
                  過去7天的情緒趨勢顯示積極的變化：焦慮和壓力水平持續下降，
                  而幸福感則呈上升趨勢。這表明您最近的情緒管理策略有效。
                </p>
                <h4 className="font-medium mt-3 mb-2">關鍵觀察</h4>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  <li>壓力水平從8/10下降到3/10，降幅顯著</li>
                  <li>焦慮程度從5/10下降到2/10</li>
                  <li>幸福感從4/10上升到8/10</li>
                  <li>5/18是情緒轉折點，各指標開始明顯改善</li>
                </ul>
              </div>

              <div className="border rounded-md p-4">
                <h4 className="font-medium mb-2">情緒影響因素記錄</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>5/18</span>
                    <span>開始新的運動計畫，完成工作項目</span>
                  </div>
                  <div className="flex justify-between">
                    <span>5/19</span>
                    <span>與朋友聚會，睡眠充足</span>
                  </div>
                  <div className="flex justify-between">
                    <span>5/20</span>
                    <span>戶外活動，練習冥想</span>
                  </div>
                  <div className="flex justify-between">
                    <span>5/21</span>
                    <span>家庭聚會，完成個人目標</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
