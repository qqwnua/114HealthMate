"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type HealthMetric = {
  date: string
  value: number
}

type HealthData = {
  weight: HealthMetric[]
  bloodPressure: HealthMetric[]
  sleepHours: HealthMetric[]
  steps: HealthMetric[]
}

// Mock data
const initialData: HealthData = {
  weight: [
    { date: "5/15", value: 68 },
    { date: "5/16", value: 67.5 },
    { date: "5/17", value: 67.8 },
    { date: "5/18", value: 67.2 },
    { date: "5/19", value: 67 },
  ],
  bloodPressure: [
    { date: "5/15", value: 120 },
    { date: "5/16", value: 118 },
    { date: "5/17", value: 122 },
    { date: "5/18", value: 119 },
    { date: "5/19", value: 117 },
  ],
  sleepHours: [
    { date: "5/15", value: 7.5 },
    { date: "5/16", value: 6.8 },
    { date: "5/17", value: 7.2 },
    { date: "5/18", value: 8 },
    { date: "5/19", value: 7.5 },
  ],
  steps: [
    { date: "5/15", value: 8500 },
    { date: "5/16", value: 7200 },
    { date: "5/17", value: 9100 },
    { date: "5/18", value: 8300 },
    { date: "5/19", value: 10200 },
  ],
}

