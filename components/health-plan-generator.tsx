"use client"

import { useState } from "react"
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
  Brain,
  Send,
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

// Mock health data from health management system
const mockHealthData = {
  personalInfo: {
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

// Progress tracking data
const progressData = [
  { week: "第1週", weight: 68, target: 67.5, waterIntake: 85, exercise: 90, sleep: 75, bloodPressure: 125 },
  { week: "第2週", weight: 67.2, target: 67, waterIntake: 90, exercise: 85, sleep: 80, bloodPressure: 122 },
  { week: "第3週", weight: 66.8, target: 66.5, waterIntake: 95, exercise: 88, sleep: 85, bloodPressure: 120 },
  { week: "第4週", weight: 66.3, target: 66, waterIntake: 88, exercise: 92, sleep: 78, bloodPressure: 118 },
  { week: "第5週", weight: 65.9, target: 65.5, waterIntake: 92, exercise: 95, sleep: 82, bloodPressure: 115 },
]

const stageProgressData = [
  {
    stage: "第一階段",
    progress: 100,
    target: "建立基礎習慣",
    status: "completed",
    duration: "4週",
    goals: ["每日喝水8杯", "每週運動3次", "規律睡眠"],
    achievements: ["✓ 建立喝水習慣", "✓ 適應運動節奏", "✓ 改善睡眠品質"],
  },
  {
    stage: "第二階段",
    progress: 75,
    target: "強化訓練強度",
    status: "active",
    duration: "4週",
    goals: ["增加運動強度", "控制飲食熱量", "監測血壓變化"],
    achievements: ["✓ 運動時間延長", "○ 飲食控制中", "○ 血壓穩定下降"],
  },
  {
    stage: "第三階段",
    progress: 0,
    target: "鞏固健康成果",
    status: "pending",
    duration: "4週",
    goals: ["維持目標體重", "建立長期習慣", "定期健康檢查"],
    achievements: [],
  },
]

export function HealthPlanGenerator() {
  const [activeTab, setActiveTab] = useState("generator")
  const [planGenerated, setPlanGenerated] = useState(false)
  const [userGoals, setUserGoals] = useState([])
  const [targetSettings, setTargetSettings] = useState({})
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [assistantDialogOpen, setAssistantDialogOpen] = useState(false)
  const [reminderSettings, setReminderSettings] = useState({
    waterReminder: true,
    exerciseReminder: true,
    mealReminder: true,
    sleepReminder: true,
    medicationReminder: false,
  })

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/health-assistant",
  })

  // Generate personalized health plan
  const generateHealthPlan = () => {
    const plan = {
      id: Date.now(),
      title: `${userGoals.join("+")}個人化健康計畫`,
      goals: userGoals,
      targetSettings: targetSettings,
      duration: "12週",
      stages: generatePlanStages(),
      dailySchedule: generateDailySchedule(),
      reminders: generateReminders(),
      createdAt: new Date().toISOString(),
    }

    setGeneratedPlan(plan)
    setPlanGenerated(true)
  }

  const generatePlanStages = () => {
    const stages = [
      {
        id: 1,
        name: "適應建立期",
        duration: "4週",
        description: "建立基礎健康習慣，適應新的生活節奏",
        goals: generateStageGoals(1),
        tasks: generateStageTasks(1),
        milestones: ["建立規律作息", "適應運動強度", "養成健康飲食習慣"],
      },
      {
        id: 2,
        name: "強化提升期",
        duration: "4週",
        description: "增強訓練強度，優化健康指標",
        goals: generateStageGoals(2),
        tasks: generateStageTasks(2),
        milestones: ["提升運動表現", "改善生理指標", "強化自律能力"],
      },
      {
        id: 3,
        name: "鞏固維持期",
        duration: "4週",
        description: "鞏固健康成果，建立長期維持機制",
        goals: generateStageGoals(3),
        tasks: generateStageTasks(3),
        milestones: ["達成目標指標", "建立長期習慣", "制定維持計畫"],
      },
    ]

    return stages
  }

  const generateStageGoals = (stage) => {
    const baseGoals = []

    if (userGoals.includes("減重")) {
      const weightLoss = stage === 1 ? 1.5 : stage === 2 ? 2 : 1.5
      baseGoals.push(`減重${weightLoss}公斤`)
    }

    if (userGoals.includes("控糖")) {
      baseGoals.push(stage === 1 ? "穩定血糖波動" : stage === 2 ? "降低平均血糖" : "維持血糖正常")
    }

    if (userGoals.includes("降血壓")) {
      baseGoals.push(stage === 1 ? "血壓下降5mmHg" : stage === 2 ? "血壓下降10mmHg" : "維持血壓正常")
    }

    if (userGoals.includes("增肌")) {
      baseGoals.push(stage === 1 ? "建立肌力基礎" : stage === 2 ? "增加肌肉量" : "維持肌肉質量")
    }

    return baseGoals
  }

  const generateStageTasks = (stage) => {
    const tasks = []

    // 基礎任務
    tasks.push(
      {
        id: `water-${stage}`,
        name: "每日飲水",
        type: "hydration",
        target: stage === 1 ? 6 : 8,
        unit: "杯",
        frequency: "daily",
        icon: <Droplets className="h-4 w-4" />,
        color: "blue",
        priority: "high",
      },
      {
        id: `sleep-${stage}`,
        name: "充足睡眠",
        type: "sleep",
        target: 8,
        unit: "小時",
        frequency: "daily",
        icon: <Moon className="h-4 w-4" />,
        color: "purple",
        priority: "high",
      },
    )

    // 根據目標添加特定任務
    if (userGoals.includes("減重") || userGoals.includes("降血壓")) {
      tasks.push({
        id: `cardio-${stage}`,
        name: "有氧運動",
        type: "exercise",
        target: stage === 1 ? 20 : stage === 2 ? 30 : 30,
        unit: "分鐘",
        frequency: "daily",
        icon: <Activity className="h-4 w-4" />,
        color: "green",
        priority: "high",
      })
    }

    if (userGoals.includes("增肌")) {
      tasks.push({
        id: `strength-${stage}`,
        name: "肌力訓練",
        type: "strength",
        target: stage === 1 ? 15 : stage === 2 ? 25 : 30,
        unit: "分鐘",
        frequency: "3x/week",
        icon: <Dumbbell className="h-4 w-4" />,
        color: "red",
        priority: "medium",
      })
    }

    if (userGoals.includes("控糖")) {
      tasks.push({
        id: `nutrition-${stage}`,
        name: "血糖友善飲食",
        type: "nutrition",
        target: 3,
        unit: "餐",
        frequency: "daily",
        icon: <Utensils className="h-4 w-4" />,
        color: "orange",
        priority: "high",
      })
    }

    return tasks
  }

  const generateDailySchedule = () => {
    const schedule = {
      morning: [
        { time: "06:30", task: "起床喝水", duration: "5分鐘", type: "hydration" },
        { time: "07:00", task: "晨間運動", duration: "30分鐘", type: "exercise" },
        { time: "08:00", task: "健康早餐", duration: "30分鐘", type: "nutrition" },
      ],
      afternoon: [
        { time: "12:00", task: "午餐", duration: "45分鐘", type: "nutrition" },
        { time: "14:00", task: "補充水分", duration: "5分鐘", type: "hydration" },
        { time: "16:00", task: "健康點心", duration: "15分鐘", type: "nutrition" },
      ],
      evening: [
        { time: "18:30", task: "晚餐", duration: "45分鐘", type: "nutrition" },
        { time: "20:00", task: "晚間運動", duration: "25分鐘", type: "exercise" },
        { time: "22:00", task: "準備就寢", duration: "30分鐘", type: "sleep" },
      ],
    }

    return schedule
  }

  const generateReminders = () => {
    const reminders = []

    if (reminderSettings.waterReminder) {
      reminders.push(
        { time: "08:00", message: "記得喝第一杯水！", type: "hydration" },
        { time: "10:00", message: "該補充水分了", type: "hydration" },
        { time: "14:00", message: "下午記得喝水", type: "hydration" },
        { time: "16:00", message: "再喝一杯水吧", type: "hydration" },
        { time: "18:00", message: "晚餐前喝杯水", type: "hydration" },
      )
    }

    if (reminderSettings.exerciseReminder) {
      reminders.push(
        { time: "07:00", message: "開始今天的晨間運動！", type: "exercise" },
        { time: "20:00", message: "該進行晚間運動了", type: "exercise" },
      )
    }

    if (reminderSettings.mealReminder) {
      reminders.push(
        { time: "08:00", message: "享用健康早餐", type: "nutrition" },
        { time: "12:00", message: "午餐時間到了", type: "nutrition" },
        { time: "18:30", message: "準備健康晚餐", type: "nutrition" },
      )
    }

    if (reminderSettings.sleepReminder) {
      reminders.push(
        { time: "21:30", message: "準備放鬆，即將就寢", type: "sleep" },
        { time: "22:00", message: "該上床睡覺了", type: "sleep" },
      )
    }

    return reminders
  }

  const renderHealthPlanGenerator = () => (
    <div className="space-y-6">
      {!planGenerated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="mr-2 h-5 w-5 text-teal-600" />
              智能健康計畫生成
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 從健康管理系統獲取的數據展示 */}
            <div className="bg-teal-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3 flex items-center">
                <UserCircle className="mr-2 h-4 w-4 text-teal-600" />
                您的健康數據概覽
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

            {/* 健康目標選擇 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Target className="mr-2 h-5 w-5 text-teal-600" />
                選擇您的健康目標
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  {
                    id: "減重",
                    label: "減重",
                    desc: "降低體重和BMI",
                    recommended: mockHealthData.personalInfo.bmi > 24,
                  },
                  {
                    id: "控糖",
                    label: "血糖控制",
                    desc: "穩定血糖水平",
                    recommended: mockHealthData.healthHistory.includes("家族糖尿病史"),
                  },
                  {
                    id: "降血壓",
                    label: "降血壓",
                    desc: "改善心血管健康",
                    recommended: mockHealthData.healthMetrics.bloodPressure.systolic > 120,
                  },
                  { id: "增肌", label: "增肌塑形", desc: "增加肌肉量", recommended: false },
                  {
                    id: "改善睡眠",
                    label: "改善睡眠",
                    desc: "提升睡眠品質",
                    recommended: mockHealthData.healthMetrics.sleepHours < 7,
                  },
                  {
                    id: "增強體能",
                    label: "增強體能",
                    desc: "提升運動表現",
                    recommended: mockHealthData.healthMetrics.stepsPerDay < 8000,
                  },
                ].map((goal) => (
                  <div key={goal.id} className="relative">
                    <div
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        userGoals.includes(goal.id)
                          ? "border-teal-500 bg-teal-50"
                          : "border-gray-200 hover:border-teal-300"
                      }`}
                      onClick={() => {
                        if (userGoals.includes(goal.id)) {
                          setUserGoals(userGoals.filter((g) => g !== goal.id))
                        } else {
                          setUserGoals([...userGoals, goal.id])
                        }
                      }}
                    >
                      {goal.recommended && (
                        <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs">推薦</Badge>
                      )}
                      <h4 className="font-medium">{goal.label}</h4>
                      <p className="text-xs text-gray-500 mt-1">{goal.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 目標設定 */}
            {userGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">目標設定</h3>
                <div className="space-y-4">
                  {userGoals.includes("減重") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>目標體重 (kg)</Label>
                        <Input
                          type="number"
                          placeholder="例如: 60"
                          value={targetSettings.targetWeight || ""}
                          onChange={(e) => setTargetSettings({ ...targetSettings, targetWeight: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>達成時間</Label>
                        <Select
                          value={targetSettings.timeframe || ""}
                          onValueChange={(value) => setTargetSettings({ ...targetSettings, timeframe: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇時間" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3months">3個月</SelectItem>
                            <SelectItem value="6months">6個月</SelectItem>
                            <SelectItem value="1year">1年</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {userGoals.includes("降血壓") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>目標收縮壓 (mmHg)</Label>
                        <Input
                          type="number"
                          placeholder="例如: 120"
                          value={targetSettings.targetSystolic || ""}
                          onChange={(e) => setTargetSettings({ ...targetSettings, targetSystolic: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>目標舒張壓 (mmHg)</Label>
                        <Input
                          type="number"
                          placeholder="例如: 80"
                          value={targetSettings.targetDiastolic || ""}
                          onChange={(e) => setTargetSettings({ ...targetSettings, targetDiastolic: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {userGoals.includes("控糖") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>目標空腹血糖 (mg/dL)</Label>
                        <Input
                          type="number"
                          placeholder="例如: 90"
                          value={targetSettings.targetBloodSugar || ""}
                          onChange={(e) => setTargetSettings({ ...targetSettings, targetBloodSugar: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>目標糖化血色素 (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="例如: 5.5"
                          value={targetSettings.targetHbA1c || ""}
                          onChange={(e) => setTargetSettings({ ...targetSettings, targetHbA1c: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 提醒設定 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Bell className="mr-2 h-5 w-5 text-teal-600" />
                健康提醒設定
              </h3>
              <div className="space-y-3">
                {[
                  { key: "waterReminder", label: "喝水提醒", desc: "定時提醒補充水分" },
                  { key: "exerciseReminder", label: "運動提醒", desc: "提醒進行運動" },
                  { key: "mealReminder", label: "用餐提醒", desc: "提醒用餐時間" },
                  { key: "sleepReminder", label: "睡眠提醒", desc: "提醒就寢時間" },
                  { key: "medicationReminder", label: "用藥提醒", desc: "提醒服藥時間" },
                ].map((reminder) => (
                  <div key={reminder.key} className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">{reminder.label}</Label>
                      <p className="text-sm text-gray-500">{reminder.desc}</p>
                    </div>
                    <Switch
                      checked={reminderSettings[reminder.key]}
                      onCheckedChange={(checked) =>
                        setReminderSettings({ ...reminderSettings, [reminder.key]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Button
                onClick={generateHealthPlan}
                disabled={userGoals.length === 0}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Zap className="mr-2 h-4 w-4" />
                生成個人化健康計畫
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 計畫概覽 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
                  計畫生成成功
                </span>
                <Badge className="bg-teal-100 text-teal-800">{generatedPlan?.title}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">您的個人化健康計畫已準備就緒！</h3>
                <p className="text-sm text-gray-700 mb-3">
                  基於您的健康數據和目標，我們為您制定了為期{generatedPlan?.duration}的分階段健康計畫。
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {generatedPlan?.stages.map((stage, index) => (
                    <div key={stage.id} className="bg-white p-3 rounded border">
                      <h4 className="font-medium text-sm">{stage.name}</h4>
                      <p className="text-xs text-gray-500">{stage.duration}</p>
                      <p className="text-xs mt-1">{stage.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 計畫排程建議 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-teal-600" />
                計畫排程建議
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(generatedPlan?.dailySchedule || {}).map(([period, tasks]) => (
                  <div key={period} className="space-y-3">
                    <h4 className="font-medium capitalize flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-400" />
                      {period === "morning" ? "早晨時段" : period === "afternoon" ? "下午時段" : "晚上時段"}
                    </h4>
                    <div className="grid gap-2">
                      {tasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono text-sm text-teal-600">{task.time}</span>
                            <span>{task.task}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{task.duration}</Badge>
                            <Badge variant="secondary" className="text-xs">
                              {task.type === "hydration"
                                ? "💧"
                                : task.type === "exercise"
                                  ? "🏃"
                                  : task.type === "nutrition"
                                    ? "🥗"
                                    : task.type === "sleep"
                                      ? "😴"
                                      : "📋"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 健康提醒設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5 text-teal-600" />
                健康計畫提醒
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  已為您設定 {generatedPlan?.reminders?.length || 0} 個每日提醒，幫助您保持計畫執行。
                </p>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {generatedPlan?.reminders?.map((reminder, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div className="flex items-center space-x-2">
                        <Timer className="h-4 w-4 text-gray-400" />
                        <span className="font-mono">{reminder.time}</span>
                        <span>{reminder.message}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {reminder.type === "hydration"
                          ? "💧"
                          : reminder.type === "exercise"
                            ? "🏃"
                            : reminder.type === "nutrition"
                              ? "🥗"
                              : reminder.type === "sleep"
                                ? "😴"
                                : "📋"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button onClick={() => setActiveTab("tracking")} className="bg-teal-600 hover:bg-teal-700">
              開始執行計畫
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const renderProgressTracking = () => (
    <div className="space-y-6">
      {/* 整體進度概覽 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5 text-teal-600" />
              執行進度概覽
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* 階段進度 */}
              <div className="space-y-4">
                <h4 className="font-medium">階段完成狀況</h4>
                {stageProgressData.map((stage, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{stage.stage}</span>
                        <Badge
                          variant={
                            stage.status === "completed"
                              ? "default"
                              : stage.status === "active"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            stage.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : stage.status === "active"
                                ? "bg-blue-100 text-blue-800"
                                : ""
                          }
                        >
                          {stage.status === "completed" ? "已完成" : stage.status === "active" ? "進行中" : "待開始"}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">{stage.progress}%</span>
                    </div>
                    <Progress value={stage.progress} className="h-3" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium">{stage.target}</p>
                      <div className="mt-1 space-y-1">
                        {stage.achievements.map((achievement, i) => (
                          <p key={i} className="text-xs">
                            {achievement}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 今日任務狀態 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListTodo className="mr-2 h-5 w-5 text-teal-600" />
              今日任務狀態
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { task: "喝水", completed: 6, target: 8, unit: "杯", color: "blue" },
                { task: "有氧運動", completed: 25, target: 30, unit: "分鐘", color: "green" },
                { task: "睡眠", completed: 7, target: 8, unit: "小時", color: "purple" },
                { task: "健康飲食", completed: 2, target: 3, unit: "餐", color: "orange" },
              ].map((task, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm">{task.task}</span>
                    <span className="text-xs text-gray-500">
                      {task.completed}/{task.target} {task.unit}
                    </span>
                  </div>
                  <Progress value={(task.completed / task.target) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 生理數據變化趨勢 */}
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

      {/* 智能助理按鈕 */}
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

                {isLoading && (
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
                <Button type="submit" disabled={isLoading || !input}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )

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
