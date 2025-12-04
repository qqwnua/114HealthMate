"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Activity,
  Calendar,
  Brain,
  FileText,
  Pill,
  HelpCircle,
  ArrowRight,
  PlayCircle,
} from "lucide-react"

interface GuideItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  steps: {
    title: string
    content: string
  }[]
}

interface FeatureGuideProps {
  onStartFeature?: (featureId: string) => void
}

export function FeatureGuide({ onStartFeature }: FeatureGuideProps) {
  const [open, setOpen] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<GuideItem | null>(null)

  const guides: Record<string, GuideItem[]> = {
    main: [
      {
        id: "consultation",
        title: "醫病諮詢語言模型", // 保持不變
        description: "AI驅動的健康諮詢，提供醫療建議與解答", // 強調多媒體輸入和紀錄保存
        icon: <MessageSquare className="h-6 w-6 text-teal-600" />,
        steps: [
          { title: "開始對話與輸入方式", content: "點擊「對話諮詢」頁籤，可輸入文字描述您的症狀或問題。" },
          { title: "獲取 AI 專業建議", content: "AI 將即時分析您的情況，並提供建議或下一步行動指引。" },
          { title: "模型選擇與警告", content: "您可以切換 LLM 模型，但中途切換可能會導致 AI 忘記部分先前的對話脈絡。" },
          { title: "保存與回顧紀錄", content: "點擊「保存」按鈕儲存對話，隨時在「諮詢歷史」中回顧，並在「關鍵字分析」中查看重點。" },
        ],
      },
      {
        id: "health-management",
        title: "個人化健康管理", // 調整標題，強調分析
        description: "健康趨勢追蹤與解讀、風險評估", // 聚焦核心數據與 AI 風險評估
        icon: <Activity className="h-6 w-6 text-blue-600" />,
        steps: [
          { title: "記錄健康數據", content: "在「健康儀表板」中，點擊按鈕記錄您的血壓、血糖、血脂或體重數據。" },
          { title: "查看儀表板與趨勢", content: "在「健康儀表板」中，查看數據最新值與變化趨勢。" },
          { title: "獲取風險評估", content: "切換至「風險評估」頁籤，獲取代謝症候群、糖尿病、高血壓等項目的 AI 分析結果。" },
          { title: "接收改善建議", content: "根據風險評估結果，接收 AI 提供的個人化預防與改善建議。" },
        ],
      },
      {
        id: "health-plan",
        title: "生成健康計畫", // 調整標題，強調追蹤
        description: "根據個人需求生成客製化健康計畫", // 納入排程和智能助理
        icon: <Calendar className="h-6 w-6 text-purple-600" />,
        steps: [
          { title: "設定個人目標", content: "輸入您的具體健康目標，例如減重、控糖或增肌等。" },
          { title: "生成計畫與排程", content: "系統會結合您的健康檔案，生成多點建議與詳細的執行排程。" },
          { title: "保存與提醒", content: "將生成的排程儲存至系統，以便您在提醒列表中追蹤與執行。" },
        ],
      },
      {
        id: "psychological",
        title: "心理諮詢",
        description: "情緒評估、風險分析與心靈便箋記錄",
        icon: <Brain className="h-6 w-6 text-amber-600" />,
        steps: [
          { title: "情緒評估", content: "完成情緒評估問卷，了解您當前的心理狀態。" },
          { title: "心靈便箋", content: "記錄您的想法和感受，可添加文字、圖片或語音。" },
          { title: "查看分析", content: "系統會分析您的情緒趨勢和潛在風險。" },
          { title: "獲取建議", content: "根據分析結果，獲取個人化的心理健康建議。" },
        ],
      },
      // {
      //   id: "resources",
      //   title: "醫療資源引導",
      //   description: "醫療資料搜索、醫療用語解析與看診輔助",
      //   icon: <FileText className="h-6 w-6 text-indigo-600" />,
      //   steps: [
      //     { title: "搜索醫療資訊", content: "輸入關鍵字搜索相關醫療資訊和專業知識。" },
      //     { title: "醫療用語解析", content: "上傳或輸入醫療用語，獲取淺顯易懂的解釋。" },
      //     { title: "查看醫療記錄", content: "上傳和管理您的醫療記錄，方便就診時查閱。" },
      //     { title: "看診輔助", content: "生成看診問題清單，幫助您與醫生有效溝通。" },
      //   ],
      // },
      // {
      //   id: "collaboration",
      //   title: "診療合作",
      //   description: "醫療支援地圖、診所預約與線上診療諮詢",
      //   icon: <Pill className="h-6 w-6 text-cyan-600" />,
      //   steps: [
      //     { title: "查找醫療資源", content: "使用醫療支援地圖查找附近的醫療機構。" },
      //     { title: "預約診所", content: "選擇合適的診所和時間進行預約。" },
      //     { title: "線上諮詢", content: "與醫療專業人員進行線上諮詢。" },
      //     { title: "分享健康數據", content: "安全地分享您的健康數據給醫療專業人員。" },
      //   ],
      // },
    ],
  }

  const handleOpenGuide = (guide: GuideItem) => {
    setSelectedGuide(guide)
  }

  const handleCloseGuide = () => {
    setSelectedGuide(null)
  }

  const handleStartFeature = (featureId: string) => {
    // 關閉所有對話框
    setSelectedGuide(null)
    setOpen(false)

    // 調用父組件的回調函數來切換到對應功能
    if (onStartFeature) {
      onStartFeature(featureId)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="text-teal-600 hover:text-teal-800 hover:bg-teal-50"
      >
        <HelpCircle size={20} />
      </Button>

      {/* 功能選擇對話框 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-teal-600 flex items-center gap-2">
              <HelpCircle className="h-6 w-6" /> 功能教學指南
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="main" className="mt-4">
            <TabsList className="grid grid-cols-1 mb-4">
              <TabsTrigger value="main">主要功能</TabsTrigger>
            </TabsList>

            <TabsContent value="main" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {guides.main.map((guide) => (
                <Card key={guide.id} className="hover:border-teal-300 hover:shadow-md transition-all cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {guide.icon}
                      <CardTitle className="text-lg">{guide.title}</CardTitle>
                    </div>
                    <CardDescription>{guide.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="pt-0">
                    <Button
                      variant="ghost"
                      className="text-teal-600 p-0 hover:text-teal-800 hover:bg-transparent"
                      onClick={() => handleOpenGuide(guide)}
                    >
                      查看教學 <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 教學步驟對話框 */}
      <Dialog open={!!selectedGuide} onOpenChange={() => handleCloseGuide()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {selectedGuide?.icon}
              {selectedGuide?.title}教學
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {selectedGuide?.steps.map((step, index) => (
              <div key={index} className="mb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-600 font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-medium">{step.title}</h3>
                </div>
                <p className="text-gray-600 ml-11">{step.content}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={handleCloseGuide}>
              關閉
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => selectedGuide && handleStartFeature(selectedGuide.id)}
            >
              <PlayCircle className="mr-2 h-4 w-4" /> 開始使用
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
