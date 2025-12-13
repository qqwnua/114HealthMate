"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { MessageCircle, Heart, BookOpen, TrendingUp, Mic, Send, Loader2, Brain, AlertCircle } from "lucide-react"
import { SelfRecording } from "./self-recording"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { toast } from "sonner"

// Types
type Message = {
  role: "user" | "assistant"
  content: string
  timestamp?: Date
}

type EmotionEntry = {
  id: string
  date: string
  emotion: string
  intensity: number
  note: string
  tags: string[]
}

// 🔧 輔助函數:取得 userid  
function getuserid(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userId');
}

// Assessment questions
const assessmentQuestions = [
  { id: "sleep", question: "最近一週，您的睡眠品質如何？", options: ["很差", "較差", "普通", "良好", "很好"] },
  { id: "mood", question: "您感到心情低落或沮喪的頻率？", options: ["經常", "時常", "偶爾", "很少", "從不"] },
  { id: "interest", question: "對日常活動的興趣或樂趣？", options: ["完全沒有", "很少", "有一些", "正常", "很高"] },
  { id: "energy", question: "您的精力和活力水平？", options: ["很低", "較低", "普通", "良好", "很好"] },
  { id: "anxiety", question: "感到焦慮或緊張的程度？", options: ["非常嚴重", "嚴重", "中等", "輕微", "沒有"] },
  { id: "concentration", question: "專注力和注意力如何？", options: ["很差", "較差", "普通", "良好", "很好"] },
]

