"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Mic, ImageIcon, Send, Info, AlertTriangle, Save, Trash2, FolderOpen } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type HistoryRecord = {
  id: string
  date: Date
  messages: Message[]
  keywords: string[]
}

export function MedicalConsultation() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("chat")
  const [isLoadedFromHistory, setIsLoadedFromHistory] = useState(false)
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<"llama" | "gpt" | "auto">("auto")
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const toggleVoiceInput = () => {
    setIsVoiceInput(!isVoiceInput)
  }

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveChat = () => {
    if (messages.length === 0) return

    const keywords = ["頭痛", "血壓", "飲食建議"] // 可自動產生或用AI分析

    if (currentRecordId) {
      // 更新既有歷史紀錄
      setHistory(prev =>
        prev.map(record =>
          record.id === currentRecordId
            ? { ...record, messages: [...messages], keywords }
            : record
        )
      )
    } else {
      // 新增歷史紀錄
      const newRecord: HistoryRecord = {
        id: Date.now().toString(),
        date: new Date(),
        messages: [...messages],
        keywords,
      }
      setHistory(prev => [newRecord, ...prev])
      setCurrentRecordId(newRecord.id)
    }

    setSaveSuccess(true)
  }

  const handleEndConsultation = () => {
  setMessages([])
  setCurrentRecordId(null)
  setSaveSuccess(false)
  }

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleEndClick = () => {
    if (!saveSuccess) {
      setEndDialogOpen(true)
    } else {
      handleEndConsultation()
    }
  }

  const handleOpenHistory = (record: HistoryRecord) => {
    setMessages(record.messages)
    setActiveTab("chat")
    setCurrentRecordId(record.id)
  }

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      setHistory((prev) => prev.filter((record) => record.id !== recordToDelete))
      setRecordToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { role: "user", content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      setLoadingMessage("正在分析中...")

      // 🔥 新版 API：語義分析
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      })

      if (!analyzeResponse.ok) throw new Error(`分析失敗：${analyzeResponse.status}`)
      const analyzeData = await analyzeResponse.json()

      setLoadingMessage("生成回覆中...")

      // 🔥 新版 API：生成回覆
      const respondResponse = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          analysis: analyzeData.analysis,
          model: selectedModel, // <── 關鍵：根據使用者選擇的模型
          history: messages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!respondResponse.ok) throw new Error(`回應生成失敗：${respondResponse.status}`)

      const respondData = await respondResponse.json()
      const assistantMessage: Message = {
        role: "assistant",
        content: respondData.reply || respondData.message || "抱歉，目前無法生成回覆。",
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error("❌ 錯誤:", err)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "抱歉，目前無法連線到服務。", timestamp: new Date() },
      ])
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  const suggestedQuestions = [
    "我最近頭痛很嚴重，可能是什麼原因？",
    "高血壓患者的飲食建議",
    "如何改善睡眠質量？",
    "運動後肌肉酸痛如何緩解？",
  ]

  return (
    <div className="flex flex-col min-h-[80vh]">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">醫病諮詢語言模型</CardTitle>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Info size={16} className="mr-2" />
          <span>此系統提供的建議僅供參考，不能替代專業醫療診斷</span>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="chat">對話諮詢</TabsTrigger>
          <TabsTrigger value="history">諮詢歷史</TabsTrigger>
          <TabsTrigger value="keywords">關鍵字分析</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex flex-col">
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium text-sm mb-3">選擇 AI 模型</h3>
            <RadioGroup
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value as "llama" | "gpt" | "auto")}
            >
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="auto" id="auto" className="mt-1" />
                  <Label htmlFor="auto" className="cursor-pointer flex-1">
                    <div className="font-medium">自動選擇（推薦）</div>
                    <div className="text-xs text-gray-600 mt-1">系統會分析訊息內容與語氣，自動挑選最適合的模型</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="gpt" id="gpt" className="mt-1" />
                  <Label htmlFor="gpt" className="cursor-pointer flex-1">
                    <div className="font-medium">GPT</div>
                    <div className="text-xs text-gray-600 mt-1">回答最詳細、邏輯完整，但生成速度較慢</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="llama" id="llama" className="mt-1" />
                  <Label htmlFor="llama" className="cursor-pointer flex-1">
                    <div className="font-medium">LLaMA</div>
                    <div className="text-xs text-gray-600 mt-1">生成速度快、回答精簡，適合短問題</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-md">
            {messages.length === 0 && (
              <div className="text-center p-4">
                <h3 className="font-medium text-lg mb-2">歡迎使用醫療諮詢助手</h3>
                <p className="text-gray-500 mb-4">您可以詢問任何健康相關的問題，我會盡力提供幫助</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-2 bg-transparent"
                      onClick={() => setInput(question)}
                    >
                      {question}
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
                  {message.content}
                  {message.role === "assistant" && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["血壓", "頭痛", "飲食建議"].map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className={`text-xs mt-2 ${message.role === "user" ? "text-teal-100" : "text-gray-500"}`}>
                    {message.timestamp
                      .toLocaleString("zh-TW", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })
                      .replace(/\//g, "/")
                      .replace(",", "")}
                  </div>
                </div>
              </div>
            ))}

            {uploadedImage && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg overflow-hidden">
                  <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded" className="max-h-40 object-contain" />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100">
                  {loadingMessage && <p className="text-sm text-gray-600 mb-2">{loadingMessage}</p>}
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-auto">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
              {isVoiceInput ? (
                <div className="border rounded-md p-4 text-center">
                  <p>正在聆聽您的聲音...</p>
                  <Button type="button" variant="outline" className="mt-2 bg-transparent" onClick={toggleVoiceInput}>
                    停止錄音
                  </Button>
                </div>
              ) : (
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="請描述您的症狀或健康問題..."
                  className="min-h-[100px]"
                />
              )}

              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="icon" onClick={toggleVoiceInput}>
                    <Mic size={18} />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleFileButtonClick}>
                    <ImageIcon size={18} />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  {saveSuccess && <span className="text-sm text-green-600 font-medium">已儲存</span>}
                  <Button type="button" variant="outline" onClick={handleSaveChat} disabled={messages.length === 0}>
                    <Save size={18} className="mr-2" />
                    儲存
                  </Button>
                  <Button type="submit" disabled={isLoading || (!input && !uploadedImage)}>
                    <Send size={18} className="mr-2" />
                    發送
                  </Button>
                </div>
              </div>
            </form>

            {messages.length > 0 && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={handleEndClick}
                >
                  結束諮詢
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            {history.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <p>尚無諮詢歷史記錄</p>
              </div>
            ) : (
              history.map((record) => (
                <div key={record.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium">
                        {record.date
                          .toLocaleString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })
                          .replace(/\//g, "/")
                          .replace(",", "")}{" "}
                        諮詢記錄
                      </h3>
                      <div className="flex gap-1 mt-1">
                        {record.keywords.map((keyword, i) => (
                          <Badge key={i}>{keyword}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(record.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {record.messages[0]?.content.substring(0, 50)}
                    {record.messages[0]?.content.length > 50 ? "..." : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">共 {record.messages.length} 則訊息</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full bg-transparent"
                    onClick={() => handleOpenHistory(record)}
                  >
                    <FolderOpen size={16} className="mr-2" />
                    開啟
                  </Button>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="keywords">
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">常見關鍵字分析</h3>
              <div className="flex flex-wrap gap-2">
                {["頭痛", "過敏", "血壓", "睡眠", "飲食", "運動", "壓力", "感冒", "消化", "皮膚"].map((keyword, i) => (
                  <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">您的常見關鍵字</h3>
              <div className="flex flex-wrap gap-2">
                {["頭痛", "血壓", "睡眠", "壓力"].map((keyword, i) => (
                  <Badge key={i} className="text-sm py-1 px-3 bg-teal-100 text-teal-800 hover:bg-teal-200">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
        <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5" />
        <p className="text-sm text-amber-800">
          請注意：本系統提供的建議僅供參考，不能替代專業醫療診斷。如有緊急情況，請立即就醫或撥打急救電話。
        </p>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>您確定要刪除此諮詢記錄嗎？此操作無法復原。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>尚未儲存紀錄</AlertDialogTitle>
            <AlertDialogDescription>
              您尚未儲存本次對話內容，若結束諮詢，聊天紀錄將不會被保存。
              確定要結束嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleEndConsultation()
                setEndDialogOpen(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              確定結束
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
