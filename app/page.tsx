"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { MedicalConsultation } from "@/components/medical-consultation"
import { HealthManagement } from "@/components/health-management"
import { HealthPlanReminder } from "@/components/health-plan-reminder"
import { MedicalResources } from "@/components/medical-resources"
import { MessageSquare, Activity, User, Calendar, FileText, Pill, Bell, Brain, Settings } from "lucide-react"
import { HealthPlanGenerator } from "@/components/health-plan-generator"
import { TreatmentCollaboration } from "@/components/treatment-collaboration"
import { Button } from "@/components/ui/button"
import { PsychologicalConsultation } from "@/components/psychological-consultation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { FeatureGuide } from "@/components/feature-guide"
import { PersonalizationSettings } from "@/components/personalization-settings"

export default function Home() {
  const [activeComponent, setActiveComponent] = useState<string | null>(null)
  const [personalizationSettingsOpen, setPersonalizationSettingsOpen] = useState(false)

  // 返回主介面
  const handleBackToMain = () => {
    setActiveComponent(null)
  }

  // 渲染主介面
  const renderMainInterface = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FunctionCard
          icon={<MessageSquare className="h-8 w-8 text-teal-600" />}
          title="醫病諮詢語言模型"
          description="AI驅動的健康諮詢，提供醫療建議與解答"
          onClick={() => setActiveComponent("consultation")}
        />

        <FunctionCard
          icon={<Activity className="h-8 w-8 text-blue-600" />}
          title="個人化健康管理"
          description="健康數據追蹤、健檢報告解讀與異常監控"
          onClick={() => setActiveComponent("health-management")}
        />

        <FunctionCard
          icon={<Calendar className="h-8 w-8 text-purple-600" />}
          title="生成健康計畫"
          description="根據個人需求生成客製化健康計畫與目標設定"
          onClick={() => setActiveComponent("health-plan")}
        />

        <FunctionCard
          icon={<Brain className="h-8 w-8 text-amber-600" />}
          title="心理諮詢"
          description="情緒評估、風險分析與心靈便箋記錄"
          onClick={() => setActiveComponent("psychological")}
        />

        <FunctionCard
          icon={<FileText className="h-8 w-8 text-indigo-600" />}
          title="醫療資源引導"
          description="醫療資料搜索、醫療用語解析與看診輔助"
          onClick={() => setActiveComponent("resources")}
        />

        <FunctionCard
          icon={<Pill className="h-8 w-8 text-cyan-600" />}
          title="診療合作"
          description="醫療支援地圖、診所預約與線上診療諮詢"
          onClick={() => setActiveComponent("collaboration")}
        />
      </div>
    )
  }

  // 根據選擇的功能渲染對應組件
  const renderComponent = () => {
    switch (activeComponent) {
      case "consultation":
        return <MedicalConsultation />
      case "health-management":
        return <HealthManagement />
      case "health-plan":
        return <HealthPlanGenerator />
      case "psychological":
        return <PsychologicalConsultation />
      case "resources":
        return <MedicalResources />
      case "collaboration":
        return <TreatmentCollaboration />
      case "reminders":
        return <HealthPlanReminder />
      default:
        return renderMainInterface()
    }
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-teal-600 mr-4">HealthMate</h1>
          {activeComponent && (
            <Button variant="ghost" onClick={handleBackToMain} className="text-teal-600">
              返回主頁
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <FeatureGuide />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-teal-600 hover:text-teal-800 relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  3
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setActiveComponent("reminders")}>
                <Bell className="mr-2 h-4 w-4" />
                <span>健康計畫提醒</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-teal-600 hover:text-teal-800">
                <User size={20} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium">王小明</div>
              <div className="px-2 py-1.5 text-xs text-gray-500">wang.xiaoming@email.com</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setPersonalizationSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                <span>個人化設定</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="p-4">{renderComponent()}</CardContent>
      </Card>

      <PersonalizationSettings open={personalizationSettingsOpen} onOpenChange={setPersonalizationSettingsOpen} />
    </div>
  )
}

// 功能卡片組件
function FunctionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <div
      className="function-card border rounded-lg p-6 hover:border-teal-300 hover:shadow-md transition-all cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center">
        <div className="icon-container mb-4 p-3 bg-gray-50 rounded-full">{icon}</div>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  )
}