export default function PsychologicalConsultation() {

  const userId = getuserid(); 

  // ⭐ [新增] 未登入時顯示的元件
  const LoginRequired = () => (
    <div className="p-8 text-center max-w-sm mx-auto border rounded-md bg-gray-50">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">請先登入</h3>
        <p className="text-gray-500 mt-2">此功能為個人化服務，登入後即可查看及編輯您的資料。</p>
        <Button className="mt-4 bg-teal-600 hover:bg-teal-700" onClick={() => window.location.href = '/login'}>
            前往登入
        </Button>
    </div>
  );

  // Chat State
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // Emotion State
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)
  const [currentEmotionScore, setCurrentEmotionScore] = useState(50)
  const [emotionHistory, setEmotionHistory] = useState<EmotionEntry[]>([])
  
  // Self Assessment State
  const [assessmentAnswers, setAssessmentAnswers] = useState<Record<string, number>>({})
  const [assessmentScore, setAssessmentScore] = useState<string | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)
  
  // UI State
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 計算趨勢圖數據 (使用 useMemo 避免重複計算)
  const chartData = useMemo(() => {
    if (emotionHistory.length === 0) return []
    
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const dailyEmotions = new Map<string, number[]>()
    emotionHistory.forEach(entry => {
      const entryDate = new Date(entry.date)
      if (entryDate >= sevenDaysAgo) {
        const dateKey = entryDate.toISOString().split('T')[0]
        if (!dailyEmotions.has(dateKey)) {
          dailyEmotions.set(dateKey, [])
        }
        dailyEmotions.get(dateKey)!.push(entry.intensity)
      }
    })
    
    return Array.from(dailyEmotions.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, intensities]) => {
        const avgIntensity = intensities.reduce((a, b) => a + b, 0) / intensities.length
        const moodScore = Math.round((10 - avgIntensity) * 10)
        
        return {
          date: new Date(date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' }),
          心情指數: moodScore,
          平均強度: avgIntensity,
          記錄數: intensities.length
        }
      })
  }, [emotionHistory])
  
  // 計算綜合情緒評分的函數
  const calculateOverallScore = useCallback((): number => {
    let totalScore = 0
    let weightSum = 0
    
    // 1. 歷史平均 (35%)
    if (emotionHistory.length > 0) {
      const allIntensities = emotionHistory.map(e => e.intensity).filter(i => !isNaN(i))
      if (allIntensities.length > 0) {
        const avgIntensity = allIntensities.reduce((a, b) => a + b, 0) / allIntensities.length
        const historicalScore = Math.round((10 - avgIntensity) * 10)
        totalScore += historicalScore * 0.35
        weightSum += 0.35
      }
    }
    
    // 2. 近期平均 (50%)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentEntries = emotionHistory.filter(e => new Date(e.date) >= sevenDaysAgo)
    
    if (recentEntries.length > 0) {
      const recentIntensities = recentEntries.map(e => e.intensity).filter(i => !isNaN(i))
      if (recentIntensities.length > 0) {
        const avgRecentIntensity = recentIntensities.reduce((a, b) => a + b, 0) / recentIntensities.length
        const recentScore = Math.round((10 - avgRecentIntensity) * 10)
        totalScore += recentScore * 0.5
        weightSum += 0.5
      }
    }
    
    // 3. 自我評估與心靈便籤 (15%)
    let thirdComponentScore = 0
    let thirdComponentCount = 0
    
    try {
      const savedAssessmentScore = localStorage.getItem("assessmentScore")
      if (savedAssessmentScore) {
        const score = parseFloat(savedAssessmentScore)
        if (!isNaN(score)) {
          thirdComponentScore += score
          thirdComponentCount++
        }
      }
    } catch (e) {
      console.error("讀取自我評估失敗:", e)
    }
    
    try {
      const journalEntries = localStorage.getItem('journalEntries')
      if (journalEntries) {
        const entries = JSON.parse(journalEntries)
        if (Array.isArray(entries) && entries.length > 0) {
          const recentJournals = entries.filter((e: any) => {
            try {
              const entryDate = new Date(e.date)
              return entryDate >= sevenDaysAgo
            } catch {
              return false
            }
          })
          
          if (recentJournals.length > 0) {
            const moodScores: Record<string, number> = {
              'excited': 95,
              'happy': 85,
              'neutral': 50,
              'anxious': 35,
              'sad': 20
            }
            const journalScore = recentJournals.reduce((sum: number, entry: any) => {
              return sum + (moodScores[entry.mood] || 50)
            }, 0) / recentJournals.length
            
            thirdComponentScore += journalScore
            thirdComponentCount++
          }
        }
      }
    } catch (e) {
      console.error("讀取心靈便籤失敗:", e)
    }
    
    if (thirdComponentCount > 0) {
      const avgThirdScore = thirdComponentScore / thirdComponentCount
      totalScore += avgThirdScore * 0.15
      weightSum += 0.15
    }
    
    if (weightSum === 0) {
      return 50
    }
    
    const finalScore = totalScore / weightSum
    const result = Math.max(0, Math.min(100, Math.round(finalScore)))
    return result
  }, [emotionHistory])
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Load emotion history from database
  useEffect(() => {
    const loadEmotionHistory = async () => {
      const userid = getuserid()
      if (!userid) return

      try {
        const response = await fetch(`/api/emotion-records?userid=${userid}&days=30&limit=100`)
        const data = await response.json()

        if (data.success && data.records.length > 0) {
          // 轉換為前端格式
          const emotions: EmotionEntry[] = data.records.map((record: any) => ({
            id: record.record_id.toString(),
            date: record.recorded_at,
            emotion: record.emotion_state,
            intensity: record.intensity || 5,
            note: record.trigger_message?.substring(0, 100) || '',
            tags: [record.emotion_state]
          }))
          setEmotionHistory(emotions)
        }
      } catch (error) {
        console.error("載入情緒歷史失敗:", error)
      }
    }

    loadEmotionHistory()
    
    const savedMessages = localStorage.getItem("chatMessages")
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined
        })))
      } catch (e) {
        console.error("讀取訊息失敗:", e)
      }
    }
  }, [])
  
  // 計算綜合評分
  useEffect(() => {
    const score = calculateOverallScore()
    setCurrentEmotionScore(score)
  }, [emotionHistory, calculateOverallScore])
  
  // 儲存訊息到 localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("chatMessages", JSON.stringify(messages))
      } catch (e) {
        console.error("儲存訊息失敗:", e)
      }
    }
  }, [messages])
  
  // 🔧 發送訊息 - 使用原始的 handleSubmit 邏輯
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    
    try {
      console.log("📤 發送訊息到後端...", userMessage.content)
      
      const response = await fetch("/api/psychological-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          history: messages,
        }),
      })
      
      console.log("📥 收到回應狀態:", response.status, response.statusText)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ API 錯誤:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log("✅ 收到回應資料:", data)
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply || data.message || "抱歉，暫時無法回應",
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // 關鍵修正：直接抓取 'userId' (大寫 I)，避免 getuserid() 舊函式抓到 null
      const userId = localStorage.getItem('userId'); 

      // 1. 儲存對話記錄 (Chat History)
      if (userId) {
        const sessionId = localStorage.getItem('currentSessionId') || `session_${Date.now()}`
        localStorage.setItem('currentSessionId', sessionId)

        try {
          // 存用戶訊息
          await fetch('/api/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userid: parseInt(userId),
              session_id: sessionId,
              role: 'user',
              content: userMessage.content
            })
          })

          // 存 AI 訊息
          await fetch('/api/chat-history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userid: parseInt(userId),
              session_id: sessionId,
              role: 'assistant',
              content: assistantMessage.content,
              emotion_detected: data.debug?.bert_analysis?.emotion_state,
              emotion_score: data.debug?.bert_analysis?.risk_score ? Math.round(data.debug.bert_analysis.risk_score * 10) : null
            })
          })
        } catch (dbError) {
          console.error("儲存對話記錄失敗:", dbError)
        }
      }
      
      // 2. 分析情緒並儲存到歷史記錄 (Emotion Records & Health Score)
      if (data.debug?.bert_analysis) {
        const analysis = data.debug.bert_analysis
        const emotionState = analysis.emotion_state || "中性"
        setCurrentEmotion(emotionState)
        
        // 只有當訊息包含情緒內容時才列入追蹤
        if (analysis.should_track !== false) {
          const intensity = Math.min(Math.round(analysis.risk_score * 10), 10)
          
          // 更新前端畫面
          const newEmotionEntry: EmotionEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            emotion: emotionState,
            intensity: intensity,
            note: userMessage.content.substring(0, 100),
            tags: [emotionState],
          }
          
          const updatedHistory = [...emotionHistory, newEmotionEntry]
          setEmotionHistory(updatedHistory)
          
          // 儲存到 emotion_records 資料庫
          if (userId) {
            try {
              // 計算 mood_score: 50%近期 + 35%歷史 + 15%自我評估
              let moodScore = 60; // 給個預設值避免 null
              
              // 1. 近期情緒平均 (最近5筆)
              const recentEmotions = emotionHistory.slice(-5)
              const recentAvg = recentEmotions.length > 0
                ? recentEmotions.reduce((sum, e) => sum + (10 - e.intensity), 0) / recentEmotions.length
                : 5
              
              // 2. 歷史情緒平均 (全部)
              const historyAvg = emotionHistory.length > 0
                ? emotionHistory.reduce((sum, e) => sum + (10 - e.intensity), 0) / emotionHistory.length
                : 5
              
              // 3. 自我評估分數
              const lastAssessmentScore = parseFloat(localStorage.getItem("assessmentScore") || "50")
              
              // 加權計算
              moodScore = Math.round(
                (recentAvg * 0.5 + historyAvg * 0.35 + (lastAssessmentScore / 10) * 0.15) * 10
              )
              
              // A. 寫入情緒紀錄
              console.log("正在儲存情緒紀錄...");
              await fetch('/api/emotion-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userid: parseInt(userId),
                  emotion_state: emotionState,
                  intensity: intensity,
                  mood_score: moodScore,
                  risk_score: analysis.risk_score || null,
                  bert_analysis: analysis,
                  trigger_message: userMessage.content
                })
              })

              // B. 觸發健康分數更新 (這就是你要解決的第二個問題)
              console.log("正在更新健康分數...");
              try {
                await fetch('/api/health-score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userid: parseInt(userId) })
                });
                console.log("✅ 健康分數已更新");
              } catch (e) {
                console.error("更新分數失敗", e);
              }

            } catch (error) {
              console.error("儲存情緒記錄失敗:", error)
            }
          }
        }
      }
      
    } catch (error: any) {
      console.error("❌ 發送失敗:", error)
      console.error("錯誤堆疊:", error.stack)
      
      const errorMessage: Message = {
        role: "assistant",
        content: `抱歉，系統暫時無法回應。請稍後再試。

如果您現在需要協助，可以撥打：
- 生命線：1995
- 張老師：1980
- 1925 安心專線

錯誤: ${error.message || '未知錯誤'}`,
        timestamp: new Date(),
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      console.log("✅ 對話流程結束，isLoading:", false)
    }
  }
  
  // Handle assessment change
  const handleAssessmentChange = (questionId: string, value: number) => {
    setAssessmentAnswers(prev => ({ ...prev, [questionId]: value }))
  }
  
  // 關閉評估結果彈窗
  const handleCloseResultDialog = () => {
    setShowResultDialog(false)
    setAssessmentAnswers({}) // 清空答案
    setAssessmentScore(null) // 清空結果
    setActiveTab("tracking") // 跳轉到情緒追蹤 Tab
  }
  
  // Calculate assessment
  const calculateAssessment = async () => {
    // 計算總分 - 所有選項都是左差右好,不需反轉
    const scores = Object.values(assessmentAnswers)
    
    const totalScore = scores.reduce((a, b) => a + b, 0)
    const maxScore = assessmentQuestions.length * 4
    const percentage = (totalScore / maxScore) * 100

    let result = ""
    if (percentage >= 75) {
      result = "狀態良好 - 保持良好的生活習慣"
    } else if (percentage >= 50) {
      result = "輕度壓力 - 建議進行放鬆練習和壓力管理"
    } else if (percentage >= 25) {
      result = "中度壓力 - 建議諮詢心理健康專業人員"
    } else {
      result = "較高壓力 - 強烈建議尋求專業心理諮詢"
    }

    setAssessmentScore(result)
    localStorage.setItem("assessmentScore", percentage.toString())
    setShowResultDialog(true) // 顯示彈窗
    
    // 儲存到資料庫
    const userid = getuserid()
    if (userid) {
      try {
        // 提取各項分數
        const sleep = assessmentAnswers.sleep || 0
        const mood = assessmentAnswers.mood || 0
        const interest = assessmentAnswers.interest || 0
        const energy = assessmentAnswers.energy || 0
        const anxiety = assessmentAnswers.anxiety || 0
        const concentration = assessmentAnswers.concentration || 0
        
        await fetch('/api/self-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userid: parseInt(userid),
            assessment_type: 'psychological',
            answers: assessmentAnswers,
            anxiety_level: anxiety,
            stress_level: mood,
            mood_stability: sleep,
            happiness_level: interest,
            social_satisfaction: energy,
            confidence_level: concentration,
            total_score: Math.round(percentage)
          })
        })
      } catch (error) {
        console.error("儲存評估失敗:", error)
      }
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl text-teal-600 flex items-center">
          <Brain className="mr-2" />
          心理諮詢與情緒追蹤
        </CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4">
          <TabsTrigger value="chat">AI 諮詢對話</TabsTrigger>
          <TabsTrigger value="assessment">自我評估</TabsTrigger>
          <TabsTrigger value="tracking">情緒追蹤</TabsTrigger>
          <TabsTrigger value="journal">心靈便籤</TabsTrigger>
        </TabsList>

        {/* Tab 1: Chat */}
        <TabsContent value="chat">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal-600" />
                AI 心理諮詢
              </CardTitle>
              <CardDescription>
                與 AI 進行對話,分享您的感受和困擾
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto space-y-4 p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-teal-500" />
                  <p>您好!我是您的 AI 心理諮詢師。</p>
                  <p className="text-sm">有什麼我可以幫助您的嗎?</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === "user"
                          ? "bg-teal-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.timestamp && (
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(msg.timestamp).toLocaleTimeString('zh-TW')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="p-4 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  placeholder="輸入您的想法..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                  rows={2}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Emotion Tracking */}
        <TabsContent value="tracking">
          {userId ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-teal-600" />
                  情緒追蹤
                </CardTitle>
                <CardDescription>
                  查看您的情緒變化和心理健康狀態
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Score */}
                <div className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">當前情緒評分</h3>
                      <p className="text-sm text-gray-600">基於最近的對話和評估</p>
                    </div>
                    <div className="text-4xl font-bold text-teal-600">
                      {currentEmotionScore}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        currentEmotionScore >= 70
                          ? "bg-green-500"
                          : currentEmotionScore >= 40
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${currentEmotionScore}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    {currentEmotionScore >= 70
                      ? "您的情緒狀態良好 😊"
                      : currentEmotionScore >= 40
                      ? "您的情緒狀態一般 😐"
                      : "建議尋求專業協助 😔"}
                  </p>
                </div>

                {/* History */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    近期情緒趨勢
                  </h3>
                  
                  {emotionHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>尚無情緒記錄</p>
                      <p className="text-sm mt-2">開始對話來追蹤您的情緒變化</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-6 p-4 bg-white border rounded-lg">
                        <h4 className="text-sm font-semibold mb-3 text-gray-700">
                          情緒趨勢圖 (最近7天)
                        </h4>
                        {chartData.length === 0 ? (
                          <div style={{ width: '100%', height: '256px' }} className="flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>尚無最近7天的記錄</p>
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '256px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                  <XAxis 
                                    dataKey="date" 
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    stroke="#9ca3af"
                                  />
                                  <YAxis 
                                    domain={[0, 100]}
                                    ticks={[0, 25, 50, 75, 100]}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    stroke="#9ca3af"
                                    label={{ value: '心情指數', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                                  />
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: 'white', 
                                      border: '1px solid #e5e7eb',
                                      borderRadius: '8px',
                                      padding: '8px'
                                    }}
                                  />
                                  <Line 
                                    type="monotone" 
                                    dataKey="心情指數" 
                                    stroke="#14b8a6" 
                                    strokeWidth={3}
                                    connectNulls={true}
                                    dot={{ r: 6, fill: '#14b8a6', stroke: 'white', strokeWidth: 2 }}
                                    activeDot={{ r: 8 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                          </div>
                        )}
                        <div className="mt-4 flex justify-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span>開心 (70-100分)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span>一般 (40-69分)</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>不開心 (0-39分)</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <LoginRequired />
          )}
        </TabsContent>

        {/* Tab 3: Self Assessment */}
        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-teal-600" />
                心理健康自我評估
              </CardTitle>
              <CardDescription>
                請根據最近一週的感受，選擇最符合您狀況的選項
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {assessmentQuestions.map((q) => (
                <div key={q.id} className="space-y-3">
                  <label className="font-medium">{q.question}</label>
                  <div className="grid grid-cols-5 gap-2">
                    {q.options.map((option, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant={assessmentAnswers[q.id] === index ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleAssessmentChange(q.id, index)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
              
              <Button
                onClick={calculateAssessment}
                className="w-full bg-teal-600 hover:bg-teal-700"
                disabled={Object.keys(assessmentAnswers).length < assessmentQuestions.length}
              >
                完成評估
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 評估結果彈窗 */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl text-teal-600">評估結果</DialogTitle>
              <DialogDescription>
                根據您的回答，我們為您分析了目前的心理健康狀態
              </DialogDescription>
            </DialogHeader>
            <div className="py-6">
              <div className="p-6 bg-teal-50 rounded-lg text-center">
                <p className="text-xl font-semibold text-gray-800 mb-2">
                  {assessmentScore}
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-teal-600 hover:bg-teal-700"
                onClick={handleCloseResultDialog}
              >
                完成
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tab 4: Journal */}
        <TabsContent value="journal">
          {userId ? (
            <SelfRecording hideStats={true} />
          ) : (
            <LoginRequired />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { PsychologicalConsultation }