"use client"

import React, { useEffect, useRef, useState } from "react"

// shadcn/ui components (assumes existing in project)
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
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
import { Mic, Image as ImageIcon, Send, Info, AlertTriangle, Save, Trash2, FolderOpen, ArrowLeft } from "lucide-react"

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
// Small markdown renderer (safe-ish, simple)
// ------------------------------------

const renderMarkdown = (text: string) => {
  if (!text) return ""
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-3 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

// ------------------------------------
// Component
// ------------------------------------

export const MedicalConsultation: React.FC = () => {
  // model & room selection
  const [hasSelectedModel, setHasSelectedModel] = useState(false)
  const [selectedModel, setSelectedModel] = useState<ModelChoice>("auto")

  // chat rooms
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([])
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null)

  // chat & ui
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [activeTab, setActiveTab] = useState("chat")
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // analysis & keywords
  const [lastAnalysis, setLastAnalysis] = useState<Analysis | null>(null)
  const [keywordCounts, setKeywordCounts] = useState<Map<string, number>>(new Map())

  // dialogs
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  // file & scroll
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

  const modelInfo: Record<ModelChoice, any> = {
    auto: {
      name: "智能推薦",
      description: "系統會根據訊息自動挑選模型",
      detail: "速度與品質兼顧",
    },
    llama: {
      name: "LLaMA",
      description: "回應快速、較簡潔",
      detail: "適合簡短問題",
    },
    gpt: {
      name: "GPT",
      description: "回應詳盡、邏輯完整",
      detail: "適合需要深度分析的問題",
    },
  }

  // helpers
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

  const createNewChatRoom = (model: ModelChoice) => {
    const newRoom: ChatRoom = {
      id: Date.now().toString(),
      name: `${modelInfo[model].name} - ${new Date().toLocaleString("zh-TW", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}`,
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
    setActiveTab("chat")
  }

  const switchChatRoom = (roomId: string) => {
    const room = chatRooms.find(r => r.id === roomId)
    if (room) {
      setCurrentRoomId(roomId)
      setMessages(room.messages)
      setKeywordCounts(new Map(room.keywords))
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
    // save current room messages
    if (currentRoomId) {
      setChatRooms(prev => prev.map(room => room.id === currentRoomId ? { ...room, messages, keywords: keywordCounts } : room))
    }
    setHasSelectedModel(false)
  }

  // file handlers
  const handleFileButtonClick = () => fileInputRef.current?.click()
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(String(ev.target?.result || ""))
    reader.readAsDataURL(file)
  }

  // submit flow (uses /api/analyze and /api/respond)
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() && !uploadedImage) return

    const userMessage: Message = { role: "user", content: input, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
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
      if (!analyzeResponse.ok) throw new Error(`分析失敗：${analyzeResponse.status}`)
      const analyzeData = await analyzeResponse.json()
      const analysis: Analysis = analyzeData.analysis || { keywords: [], outline: [], sentiment: 0.5, polarity: "neutral" }
      setLastAnalysis(analysis)
      accumulateKeywords(analysis.keywords || [])

      setLoadingMessage("生成回覆中...")
      const respondResponse = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, analysis, model: selectedModel, history: messages.map(m => ({ role: m.role, content: m.content })) }),
      })
      if (!respondResponse.ok) throw new Error(`回應生成失敗：${respondResponse.status}`)
      const respondData = await respondResponse.json()
      const assistantText = respondData.reply || respondData.message || "抱歉，暫時無法生成回應。"
      const assistantMessage: Message = { role: "assistant", content: assistantText, timestamp: new Date() }
      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: "assistant", content: "抱歉，目前無法連線到服務。", timestamp: new Date() }])
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
    }
  }

  // auto-save current room
  useEffect(() => {
    if (currentRoomId) {
      setChatRooms(prev => prev.map(room => room.id === currentRoomId ? { ...room, messages, keywords: keywordCounts } : room))
    }
  }, [messages, keywordCounts, currentRoomId])

  // history operations (persist snapshots)
  const handleSaveChat = () => {
    if (messages.length === 0) return
    const keywords = Array.from(keywordCounts.keys()).slice(0, 5)
    const newRecord: HistoryRecord = { id: Date.now().toString(), date: new Date(), messages: [...messages], keywords }
    setHistory(prev => [newRecord, ...prev])
    setSaveSuccess(true)
  }

  const handleOpenHistory = (record: HistoryRecord) => {
    setMessages(record.messages)
    setActiveTab("chat")
    setKeywordCounts(new Map(record.keywords.map(k => [k, 1])))
    setSaveSuccess(true)
  }

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (recordToDelete) setHistory(prev => prev.filter(r => r.id !== recordToDelete))
    setRecordToDelete(null)
    setDeleteDialogOpen(false)
  }

  const handleEndConsultation = () => {
    if (currentRoomId) deleteChatRoom(currentRoomId)
    setMessages([])
    setLastAnalysis(null)
    setKeywordCounts(new Map())
    setUploadedImage(null)
    setHasSelectedModel(false)
    setCurrentRoomId(null)
  }

  const handleEndClick = () => {
    // if not saved, show dialog
    if (!saveSuccess) setEndDialogOpen(true)
    else handleEndConsultation()
  }

  const sortedKeywords = Array.from(keywordCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20)
  const currentRoom = chatRooms.find(r => r.id === currentRoomId)

  // ------------------------------------
  // Model selection screen (kept minimal since user preferred original UI)
  // ------------------------------------
  if (!hasSelectedModel) {
    return (
      <div className="flex flex-col min-h-[80vh]">
        <CardHeader className="px-0 text-center">
          <CardTitle className="text-2xl text-teal-600">醫療諮詢 AI 助手</CardTitle>
        </CardHeader>

        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl px-4">
            {(Object.keys(modelInfo) as ModelChoice[]).map((m) => (
              <Card key={m} className="cursor-pointer hover:shadow-lg" onClick={() => createNewChatRoom(m)}>
                <CardContent className="p-4">
                  <div className="text-lg font-semibold mb-2">{modelInfo[m].name}</div>
                  <div className="text-sm text-gray-500 mb-3">{modelInfo[m].description}</div>
                  <div className="text-xs text-gray-400">{modelInfo[m].detail}</div>
                  <Button className="w-full mt-4" onClick={() => createNewChatRoom(m)}>選擇此模型</Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {chatRooms.length > 0 && (
            <div className="w-full max-w-4xl px-4 mt-8">
              <h3 className="text-lg font-semibold mb-2">歷史聊天室</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chatRooms.slice(0,6).map(room => (
                  <Card key={room.id} className="cursor-pointer" onClick={() => switchChatRoom(room.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{room.name}</div>
                          <div className="text-xs text-gray-500">{room.messages.length} 則訊息</div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteChatRoom(room.id) }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
          <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5" />
          <p className="text-sm text-amber-800">請注意：本系統提供的建議僅供參考，不能替代專業醫療診斷。如有緊急情況，請立即就醫或撥打急救電話。</p>
        </div>
      </div>
    )
  }

  // ------------------------------------
  // Main chat UI (preserve user UI look, add multi-room info)
  // ------------------------------------
  return (
    <div className="flex flex-col min-h-[80vh]">
      <CardHeader className="px-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={backToModelSelection}><ArrowLeft className="w-5 h-5" /></Button>
          <div>
            <CardTitle className="text-xl text-teal-600">{currentRoom?.name || modelInfo[selectedModel].name}</CardTitle>
            <div className="flex items-center mt-1 text-sm text-gray-500"><Info size={14} className="mr-1" />{modelInfo[selectedModel].detail}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => createNewChatRoom(selectedModel)}>新建聊天室</Button>
          <Button variant="outline" onClick={() => { setActiveTab('history') }}>歷史</Button>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="chat">對話諮詢</TabsTrigger>
          <TabsTrigger value="history">諮詢歷史</TabsTrigger>
          <TabsTrigger value="keywords">關鍵字分析</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex flex-col flex-1">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-md bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center p-4">
                <h3 className="font-medium text-lg mb-2">歡迎使用醫療諮詢助手</h3>
                <p className="text-gray-500 mb-4">您可以詢問任何健康相關的問題，我會盡力提供幫助</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {suggestedQuestions.map((q, i) => (
                    <Button key={i} variant="outline" className="justify-start text-left h-auto py-2" onClick={() => setInput(q)}>{q}</Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${m.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white text-gray-800 shadow-sm'}`}>
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
                  <div className={`text-xs mt-2 ${m.role === 'user' ? 'text-teal-100' : 'text-gray-500'}`}>{m.timestamp.toLocaleString("zh-TW", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}</div>
                </div>
              </div>
            ))}

            {uploadedImage && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg overflow-hidden">
                  <img src={uploadedImage} alt="Uploaded" className="max-h-40 object-contain" />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white">
                  {loadingMessage && <p className="text-sm text-gray-600 mb-2">{loadingMessage}</p>}
                  <div className="flex space-x-2"><div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce"/><div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]"/><div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]"/></div>
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
                  <Button type="button" variant="outline" className="mt-2" onClick={() => setIsVoiceInput(false)}>停止錄音</Button>
                </div>
              ) : (
                <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="請描述您的症狀或健康問題..." className="min-h-[100px]" />
              )}

              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="icon" onClick={() => setIsVoiceInput(v => !v)}><Mic size={18} /></Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleFileButtonClick}><ImageIcon size={18} /></Button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
                <div className="flex items-center space-x-2">
                  {saveSuccess && <span className="text-sm text-green-600 font-medium">已儲存</span>}
                  <Button type="button" variant="outline" onClick={handleSaveChat} disabled={messages.length === 0}><Save size={16} className="mr-2"/>儲存</Button>
                  <Button type="submit" disabled={isLoading || (!input.trim() && !uploadedImage)}><Send size={16} className="mr-2"/>發送</Button>
                </div>
              </div>
            </form>

            {messages.length > 0 && (
              <div className="mt-4"><Button type="button" variant="outline" className="w-full" onClick={handleEndClick}>結束諮詢</Button></div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">儲存的諮詢紀錄</h3>
              <div>
                <Button variant="outline" onClick={() => { if (currentRoomId) { setChatRooms(prev => prev.map(r => r.id === currentRoomId ? { ...r, messages, keywords: keywordCounts } : r)); }}}>同步儲存到聊天室</Button>
              </div>
            </div>

            {history.length === 0 ? (
              <div className="text-center p-8 text-gray-500"><p>尚無諮詢歷史記錄</p></div>
            ) : (
              history.map(record => (
                <div key={record.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-medium">{record.date.toLocaleString("zh-TW", { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })} 諮詢記錄</h3>
                      <div className="flex gap-1 mt-1">{record.keywords.map((kw, i) => <Badge key={i}>{kw}</Badge>)}</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(record.id)}><Trash2 size={16} /></Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenHistory(record)}><FolderOpen size={16} className="mr-2"/>開啟</Button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600">{record.messages[0]?.content.substring(0, 80)}{record.messages[0]?.content.length > 80 ? '...' : ''}</p>
                  <p className="text-xs text-gray-400 mt-1">共 {record.messages.length} 則訊息</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="keywords">
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-white">
              <h3 className="font-medium mb-2">本次對話關鍵字統計</h3>
              <div className="flex flex-wrap gap-2">
                {sortedKeywords.length === 0 ? <div className="text-sm text-gray-400 py-4">開始對話後，AI 會自動分析並提取關鍵字</div> : sortedKeywords.map(([k,c]) => <Badge key={k} variant="secondary" className={`text-sm py-2 px-4 ${c>=3? 'font-semibold bg-teal-100 text-teal-800':''}`}>{k} <span className="ml-1 text-xs opacity-70">×{c}</span></Badge>)}
              </div>
            </div>

            {lastAnalysis && (
              <div className="border rounded-md p-4 bg-gradient-to-br from-teal-50 to-cyan-50">
                <h3 className="font-medium mb-3">最新 AI 分析結果</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">生命危險評估</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full`} style={{ width: `${(lastAnalysis.risk_score||0)*100}%`, background: (lastAnalysis.risk_score||0) >= 0.8 ? '#dc2626' : (lastAnalysis.risk_score||0) >= 0.6 ? '#f97316' : '#10b981' }} /></div>
                      <span className="text-sm font-medium w-12 text-right">{((lastAnalysis.risk_score||0)*100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">情緒狀態</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full`} style={{ width: `${(lastAnalysis.sentiment||0.5)*100}%`, background: (lastAnalysis.sentiment||0) <= 0.3 ? '#7c3aed' : (lastAnalysis.sentiment||0) <= 0.5 ? '#3b82f6' : '#10b981' }} /></div>
                      <span className="text-sm font-medium w-12 text-right">{((lastAnalysis.sentiment||0.5)*100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">緊急程度</p>
                    <Badge className={lastAnalysis.urgency_level === 'high' ? 'bg-red-500' : lastAnalysis.urgency_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}>{lastAnalysis.urgency_level === 'high' ? '⚠️ 高' : lastAnalysis.urgency_level === 'medium' ? '⚡ 中' : '✓ 低'}</Badge>
                  </div>

                  {lastAnalysis.outline && lastAnalysis.outline.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">分析大綱</p>
                      <ul className="text-sm space-y-1">{lastAnalysis.outline.map((l, i) => <li key={i} className="text-gray-700">• {l}</li>)}</ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
        <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5" />
        <p className="text-sm text-amber-800">請注意：本系統提供的建議僅供參考，不能替代專業醫療診斷。如有緊急情況，請立即就醫或撥打急救電話。</p>
      </div>

      {/* dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>確認刪除</AlertDialogTitle><AlertDialogDescription>您確定要刪除此諮詢記錄嗎？此操作無法復原。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">刪除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>尚未儲存紀錄</AlertDialogTitle><AlertDialogDescription>您尚未儲存本次對話內容，若結束諮詢，聊天紀錄將不會被保存。確定要結束嗎？</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => { handleEndConsultation(); setEndDialogOpen(false) }} className="bg-teal-600 hover:bg-teal-700">確定結束</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
