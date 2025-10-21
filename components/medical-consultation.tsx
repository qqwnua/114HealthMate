"use client"

import React, { useEffect, useRef, useState } from "react"

// shadcn/ui
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// icons
import { Mic, Image as ImageIcon, Send, Info, AlertTriangle, Save, Trash2, FolderOpen, Zap, Brain, Sparkles, ArrowLeft, History } from "lucide-react"

// 🔥 新增：簡單的 Markdown 渲染函數
const renderMarkdown = (text: string) => {
  return text
    // 粗體
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 標題
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-3 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
    // 列表
    .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
    // 程式碼
    .replace(/`(.+?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
    // 換行
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

// ------------------------------------
// Types
// ------------------------------------

type Role = "user" | "assistant"

type Message = {
  role: Role
  content: string
  timestamp: Date
}

type HistoryRecord = {
  id: string
  date: Date
  messages: Message[]
  keywords: string[]
}

type Analysis = {
  keywords: string[]
  outline: string[]
  sentiment: number
  polarity: "positive" | "neutral" | "negative"
  risk_score?: number
  urgency_level?: "low" | "medium" | "high"
  categories?: string[]
}

type ModelChoice = "llama" | "gpt" | "auto"

type ChatRoom = {
  id: string
  name: string
  model: ModelChoice
  createdAt: Date
  messages: Message[]
  keywords: Map<string, number>
}

// ------------------------------------
// Component
// ------------------------------------

export function MedicalConsultation() {
  // 🔥 新增：模型選擇狀態
  const [hasSelectedModel, setHasSelectedModel] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto")
  
  // 🔥 新增：聊天室管理
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

  // Chat & UI
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [activeTab, setActiveTab] = useState("chat")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isVoiceInput, setIsVoiceInput] = useState(false)

  // History
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)

  // Analysis & keywords
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null)
  const [keywordCounts, setKeywordCounts] = useState<Map<string, number>>(new Map())

  // End consultation guard
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  
  // 🔥 新增：歷史記錄對話框
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)

  // File & scroll
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const suggestedQuestions = [
    "我最近頭痛很嚴重，可能是什麼原因？",
    "高血壓患者的飲食建議",
    "如何改善睡眠質量？",
    "運動後肌肉酸痛如何緩解？",
  ]

  // 模型資訊
  const modelInfo = {
    auto: {
      name: "智能推薦",
      icon: <Sparkles className="w-6 h-6" />,
      description: "自動選擇最適合的模型",
      detail: "使用 Llama 3.1 8B，速度與品質兼顧",
      color: "bg-gradient-to-br from-purple-500 to-pink-500",
    },
    llama: {
      name: "LLaMA 極速",
      icon: <Zap className="w-6 h-6" />,
      description: "最快的回應速度",
      detail: "Llama 3.1 8B Instant - 適合快速諮詢",
      color: "bg-gradient-to-br from-blue-500 to-cyan-500",
    },
    gpt: {
      name: "GPT-OSS 專業",
      icon: <Brain className="w-6 h-6" />,
      description: "OpenAI 開源版最詳細分析",
      detail: "GPT-OSS 120B (Groq) - 深度醫療諮詢",
      color: "bg-gradient-to-br from-green-500 to-emerald-500",
    },
  }

  // ------------------------------------
  // 🔥 聊天室管理函數
  // ------------------------------------

  const createNewChatRoom = (model: ModelChoice) => {
    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: `${modelInfo[model].name} - ${new Date().toLocaleString("zh-TW", { 
        month: "2-digit", 
        day: "2-digit", 
        hour: "2-digit", 
        minute: "2-digit" 
      })}`,
      model,
      createdAt: new Date(),
      messages: [],
      keywords: new Map(),
    }
    
    setChatRooms(prev => [newRoom, ...prev])
    setCurrentRoomId(newRoom.id)
    setSelectedModel(model)
    setHasSelectedModel(true)
    setMessages([])
    setKeywordCounts(new Map())
    setLastAnalysis(null)
  }

  const switchChatRoom = (roomId: string) => {
    const room = chatRooms.find(r => r.id === roomId)
    if (room) {
      setCurrentRoomId(roomId)
      setMessages(room.messages)
      setKeywordCounts(room.keywords)
      setSelectedModel(room.model)
      setHasSelectedModel(true)
      setActiveTab("chat")
    }
  }

  const deleteChatRoom = (roomId: string) => {
    setChatRooms(prev => prev.filter(r => r.id !== roomId))
    if (currentRoomId === roomId) {
      setHasSelectedModel(false)
      setMessages([])
      setCurrentRoomId(null)
    }
  }

  const backToModelSelection = () => {
    // 儲存當前聊天室
    if (currentRoomId && messages.length > 0) {
      setChatRooms(prev => prev.map(room => 
        room.id === currentRoomId 
          ? { ...room, messages, keywords: keywordCounts }
          : room
      ))
    }
    setHasSelectedModel(false)
  }

  // ------------------------------------
  // Helpers
  // ------------------------------------

  const toggleVoiceInput = () => setIsVoiceInput((v) => !v)

  const accumulateKeywords = (arr: string[]) => {
    setKeywordCounts((prev) => {
      const next = new Map(prev)
      for (const k of arr) {
        const key = k.trim()
        if (!key) continue
        next.set(key, (next.get(key) || 0) + 1)
      }
      return next
    })
  }

  const handleFileButtonClick = () => fileInputRef.current?.click()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(String(ev.target?.result || ""))
    reader.readAsDataURL(file)
  }

  // ------------------------------------
  // Submit 流程
  // ------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() && !uploadedImage) return

    const userMessage: Message = { role: "user", content: input, timestamp: new Date() }
    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)
    setSaveSuccess(false)

    try {
      setLoadingMessage("正在分析中...")
      
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }),
      })

      if (!analyzeResponse.ok) {
        throw new Error(`分析失敗: ${analyzeResponse.status}`)
      }

      const analyzeData = await analyzeResponse.json()
      const analysis: Analysis = analyzeData.analysis || {
        keywords: [],
        outline: [],
        sentiment: 0.5,
        polarity: "neutral",
      }

      setLastAnalysis(analysis)
      accumulateKeywords(analysis.keywords || [])

      setLoadingMessage("生成回覆中...")

      const respondResponse = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          analysis: analysis,
          model: selectedModel,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!respondResponse.ok) {
        throw new Error(`回應生成失敗: ${respondResponse.status}`)
      }

      const respondData = await respondResponse.json()
      const assistantText = respondData.reply || respondData.message || "抱歉，暫時無法生成回應。"

      const assistantMessage: Message = { 
        role: "assistant", 
        content: assistantText, 
        timestamp: new Date() 
      }
      setMessages((prev) => [...prev, assistantMessage])

    } catch (error) {
      console.error("❌ 處理失敗:", error)
      
      const errorMessage: Message = {
        role: "assistant",
        content: "抱歉，目前無法連接到服務。請稍後再試。",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  // 自動儲存到聊天室
  useEffect(() => {
    if (currentRoomId && messages.length > 0) {
      setChatRooms(prev => prev.map(room => 
        room.id === currentRoomId 
          ? { ...room, messages, keywords: keywordCounts }
          : room
      ))
    }
  }, [messages, keywordCounts, currentRoomId])

  // History ops
  const handleOpenHistory = (record: HistoryRecord) => {
    setMessages(record.messages)
    setActiveTab("chat")
    const m = new Map<string, number>()
    for (const k of record.keywords) m.set(k, (m.get(k) || 0) + 1)
    setKeywordCounts(m)
    setSaveSuccess(true)
  }

  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (recordToDelete) setHistory((prev) => prev.filter((r) => r.id !== recordToDelete))
    setRecordToDelete(null)
    setDeleteDialogOpen(false)
  }

  const handleEndConsultation = () => {
    if (currentRoomId) {
      deleteChatRoom(currentRoomId)
    }
    setMessages([])
    setLastAnalysis(null)
    setKeywordCounts(new Map())
    setUploadedImage(null)
    setHasSelectedModel(false)
  }

  const handleEndClick = () => {
    setEndDialogOpen(true)
  }

  const sortedKeywords = Array.from(keywordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20)
  const currentRoom = chatRooms.find(r => r.id === currentRoomId)

  // ------------------------------------
  // 🔥 模型選擇畫面
  // ------------------------------------

  if (!hasSelectedModel) {
    return (
      <div className="flex flex-col min-h-[80vh]">
        <CardHeader className="px-0 text-center">
          <CardTitle className="text-2xl text-teal-600">醫療諮詢 AI 助手</CardTitle>
          <CardDescription className="text-base mt-2">請選擇您想使用的 AI 模型開始諮詢</CardDescription>
        </CardHeader>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
            {(Object.keys(modelInfo) as ModelChoice[]).map((model) => {
              const info = modelInfo[model]
              return (
                <Card 
                  key={model} 
                  className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-teal-500"
                  onClick={() => createNewChatRoom(model)}
                >
                  <CardContent className="p-6">
                    <div className={`${info.color} text-white rounded-2xl p-6 mb-4 flex items-center justify-center`}>
                      {info.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{info.name}</h3>
                    <p className="text-gray-600 mb-3">{info.description}</p>
                    <p className="text-sm text-gray-500">{info.detail}</p>
                    <Button className="w-full mt-4 bg-teal-600 hover:bg-teal-700">
                      選擇此模型
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* 歷史聊天室 */}
          {chatRooms.length > 0 && (
            <div className="w-full max-w-5xl px-4 mt-12">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">歷史對話</h3>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setHistoryDialogOpen(true)}
                >
                  <History className="w-4 h-4" />
                  查看全部 ({chatRooms.length})
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chatRooms.slice(0, 6).map((room) => (
                  <Card 
                    key={room.id} 
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-teal-500"
                    onClick={() => switchChatRoom(room.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`${modelInfo[room.model].color} text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center`}>
                            {React.cloneElement(modelInfo[room.model].icon, { className: "w-5 h-5" })}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{room.name}</h4>
                            <p className="text-xs text-gray-500">
                              {room.messages.length} 則訊息
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteChatRoom(room.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                      {room.messages.length > 0 && (
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {room.messages[0].content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
          <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5" />
          <p className="text-sm text-amber-800">
            請注意：本系統提供的建議僅供參考，不能替代專業醫療診斷。如有緊急情況，請立即就醫或撥打急救電話。
          </p>
        </div>
      </div>
    )
  }

  // ------------------------------------
  // 🔥 聊天室畫面
  // ------------------------------------

  return (
    <div className="flex flex-col min-h-[80vh]">
      <CardHeader className="px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={backToModelSelection}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <CardTitle className="text-xl text-teal-600 flex items-center gap-2">
                <div className={`${modelInfo[selectedModel].color} text-white rounded-lg p-2`}>
                  {React.cloneElement(modelInfo[selectedModel].icon, { className: "w-5 h-5" })}
                </div>
                {currentRoom?.name || modelInfo[selectedModel].name}
              </CardTitle>
              <div className="flex items-center mt-1 text-sm text-gray-500">
                <Info size={14} className="mr-1" />
                <span>{modelInfo[selectedModel].detail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 累積關鍵字 */}
        <div className="mt-3 border rounded-md p-3 bg-white">
          <div className="text-sm text-gray-600 mb-2">重點關鍵字（AI 分析）</div>
          {sortedKeywords.length === 0 ? (
            <div className="text-xs text-gray-400">開始對話後會自動分析關鍵字</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sortedKeywords.map(([k, c]) => (
                <Badge key={k} variant="secondary" className={`text-sm py-1 px-3 ${c >= 3 ? "font-semibold" : ""}`}>
                  {k} ({c})
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="chat">對話諮詢</TabsTrigger>
          <TabsTrigger value="keywords">關鍵字分析</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex flex-col flex-1">
          {/* 訊息區 */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-lg bg-white">
            {messages.length === 0 && (
              <div className="text-center p-2">
                <h3 className="font-medium text-lg mb-2">開始您的健康諮詢</h3>
                <p className="text-gray-500 mb-4">使用 {modelInfo[selectedModel].name} 為您服務</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {suggestedQuestions.map((q, i) => (
                    <Button key={i} variant="outline" className="justify-start text-left h-auto py-2" onClick={() => setInput(q)}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.role === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                  {/* 🔥 使用 Markdown 渲染 */}
                  <div 
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }}
                  />
                  <div className={`text-xs mt-2 ${m.role === "user" ? "text-teal-100" : "text-gray-500"}`}>
                    {m.timestamp.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}

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

          {/* 輸入列 */}
          <div className="mt-auto">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="請描述您的症狀或健康問題..."
                className="min-h-[100px]"
              />

              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="icon" onClick={toggleVoiceInput}>
                    <Mic size={18} />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleFileButtonClick}>
                    <ImageIcon size={18} />
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
                <div className="flex items-center space-x-2">
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send size={18} className="mr-2" />
                    發送
                  </Button>
                  {messages.length > 0 && (
                    <Button type="button" variant="outline" onClick={handleEndClick}>
                      結束
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords">
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-white">
              <h3 className="font-medium mb-2">本次對話關鍵字統計</h3>
              <p className="text-xs text-gray-500 mb-3">由 AI 自動分析提取的醫療相關關鍵字</p>
              <div className="flex flex-wrap gap-2">
                {sortedKeywords.length === 0 ? (
                  <div className="text-sm text-gray-400 py-4">開始對話後，AI 會自動分析並提取關鍵字</div>
                ) : (
                  sortedKeywords.map(([k, c]) => (
                    <Badge 
                      key={k} 
                      variant="secondary" 
                      className={`text-sm py-2 px-4 ${c >= 3 ? "font-semibold bg-teal-100 text-teal-800" : "bg-gray-100"}`}
                    >
                      {k} <span className="ml-1 text-xs opacity-70">×{c}</span>
                    </Badge>
                  ))
                )}
              </div>
            </div>

            {/* 如果有分析結果，顯示最新的分析 */}
            {lastAnalysis && (
              <div className="border rounded-md p-4 bg-gradient-to-br from-teal-50 to-cyan-50">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  最新 AI 分析結果
                </h3>
                <div className="space-y-3">
                  {/* 🔥 自殺風險警示 */}
                  {(lastAnalysis as any).suicide_risk && (
                    <div className="bg-red-100 border-2 border-red-500 rounded-lg p-3">
                      <p className="text-red-800 font-bold text-sm">
                        🚨 檢測到自殺風險
                      </p>
                      <p className="text-red-700 text-xs mt-1">
                        請立即撥打：<strong>1925（自殺防治專線）</strong>或 <strong>119</strong>
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-gray-600 mb-1">生命危險評估</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            (lastAnalysis.risk_score || 0) >= 0.8 ? "bg-red-600" :
                            (lastAnalysis.risk_score || 0) >= 0.6 ? "bg-red-500" :
                            (lastAnalysis.risk_score || 0) >= 0.4 ? "bg-yellow-500" :
                            "bg-green-500"
                          }`}
                          style={{ width: `${(lastAnalysis.risk_score || 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {((lastAnalysis.risk_score || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">情緒狀態</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            (lastAnalysis.sentiment || 0) <= 0.3 ? "bg-purple-600" :
                            (lastAnalysis.sentiment || 0) <= 0.5 ? "bg-blue-500" :
                            (lastAnalysis.sentiment || 0) <= 0.7 ? "bg-green-500" :
                            (lastAnalysis.sentiment || 0) <= 0.9 ? "bg-yellow-500" :
                            "bg-orange-500"
                          }`}
                          style={{ width: `${(lastAnalysis.sentiment || 0.5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {((lastAnalysis.sentiment || 0.5) * 100).toFixed(0)}%
                      </span>
                    </div>
                    {(lastAnalysis as any).emotion_state && (
                      <p className="text-xs text-gray-600 mt-1">
                        {(lastAnalysis as any).emotion_state}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">緊急程度</p>
                    <Badge 
                      className={
                        lastAnalysis.urgency_level === "high" ? "bg-red-500" :
                        lastAnalysis.urgency_level === "medium" ? "bg-yellow-500" :
                        "bg-green-500"
                      }
                    >
                      {lastAnalysis.urgency_level === "high" ? "⚠️ 高" :
                       lastAnalysis.urgency_level === "medium" ? "⚡ 中" :
                       "✓ 低"}
                    </Badge>
                  </div>

                  {lastAnalysis.categories && lastAnalysis.categories.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">涉及系統</p>
                      <div className="flex flex-wrap gap-1">
                        {lastAnalysis.categories.map(cat => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {lastAnalysis.outline && lastAnalysis.outline.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">分析大綱</p>
                      <ul className="text-sm space-y-1">
                        {lastAnalysis.outline.map((line, idx) => (
                          <li key={idx} className="text-gray-700">• {line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* 結束對話確認 */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>結束對話</AlertDialogTitle>
            <AlertDialogDescription>
              確定要結束此次諮詢嗎？對話記錄將保存在歷史中。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleEndConsultation()
                setEndDialogOpen(false)
              }}
              className="bg-teal-600 hover:bg-teal-700"
            >
              確定結束
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除歷史 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>確定要刪除此諮詢記錄嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🔥 新增：查看全部歷史記錄對話框 */}
      <AlertDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">所有對話記錄 ({chatRooms.length})</AlertDialogTitle>
            <AlertDialogDescription>
              點擊任一對話可以繼續之前的諮詢
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-3 py-4">
            {chatRooms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">尚無對話記錄</div>
            ) : (
              chatRooms.map((room) => (
                <div 
                  key={room.id} 
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    switchChatRoom(room.id)
                    setHistoryDialogOpen(false)
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`${modelInfo[room.model].color} text-white rounded-lg p-2 w-12 h-12 flex items-center justify-center flex-shrink-0`}>
                        {React.cloneElement(modelInfo[room.model].icon, { className: "w-6 h-6" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm mb-1">{room.name}</h4>
                        <p className="text-xs text-gray-500">
                          {room.createdAt.toLocaleString("zh-TW", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} · {room.messages.length} 則訊息
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteChatRoom(room.id)
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                  
                  {room.messages.length > 0 && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 line-clamp-2">
                      <strong>用戶：</strong>{room.messages[0].content}
                    </div>
                  )}
                  
                  {Array.from(room.keywords.keys()).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Array.from(room.keywords.keys()).slice(0, 5).map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>關閉</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}