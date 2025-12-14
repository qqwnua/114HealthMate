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
import { 
  Send, 
  Info, 
  AlertTriangle, 
  Save, 
  Trash2, 
  FolderOpen, 
  CheckCircle2, 
  Plus, 
  AlertCircle // [修正] 引入 AlertCircle
} from "lucide-react" 
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

// 🔥 還原：刪除所有關於 DebugInfo 和 BertAnalysisResult 的類型定義

// 🔥 確保 Message 類型不包含 debug 字段
type Message = {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

type ModelType = "llama" | "gpt" | "auto"

type HistoryRecord = {
  id: string
  date: Date
  messages: Message[]
  keywords: string[]
}

// 🔥 保持：簡單的 Markdown 渲染函數
const renderMarkdown = (text: string) => {
  if (!text) return ""
  return text
    // 粗體
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 標題 (只處理 h3，保持簡潔)
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-3 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
    // 列表 (支援 - 或 數字.)
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // 程式碼
    .replace(/`(.+?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
    // 換行 (確保段落和列表之間的間距)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

// 🔥 刪除：renderModelFootnote 函數 (因為不需要顯示 debug 資訊)


export function MedicalConsultation() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("chat")
  const [isLoadedFromHistory, setIsLoadedFromHistory] = useState(false)
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelType>("auto")
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null);
  
  // 🔥 保持：模型切換警告狀態
  const [modelChangeDialogOpen, setModelChangeDialogOpen] = useState(false)
  const [pendingModel, setPendingModel] = useState<ModelType | null>(null) 
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    // 從 localStorage 取得 userId (這是您在 page.tsx 存的)
    const storedUserId = localStorage.getItem("userId");
    setUserId(storedUserId);

    if (storedUserId) {
      fetchHistory(storedUserId);
    }
  }, []);

  const fetchHistory = async (uid: string) => {
    try {
      const res = await fetch(`/api/history?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        // 將資料庫格式轉換為前端 HistoryRecord 格式
        const dbHistory = data.history.map((item: any) => ({
          id: item.id,
          date: new Date(item.date), // 確保轉回 Date 物件
          messages: item.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })),
          keywords: item.keywords
        }));
        setHistory(dbHistory);
      }
    } catch (error) {
      console.error("無法讀取歷史紀錄:", error);
    }
  };

  

  const handleEndConsultation = () => {
    setMessages([])
    setCurrentRecordId(null)
    setSaveSuccess(false)
    // 重設模型選擇為預設 'auto'
    setSelectedModel("auto") 
    setPendingModel(null)
  }

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleEndClick = () => {
     // 您可以在這裡加一個簡單的 confirm (非必要，看您喜好)
     // 或者直接重置
     setMessages([]) // 清空畫面
     setInput("")
     setSaveSuccess(false)
     // setCurrentRecordId(null) // 如果您有這個變數，也要清空
  }

  const handleOpenHistory = (record: HistoryRecord) => {
    setMessages(record.messages)
    setActiveTab("chat")
    setCurrentRecordId(record.id)
    setSaveSuccess(true)
  }

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return

    try {
      // 1. 呼叫後端 API 進行刪除
      const response = await fetch(`/api/history?id=${recordToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("刪除失敗");
      }

      // 2. API 成功後，更新前端畫面 (從列表中移除該項目)
      setHistory((prev) => prev.filter((record) => record.id !== recordToDelete))
      
      // 3. 處理 UI 狀態
      if (currentRecordId === recordToDelete) {
        setCurrentRecordId(null)
        setMessages([]) // 如果刪除的是當前正在看的，清空畫面
      }
      
      setDeleteDialogOpen(false)
      setRecordToDelete(null)
      
      console.log("✅ 紀錄已成功刪除");

    } catch (error) {
      console.error("❌ 刪除紀錄時發生錯誤:", error);
      // 這裡可以選擇是否要跳出 toast 提示使用者
      alert("刪除失敗，請稍後再試。");
    }
  }

  // 🔥 保持：處理模型切換的函數
  const handleModelChange = (value: string) => {
    const newModel = value as ModelType
    
    // 檢查：如果對話已開始 (有訊息) 且嘗試切換到不同模型
    if (messages.length > 0 && newModel !== selectedModel) {
      setPendingModel(newModel)
      setModelChangeDialogOpen(true)
    } else {
      // 尚未開始對話 或 選擇了當前模型
      setSelectedModel(newModel)
    }
  }

  // 🔥 保持：處理確認切換模型
  const handleConfirmModelChange = () => {
    if (pendingModel) {
      setSelectedModel(pendingModel)
    }
    setPendingModel(null)
    setModelChangeDialogOpen(false)
  }

  // 🔥 保持：處理取消切換模型
  const handleCancelModelChange = () => {
    setPendingModel(null)
    setModelChangeDialogOpen(false)
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // 修改：只檢查文字輸入
    if (!input.trim()) return

    // 修改：不再需要處理圖片文字拼接
    const userMessage: Message = { role: "user", content: input.trim(), timestamp: new Date() }
    
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput("")
    // 移除 setUploadedImage(null)
    setIsLoading(true)
    setSaveSuccess(false)

    try {
      setLoadingMessage("正在分析中...")

      // 修改：API 呼叫移除 image 參數
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput }), 
      })

      if (!analyzeResponse.ok) throw new Error(`分析失敗：${analyzeResponse.status}`)
      const analyzeData = await analyzeResponse.json()

      setLoadingMessage("生成回覆中...")

      // 修改：API 呼叫移除 image 參數
      const respondResponse = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          analysis: analyzeData.analysis,
          model: selectedModel, 
          history: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          // image: uploadedImage, // 這一行刪除
          userId: userId,
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

      if (userId) {
        await fetchHistory(userId);
      }

      setSaveSuccess(true);

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
    "如何改善睡眠品質？",
    "運動後肌肉酸痛如何緩解？",
  ]

  // 輔助函數：將模型類型轉換為中文名稱
  const getModelName = (model: ModelType | null): string => {
    switch (model) {
      case 'llama': return 'LLaMA'
      case 'gpt': return 'GPT'
      case 'auto': return '自動選擇'
      default: return '未知模型'
    }
  }

  // ⭐ 新增：根據 history 計算關鍵字頻率
  // 1. 攤平所有紀錄中的關鍵字
  const allKeywords = history.flatMap(record => record.keywords || []);
  
  // 2. 計算每個關鍵字出現的次數
  const keywordCounts = allKeywords.reduce((acc, key) => {
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 3. 排序：出現次數多的排前面
  const sortedKeywords = Object.entries(keywordCounts)
    .sort(([, countA], [, countB]) => countB - countA) // 降序排列
    .map(([key]) => key); // 只取關鍵字名稱

  return (
    <div className="flex flex-col min-h-[80vh]">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">醫病諮詢語言模型</CardTitle>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Info size={16} className="mr-2" />
          <span>此系統提供的建議僅供參考，不能替代專業醫療診斷。</span>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-3 w-full mb-4">
            <TabsTrigger value="chat">對話諮詢</TabsTrigger>
            <TabsTrigger value="history">諮詢歷史</TabsTrigger>
            <TabsTrigger value="keywords">關鍵字分析</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex flex-col">
          {/* 模型選擇區塊 (保留 V1 介面) */}
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium text-sm mb-3">選擇 AI 模型</h3>
            <RadioGroup
              value={selectedModel}
              onValueChange={handleModelChange} 
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
          {/* 聊天區塊 */}
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
                  className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                    message.role === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div
                    className="prose max-w-none text-base"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                  />
                  <div className={`text-xs mt-2 ${message.role === "user" ? "text-teal-100" : "text-gray-500"}`}>
                    {message.timestamp
                      .toLocaleString("zh-TW", {
                        year: "numeric", month: "2-digit", day: "2-digit",
                        hour: "2-digit", minute: "2-digit", hour12: false,
                      })
                      .replace(/\//g, "/")
                      .replace(",", "")}
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

          <div className="mt-auto">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
              {/* ✅ 修改：只保留純文字輸入框，移除語音切換 */}
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="請描述您的症狀或健康問題..."
                className="min-h-[100px]"
              />

              <div className="flex justify-between items-center">
                <div className="flex space-x-2"></div>
                <div className="flex items-center space-x-2">
                  {/* ✅ 只保留自動儲存的提示，不給按鈕 */}
                  {saveSuccess && (
                    <span className="text-xs text-gray-400 flex items-center">
                      <CheckCircle2 size={12} className="mr-1" />
                      已自動儲存
                    </span>
                  )}
                  
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send size={18} className="mr-2" />
                    發送
                  </Button>
                </div>
              </div>
            </form>

            {/* ✅ 下方的結束按鈕：功能變成「清空畫面 / 新對話」 */}
            {messages.length > 0 && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent border-dashed text-gray-500 hover:text-gray-700"
                  onClick={handleEndClick}
                >
                  <Plus size={16} className="mr-2" /> {/* 建議換成 Plus icon */}
                  開啟新諮詢 (清空畫面)
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          {/* ⭐ [修正] 增加登入檢查與按鈕 */}
          {userId === null ? (
            <div className="p-8 text-center max-w-3xl mx-auto border rounded-md bg-gray-50">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">請先登入</h3>
                <p className="text-gray-500 mt-2">諮詢歷史為個人化功能，登入後即可查看您的資料。</p>
                <Button className="mt-4 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.href = '/login'}>
                    前往登入
                </Button>
            </div>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="keywords">
          {/* ⭐ [修正] 增加登入檢查與按鈕 */}
          {userId === null ? (
            <div className="p-8 text-center max-w-3xl mx-auto border rounded-md bg-gray-50">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">請先登入</h3>
                <p className="text-gray-500 mt-2">關鍵字分析為個人化功能，登入後即可查看您的資料。</p>
                <Button className="mt-4 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.href = '/login'}>
                    前往登入
                </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 區塊 1: 顯示所有出現過的關鍵字 (從資料庫撈出來的) */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">您的健康關鍵字分析 (依照頻率排序)</h3>
                {sortedKeywords.length === 0 ? (
                  <p className="text-sm text-gray-500">尚無足夠資料進行分析，請多進行幾次諮詢。</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* ⭐ 修改：這裡改成用 sortedKeywords 渲染 */}
                    {sortedKeywords.map((keyword, i) => (
                      <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                        {keyword} 
                        {/* 如果想顯示次數，可以改成: {keyword} ({keywordCounts[keyword]}) */}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* 區塊 2: 這裡可以保留為「推薦關注」或是直接顯示前 5 名 */}
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">重點關注項目 (Top 5)</h3>
                {sortedKeywords.length === 0 ? (
                   <p className="text-sm text-gray-500">尚無資料。</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {/* ⭐ 修改：只顯示前 5 個最常出現的 */}
                    {sortedKeywords.slice(0, 5).map((keyword, i) => (
                      <Badge key={i} className="text-sm py-1 px-3 bg-teal-100 text-teal-800 hover:bg-teal-200">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
        <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5" />
        <p className="text-sm text-amber-800">
          請注意：本系統提供的建議僅供參考，不能替代專業醫療診斷。如有緊急情況，請立即就醫或撥打急救電話。
        </p>
      </div>

      {/* 刪除紀錄警告 (原有的) */}
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

      {/* 結束諮詢警告 (原有的) */}
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

      {/* 🔥 保持：中途切換模型警告 */}
      <AlertDialog open={modelChangeDialogOpen} onOpenChange={setModelChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>切換 AI 模型警告</AlertDialogTitle>
            <AlertDialogDescription>
              您目前已開始對話，若從 **{getModelName(selectedModel)}** 切換為 **{getModelName(pendingModel)}**，
              可能會導致 AI 忘記部分先前的對話脈絡，造成回覆不流暢。
              <br/><br/>
              您確定要切換模型嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelModelChange}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmModelChange}>
              確定切換
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}