export function HealthTracker() {
  const [healthData, setHealthData] = useState<HealthData>(initialData)
  const [newEntry, setNewEntry] = useState({
    weight: "",
    bloodPressure: "",
    sleepHours: "",
    steps: "",
  })
  const [addDataOpen, setAddDataOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<keyof HealthData>("weight")
  const [batchData, setBatchData] = useState({
    date: "",
    weight: "",
    bloodPressure: "",
    sleepHours: "",
    steps: "",
    heartRate: "",
    temperature: "",
    notes: "",
  })

  const metricLabels = {
    weight: "體重 (kg)",
    bloodPressure: "血壓 (mmHg)",
    sleepHours: "睡眠 (小時)",
    steps: "步數",
  }

  const handleAddEntry = (metric: keyof HealthData) => {
    if (!newEntry[metric]) return

    const today = new Date()
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`

    setHealthData((prev) => ({
      ...prev,
      [metric]: [...prev[metric], { date: dateStr, value: Number.parseFloat(newEntry[metric]) }],
    }))

    setNewEntry((prev) => ({
      ...prev,
      [metric]: "",
    }))

    toast({
      title: "數據已添加",
      description: `${metricLabels[metric]} 數據已成功記錄`,
    })
  }

  const handleBatchAdd = () => {
    if (!batchData.date) {
      toast({
        title: "請選擇日期",
        description: "請先選擇要記錄的日期",
        variant: "destructive",
      })
      return
    }

    const dateStr = new Date(batchData.date).toLocaleDateString("zh-TW", {
      month: "numeric",
      day: "numeric",
    })

    let addedCount = 0

    // 批量添加各項數據
    if (batchData.weight) {
      setHealthData((prev) => ({
        ...prev,
        weight: [...prev.weight, { date: dateStr, value: Number.parseFloat(batchData.weight) }],
      }))
      addedCount++
    }

    if (batchData.bloodPressure) {
      setHealthData((prev) => ({
        ...prev,
        bloodPressure: [...prev.bloodPressure, { date: dateStr, value: Number.parseFloat(batchData.bloodPressure) }],
      }))
      addedCount++
    }

    if (batchData.sleepHours) {
      setHealthData((prev) => ({
        ...prev,
        sleepHours: [...prev.sleepHours, { date: dateStr, value: Number.parseFloat(batchData.sleepHours) }],
      }))
      addedCount++
    }

    if (batchData.steps) {
      setHealthData((prev) => ({
        ...prev,
        steps: [...prev.steps, { date: dateStr, value: Number.parseFloat(batchData.steps) }],
      }))
      addedCount++
    }

    if (addedCount > 0) {
      setBatchData({
        date: "",
        weight: "",
        bloodPressure: "",
        sleepHours: "",
        steps: "",
        heartRate: "",
        temperature: "",
        notes: "",
      })
      setAddDataOpen(false)
      toast({
        title: "批量數據已添加",
        description: `成功添加 ${addedCount} 項健康數據`,
      })
    } else {
      toast({
        title: "請輸入數據",
        description: "請至少輸入一項健康數據",
        variant: "destructive",
      })
    }
  }

  const getTrend = (data: HealthMetric[]) => {
    if (data.length < 2) return "stable"
    const latest = data[data.length - 1].value
    const previous = data[data.length - 2].value
    if (latest > previous) return "up"
    if (latest < previous) return "down"
    return "stable"
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-emerald-600">健康數據追蹤</CardTitle>
          <Dialog open={addDataOpen} onOpenChange={setAddDataOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                添加數據
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>批量添加健康數據</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-date">記錄日期</Label>
                  <Input
                    id="batch-date"
                    type="date"
                    value={batchData.date}
                    onChange={(e) => setBatchData((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-weight">體重 (kg)</Label>
                    <Input
                      id="batch-weight"
                      type="number"
                      step="0.1"
                      placeholder="例如：65.5"
                      value={batchData.weight}
                      onChange={(e) => setBatchData((prev) => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-bp">收縮壓 (mmHg)</Label>
                    <Input
                      id="batch-bp"
                      type="number"
                      placeholder="例如：120"
                      value={batchData.bloodPressure}
                      onChange={(e) => setBatchData((prev) => ({ ...prev, bloodPressure: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-sleep">睡眠時間 (小時)</Label>
                    <Input
                      id="batch-sleep"
                      type="number"
                      step="0.1"
                      placeholder="例如：7.5"
                      value={batchData.sleepHours}
                      onChange={(e) => setBatchData((prev) => ({ ...prev, sleepHours: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-steps">步數</Label>
                    <Input
                      id="batch-steps"
                      type="number"
                      placeholder="例如：8000"
                      value={batchData.steps}
                      onChange={(e) => setBatchData((prev) => ({ ...prev, steps: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batch-hr">心率 (bpm)</Label>
                    <Input
                      id="batch-hr"
                      type="number"
                      placeholder="例如：72"
                      value={batchData.heartRate}
                      onChange={(e) => setBatchData((prev) => ({ ...prev, heartRate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="batch-temp">體溫 (°C)</Label>
                    <Input
                      id="batch-temp"
                      type="number"
                      step="0.1"
                      placeholder="例如：36.5"
                      value={batchData.temperature}
                      onChange={(e) => setBatchData((prev) => ({ ...prev, temperature: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-notes">備註</Label>
                  <Input
                    id="batch-notes"
                    placeholder="記錄當日特殊情況或感受"
                    value={batchData.notes}
                    onChange={(e) => setBatchData((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setAddDataOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleBatchAdd}>添加數據</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weight">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="weight">體重 (kg)</TabsTrigger>
            <TabsTrigger value="bloodPressure">血壓 (mmHg)</TabsTrigger>
            <TabsTrigger value="sleepHours">睡眠 (小時)</TabsTrigger>
            <TabsTrigger value="steps">步數</TabsTrigger>
          </TabsList>

          {(Object.keys(healthData) as Array<keyof HealthData>).map((metric) => (
            <TabsContent key={metric} value={metric} className="space-y-4">
              {/* 趨勢指標 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">最新數值:</span>
                  <span className="text-lg font-bold">
                    {healthData[metric][healthData[metric].length - 1]?.value || 0}
                  </span>
                  {getTrendIcon(getTrend(healthData[metric]))}
                </div>
                <div className="text-sm text-gray-500">
                  平均:{" "}
                  {(healthData[metric].reduce((sum, item) => sum + item.value, 0) / healthData[metric].length).toFixed(
                    1,
                  )}
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthData[metric]} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#10b981" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex space-x-2">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor={`new-${metric}`}>新增數據</Label>
                  <Input
                    id={`new-${metric}`}
                    type="number"
                    step={metric === "weight" || metric === "sleepHours" ? "0.1" : "1"}
                    value={newEntry[metric]}
                    onChange={(e) => setNewEntry({ ...newEntry, [metric]: e.target.value })}
                    placeholder={`輸入您的${
                      metric === "weight"
                        ? "體重"
                        : metric === "bloodPressure"
                          ? "收縮壓"
                          : metric === "sleepHours"
                            ? "睡眠時間"
                            : "步數"
                    }`}
                  />
                </div>
                <Button className="self-end bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAddEntry(metric)}>
                  添加
                </Button>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
