"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { BookOpen, Tag, Search, CalendarIcon, Save, Smile, Frown, Meh, Sun, Cloud, CloudRain } from "lucide-react"

export function SelfRecording() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [mood, setMood] = useState<string | null>(null)
  const [weather, setWeather] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">自我紀錄與回顧</CardTitle>
      </CardHeader>

      <Tabs defaultValue="journal">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="journal">情緒與生活日誌</TabsTrigger>
          <TabsTrigger value="tags">記錄標籤管理</TabsTrigger>
          <TabsTrigger value="review">回顧模式</TabsTrigger>
        </TabsList>

        <TabsContent value="journal">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-teal-600" />
                  今日日誌
                </h3>
                <span className="text-sm text-gray-500">2023/05/21</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label htmlFor="journal-title" className="text-base mb-2 block">
                      標題
                    </Label>
                    <Input id="journal-title" placeholder="今日日誌標題..." />
                  </div>

                  <div>
                    <Label htmlFor="journal-content" className="text-base mb-2 block">
                      內容
                    </Label>
                    <Textarea
                      id="journal-content"
                      placeholder="記錄今天的感受、事件、想法或反思..."
                      className="min-h-[200px]"
                    />
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">標籤</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">健康</Badge>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">工作</Badge>
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">家庭</Badge>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">學習</Badge>
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer">
                        <Tag className="h-3 w-3 mr-1" />
                        添加標籤
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base mb-2 block">今日心情</Label>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        className={`flex-1 ${mood === "happy" ? "bg-green-100 border-green-300" : ""}`}
                        onClick={() => setMood("happy")}
                      >
                        <Smile className="h-5 w-5 text-green-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 mx-2 ${mood === "neutral" ? "bg-blue-100 border-blue-300" : ""}`}
                        onClick={() => setMood("neutral")}
                      >
                        <Meh className="h-5 w-5 text-blue-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 ${mood === "sad" ? "bg-red-100 border-red-300" : ""}`}
                        onClick={() => setMood("sad")}
                      >
                        <Frown className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">今日天氣</Label>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        className={`flex-1 ${weather === "sunny" ? "bg-amber-100 border-amber-300" : ""}`}
                        onClick={() => setWeather("sunny")}
                      >
                        <Sun className="h-5 w-5 text-amber-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 mx-2 ${weather === "cloudy" ? "bg-gray-100 border-gray-300" : ""}`}
                        onClick={() => setWeather("cloudy")}
                      >
                        <Cloud className="h-5 w-5 text-gray-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 ${weather === "rainy" ? "bg-blue-100 border-blue-300" : ""}`}
                        onClick={() => setWeather("rainy")}
                      >
                        <CloudRain className="h-5 w-5 text-blue-500" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">健康記錄</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>睡眠時間</span>
                        <span>7.5小時</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>運動時間</span>
                        <span>45分鐘</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>水分攝取</span>
                        <span>1800ml</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>壓力指數</span>
                        <span>3/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  儲存日誌
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Tag className="mr-2 h-5 w-5 text-teal-600" />
                  記錄標籤管理
                </h3>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Input placeholder="搜尋標籤..." />
                <Button variant="outline">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">常用標籤</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">健康 (23)</Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">工作 (18)</Badge>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">
                      家庭 (15)
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">學習 (12)</Badge>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer">壓力 (10)</Badge>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">運動 (9)</Badge>
                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer">睡眠 (8)</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">情緒標籤</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">開心 (14)</Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">平靜 (12)</Badge>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer">焦慮 (8)</Badge>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">疲倦 (7)</Badge>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">滿足 (6)</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">健康標籤</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">運動 (15)</Badge>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">睡眠 (13)</Badge>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer">飲食 (11)</Badge>
                    <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">頭痛 (5)</Badge>
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200 cursor-pointer">過敏 (4)</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">創建新標籤</h4>
                  <div className="flex items-center space-x-2">
                    <Input placeholder="新標籤名稱..." />
                    <Button>創建</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="review">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-teal-600" />
                  回顧模式
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">選擇日期</h4>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="border rounded-md p-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">2023/05/15 日誌</h4>
                  <div className="border rounded-md p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="font-medium">開始新的健康計畫</h5>
                      <div className="flex space-x-1">
                        <Badge className="bg-teal-100 text-teal-800">健康</Badge>
                        <Badge className="bg-green-100 text-green-800">運動</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      今天開始了新的健康計畫，包括每天30分鐘的有氧運動和飲食控制。
                      感覺很有動力，希望能堅持下去。早上去公園跑步，感覺很舒暢...
                    </p>
                    <div className="flex justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Smile className="h-4 w-4 text-green-500 mr-1" />
                        <span>心情愉快</span>
                      </div>
                      <div className="flex items-center">
                        <Sun className="h-4 w-4 text-amber-500 mr-1" />
                        <span>晴天</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <h6 className="text-sm font-medium mb-1">健康記錄</h6>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>睡眠時間: 7小時</div>
                        <div>運動時間: 30分鐘</div>
                        <div>水分攝取: 2000ml</div>
                        <div>壓力指數: 4/10</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-4">
                    <Button variant="outline" size="sm">
                      上一篇
                    </Button>
                    <Button variant="outline" size="sm">
                      下一篇
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">回顧分析</h4>
                <div className="space-y-2">
                  <div className="border rounded-md p-3">
                    <h5 className="font-medium text-sm">情緒趨勢</h5>
                    <p className="text-sm text-gray-600">
                      過去兩週的記錄顯示，運動日的心情評分平均高出2.5分。 工作相關標籤的日誌通常伴隨較高的壓力指數。
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h5 className="font-medium text-sm">健康關聯</h5>
                    <p className="text-sm text-gray-600">
                      睡眠時間超過7小時的日子，第二天的壓力指數平均降低1.8分。 水分攝取量與頭痛標籤出現頻率呈負相關。
                    </p>
                  </div>
                  <div className="border rounded-md p-3">
                    <h5 className="font-medium text-sm">標籤分析</h5>
                    <p className="text-sm text-gray-600">
                      最常使用的標籤組合是「健康」和「運動」，共出現15次。 「壓力」標籤在週一和週五出現頻率最高。
                    </p>
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
