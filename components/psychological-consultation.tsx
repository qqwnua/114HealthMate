"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, Heart, BookOpen, TrendingUp, Mic, Send, Loader2, Brain } from "lucide-react"
import { SelfRecording } from "./self-recording"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

export default function PsychologicalConsultation() {
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
  
  // UI State
  const [activeTab, setActiveTab] = useState("chat")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 計算趨勢圖數據 (使用 useMemo 避免重複計算)
  const chartData = useMemo(() => {
    if (emotionHistory.length === 0) return []
    
    // 計算最近7天的每日平均分數
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    // 按日期分組
    const dailyEmotions = new Map<string, number[]>()
    emotionHistory.forEach(entry => {
      const entryDate = new Date(entry.date)
      // 只取最近7天的資料
      if (entryDate >= sevenDaysAgo) {
        const dateKey = entryDate.toISOString().split('T')[0]
        if (!dailyEmotions.has(dateKey)) {
          dailyEmotions.set(dateKey, [])
        }
        dailyEmotions.get(dateKey)!.push(entry.intensity)
      }
    })
    
    // 計算每日的平均心情指數
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
    
    // 1. 歷史平均 (35%) - 基於所有情緒歷史記錄
    if (emotionHistory.length > 0) {
      const allIntensities = emotionHistory.map(e => e.intensity).filter(i => !isNaN(i))
      if (allIntensities.length > 0) {
        const avgIntensity = allIntensities.reduce((a, b) => a + b, 0) / allIntensities.length
        const historicalScore = Math.round((10 - avgIntensity) * 10)
        totalScore += historicalScore * 0.35
        weightSum += 0.35
      }
    }
    
    // 2. 近期平均 (50%) - 基於最近7天的記錄
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
    
    // 3a. 自我評估分數
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
    
    // 3b. 心靈便籤的心情分數
    try {
      const journalEntries = localStorage.getItem('journalEntries')
      if (journalEntries) {
        const entries = JSON.parse(journalEntries)
        if (Array.isArray(entries) && entries.length > 0) {
          // 取最近7天的便籤
          const recentJournals = entries.filter((e: any) => {
            try {
              const entryDate = new Date(e.date)
              return entryDate >= sevenDaysAgo
            } catch {
              return false
            }
          })
          
          if (recentJournals.length > 0) {
            // 根據 mood 計算分數
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
    
    // 計算第三部分的平均分數
    if (thirdComponentCount > 0) {
      const avgThirdScore = thirdComponentScore / thirdComponentCount
      totalScore += avgThirdScore * 0.15
      weightSum += 0.15
    }
    
    // 如果沒有任何數據，返回 50 (中性)
    if (weightSum === 0) {
      return 50
    }
    
    // 根據實際權重調整分數
    const finalScore = totalScore / weightSum
    const result = Math.max(0, Math.min(100, Math.round(finalScore)))
    return result
  }, [emotionHistory])
  
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])
  
  // Load from localStorage - 必須先載入
  useEffect(() => {
    const savedEmotions = localStorage.getItem("emotionHistory")
    if (savedEmotions) {
      try {
        setEmotionHistory(JSON.parse(savedEmotions))
      } catch (e) {
        console.error("讀取情緒歷史失敗:", e)
      }
    }
  }, [])
  
  // 更新綜合評分 - 在資料載入後計算
  useEffect(() => {
    const overallScore = calculateOverallScore()
    console.log('🔢 設置綜合評分:', overallScore)
    if (!isNaN(overallScore)) {
      setCurrentEmotionScore(overallScore)
    }
  }, [emotionHistory, calculateOverallScore])
  
  // 監聽 localStorage 變化 (自我評估和心靈便籤)
  useEffect(() => {
    const handleStorageChange = () => {
      const overallScore = calculateOverallScore()
      if (!isNaN(overallScore)) {
        setCurrentEmotionScore(overallScore)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    // 每30秒檢查一次更新
    const interval = setInterval(handleStorageChange, 30000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [calculateOverallScore])
  
  // Chat handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }
  
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
      
      // 分析情緒並儲存到歷史記錄
      if (data.debug?.bert_analysis) {
        const analysis = data.debug.bert_analysis
        const emotionState = analysis.emotion_state || "中性"
        setCurrentEmotion(emotionState)
        
        // 🔧 只有當訊息包含情緒內容時才列入追蹤
        if (analysis.should_track !== false) {
          // 儲存到情緒歷史
          const intensity = Math.min(Math.round(analysis.risk_score * 10), 10)
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
          localStorage.setItem("emotionHistory", JSON.stringify(updatedHistory))
        }
        
        // 綜合評分會由 useEffect 自動更新
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
  
  // Self Assessment Questions
  const assessmentQuestions = [
    { id: "sleep", question: "最近一週，您的睡眠品質如何？", options: ["很差", "較差", "普通", "良好", "很好"] },
    { id: "mood", question: "您感到心情低落或沮喪的頻率？", options: ["經常", "時常", "偶爾", "很少", "從不"] },
    { id: "interest", question: "對日常活動的興趣或樂趣？", options: ["完全沒有", "很少", "有一些", "正常", "很高"] },
    { id: "energy", question: "您的精力和活力水平？", options: ["很低", "較低", "普通", "良好", "很好"] },
    { id: "anxiety", question: "感到焦慮或緊張的程度？", options: ["非常嚴重", "嚴重", "中等", "輕微", "沒有"] },
    { id: "concentration", question: "專注力和注意力如何？", options: ["很差", "較差", "普通", "良好", "很好"] },
  ]
  
  const handleAssessmentChange = (questionId: string, value: number) => {
    setAssessmentAnswers(prev => ({ ...prev, [questionId]: value }))
  }
  
  const calculateAssessment = () => {
    const totalQuestions = assessmentQuestions.length
    const answeredQuestions = Object.keys(assessmentAnswers).length
    
    if (answeredQuestions < totalQuestions) {
      alert("請完成所有問題")
      return
    }
    
    const totalScore = Object.values(assessmentAnswers).reduce((sum, val) => sum + val, 0)
    const maxScore = totalQuestions * 4
    const percentage = Math.round((totalScore / maxScore) * 100)
    
    // 儲存評估分數
    localStorage.setItem("assessmentScore", percentage.toString())
    
    // 立即更新綜合評分
    const overallScore = calculateOverallScore()
    setCurrentEmotionScore(overallScore)
    
    // 根據分數給予不同的鼓勵話語
    let encouragementMessage = ""
    if (percentage >= 70) {
      encouragementMessage = "很棒！從評估結果來看，你目前的狀態很不錯。繼續保持這樣的生活節奏，也記得適時給自己一些休息時間喔。"
    } else if (percentage >= 40) {
      encouragementMessage = "感謝你願意花時間了解自己的狀態。每個人都會有起伏，這很正常。記得多照顧自己，有需要的話隨時可以來聊聊天。"
    } else {
      encouragementMessage = "謝謝你完成這份評估。我注意到你最近可能過得比較辛苦。記得，尋求協助是一種勇氣的表現。如果需要，也可以考慮與專業人士聊聊，他們能提供更完善的支持。"
    }
    
    // 彈出完成視窗
    alert(`✨ 評估完成\n\n${encouragementMessage}`)
    
    // 清空表單
    setAssessmentAnswers({})
    
    // 跳轉到情緒追蹤頁面
    setActiveTab("emotion")
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-teal-700">心理諮詢系統</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            AI 諮詢
          </TabsTrigger>
          <TabsTrigger value="emotion" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            情緒追蹤
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            自我評估
          </TabsTrigger>
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            心靈便箋
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Chat */}
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-teal-600" />
                心理諮詢機器人
              </CardTitle>
              <CardDescription>
                此系統提供的建議僅供參考，不能替代專業心理諮詢
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-[400px] overflow-y-auto border rounded-lg p-4 space-y-4 bg-gray-50">
                  {messages.length === 0 && (
                    <div className="text-center text-gray-400 py-20">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>開始對話...</p>
                      <p className="text-sm mt-2">我會用溫暖的語氣陪伴你聊天</p>
                    </div>
                  )}

                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user" ? "bg-teal-600 text-white" : "bg-white border border-gray-200 text-gray-800"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-gray-600">思考中...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-2">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="請描述您的心理困擾或問題..."
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading || !input.trim()}
                      className="bg-teal-600 hover:bg-teal-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          思考中
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          發送
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Emotion Tracking */}
        <TabsContent value="emotion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-teal-600" />
                情緒狀態追蹤
              </CardTitle>
              <CardDescription>
                追蹤和了解您的情緒變化
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Score */}
              <div className="p-6 bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
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
                    {/* 折線圖 - 使用 recharts */}
                    <div className="mb-6 p-4 bg-white border rounded-lg">
                      <h4 className="text-sm font-semibold mb-3 text-gray-700">
                        情緒趨勢圖 (最近7天)
                      </h4>
                      {chartData.length === 0 ? (
                        <div style={{ width: '100%', height: '256px' }} className="flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>尚無情緒記錄</p>
                            <p className="text-sm mt-2">開始對話來追蹤您的情緒變化</p>
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
                                  formatter={(value: any, name: string, props: any) => {
                                    if (name === '心情指數') {
                                      const score = value as number
                                      const recordCount = props.payload?.記錄數 || 0
                                      let mood = ''
                                      if (score >= 70) mood = '開心 😊'
                                      else if (score >= 40) mood = '一般 😐'
                                      else mood = '不開心 😔'
                                      return [
                                        `${value} 分 (${mood})`,
                                        `當日 ${recordCount} 筆記錄`
                                      ]
                                    }
                                    return [value, name]
                                  }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="心情指數" 
                                  stroke="#14b8a6" 
                                  strokeWidth={3}
                                  connectNulls={true}
                                  dot={(props: any) => {
                                    const { cx, cy, payload } = props
                                    if (!cx || !cy) return null
                                    const score = payload['心情指數']
                                    let color = '#ef4444' // 紅色 (不開心)
                                    if (score >= 70) color = '#10b981' // 綠色 (開心)
                                    else if (score >= 40) color = '#eab308' // 黃色 (一般)
                                    
                                    return (
                                      <circle 
                                        cx={cx} 
                                        cy={cy} 
                                        r={6} 
                                        fill={color}
                                        stroke="white"
                                        strokeWidth={2}
                                      />
                                    )
                                  }}
                                  activeDot={{ r: 8, stroke: '#14b8a6', strokeWidth: 2, fill: 'white' }}
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

        {/* Tab 4: Journal */}
        <TabsContent value="journal">
          <SelfRecording hideStats={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { PsychologicalConsultation }