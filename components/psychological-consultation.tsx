"use client"

import { useState, useRef, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import {
  Brain,
  BarChart3,
  MessageSquare,
  MicIcon,
  Save,
  BookOpen,
  Tag,
  Smile,
  Frown,
  Meh,
  Sun,
  Cloud,
  CloudRain,
  Send,
  Info,
  Upload,
  ImageIcon,
  Mic,
  Settings,
  Camera,
  Video,
  Volume2,
  Lock,
  Eye,
  EyeOff,
  Download,
  Trash2,
  MoreHorizontal,
  Bell,
  FileText,
  Search,
  X,
  List,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

// 簡單 Markdown 渲染（來自 medical-consultation）
// 用來在 chat UI 支援部分 markdown（粗體、標題、清單、程式碼、換行）
const renderMarkdown = (text: string) => {
  if (!text) return ""
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-lg mt-3 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-xl mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-bold text-2xl mt-4 mb-2">$1</h1>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-200 px-1 rounded">$1</code>')
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
}


// Mock data
const emotionalRadarData = [
  { subject: "焦慮", A: 3, fullMark: 10 },
  { subject: "壓力", A: 7, fullMark: 10 },
  { subject: "情緒穩定", A: 6, fullMark: 10 },
  { subject: "幸福感", A: 5, fullMark: 10 },
  { subject: "社交滿足", A: 4, fullMark: 10 },
  { subject: "自信", A: 6, fullMark: 10 },
]

const emotionalTrendData = [
  { date: "5/15", anxiety: 5, stress: 8, happiness: 4 },
  { date: "5/16", anxiety: 6, stress: 7, happiness: 4 },
  { date: "5/17", anxiety: 4, stress: 6, happiness: 5 },
  { date: "5/18", anxiety: 3, stress: 5, happiness: 6 },
  { date: "5/19", anxiety: 4, stress: 6, happiness: 5 },
  { date: "5/20", anxiety: 3, stress: 4, happiness: 7 },
  { date: "5/21", anxiety: 2, stress: 3, happiness: 8 },
]

// Mock journal entries
const mockJournalEntries = [
  {
    id: 1,
    date: "2023-05-21",
    title: "今天的心情很好",
    content: "今天天氣很好，和朋友一起去公園散步，感覺心情特別愉快。工作上也有進展，完成了一個重要的項目。",
    mood: "happy",
    weather: "sunny",
    tags: ["工作", "朋友", "運動"],
    mediaFiles: [
      { type: "image", name: "公園照片.jpg" },
      { type: "audio", name: "心情記錄.mp3" },
    ],
  },
  {
    id: 2,
    date: "2023-05-20",
    title: "壓力有點大",
    content: "最近工作壓力比較大，需要處理很多事情。不過晚上做了冥想練習，感覺好了一些。",
    mood: "neutral",
    weather: "cloudy",
    tags: ["工作", "壓力", "冥想"],
    mediaFiles: [],
  },
  {
    id: 3,
    date: "2023-05-19",
    title: "學習新技能",
    content: "今天開始學習新的程式語言，雖然有點困難但很有成就感。希望能堅持下去。",
    mood: "happy",
    weather: "sunny",
    tags: ["學習", "程式設計", "成長"],
    mediaFiles: [{ type: "image", name: "學習筆記.jpg" }],
  },
  {
    id: 4,
    date: "2023-05-18",
    title: "家庭聚會",
    content: "和家人一起吃飯，聊了很多有趣的話題。感謝有這樣溫暖的家庭支持。",
    mood: "happy",
    weather: "sunny",
    tags: ["家庭", "感恩", "溫暖"],
    mediaFiles: [],
  },
  {
    id: 5,
    date: "2023-05-17",
    title: "雨天的思考",
    content: "下雨天總是讓人想要安靜地思考。今天在家裡看書，思考了很多人生的問題。",
    mood: "neutral",
    weather: "rainy",
    tags: ["思考", "閱讀", "人生"],
    mediaFiles: [
      { type: "image", name: "雨景.jpg" },
      { type: "audio", name: "雨聲錄音.mp3" },
    ],
  },
  {
    id: 6,
    date: "2023-05-15",
    title: "開始新的健康計畫",
    content:
      "今天開始了新的健康計畫，包括每天30分鐘的有氧運動和飲食控制。感覺很有動力，希望能堅持下去。早上去公園跑步，感覺很舒暢...",
    mood: "happy",
    weather: "sunny",
    tags: ["健康", "運動", "計畫"],
    mediaFiles: [
      { type: "image", name: "晨跑照片.jpg" },
      { type: "audio", name: "心情記錄.mp3" },
    ],
  },
]

export function PsychologicalConsultation() {
  // === 🔄 整合修改開始：state 統一與新增（參考 medical-consultation） ===
  // 將心理檔的聊天 state 統一成與 medical-consultation 相同的型態（Message[]）
  const [activeTab, setActiveTab] = useState("assessment")
  const [emotionalValues, setEmotionalValues] = useState({
    anxiety: 3,
    stress: 7,
    mood: 6,
    happiness: 5,
    social: 4,
    confidence: 6,
  })
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedModel, setSelectedModel] = useState<ModelType>("auto")
  const [mood, setMood] = useState<string | null>(null)
  const [weather, setWeather] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [mediaFiles, setMediaFiles] = useState<{ type: string; url: string; name: string }[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const [loadingMessage, setLoadingMessage] = useState("")
  const [saveSuccess, setSaveSuccess] = useState(false)

  // 這裡把 history 改成與 medical-consultation 相容的 HistoryRecord[]
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // === 聊天相關 state（整合） ===
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([]) // 使用整合後的 Message[]
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // 模型切換提示（來自 medical-consultation）
  const [modelChangeDialogOpen, setModelChangeDialogOpen] = useState(false)
  const [pendingModel, setPendingModel] = useState<ModelType | null>(null)


  const [journalSettings, setJournalSettings] = useState({
    privateMode: true,
    autoSave: true,
    reminderEnabled: false,
    templateEnabled: false,
    exportEnabled: true,
    encryptContent: false,
  })

  const [detectedEmotions, setDetectedEmotions] = useState<
    {
      timestamp: string
      emotions: {
        joy: number
        sadness: number
        anger: number
        fear: number
        surprise: number
        disgust: number
      }
      text: string
    }[]
  >([])
  const [currentEmotion, setCurrentEmotion] = useState<string | null>(null)

  // Journal entries state
  const [journalEntries] = useState(mockJournalEntries)
  const [allEntriesDialogOpen, setAllEntriesDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filteredEntries, setFilteredEntries] = useState(mockJournalEntries)


  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 切換語音輸入
  const toggleVoiceInput = () => {
    setIsVoiceInput(!isVoiceInput)
  }

  // 觸發上傳圖片
  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  // 上傳圖片處理
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

  // 儲存聊天記錄（整合版）
  const handleSaveChat = () => {
    if (messages.length === 0) return

    // 這裡用心理相關的關鍵字示範（可改為情緒分析結果）
    const keywords = ["焦慮", "壓力", "睡眠"] 

    if (currentRecordId) {
      setHistory(prev =>
        prev.map(record =>
          record.id === currentRecordId
            ? { ...record, messages: [...messages], keywords }
            : record
        )
      )
    } else {
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

  // 結束諮詢
  const handleEndConsultation = () => {
    setMessages([])
    setSaveSuccess(false)
    setCurrentRecordId(null)
    setInput("") // 確保輸入欄位清空
    setUploadedImage(null)
  }

  const handleDeleteClick = (id: string) => {
    setRecordToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (recordToDelete) {
      setHistory((prev) => prev.filter((record) => record.id !== recordToDelete))
      if (recordToDelete === currentRecordId) {
        handleEndConsultation()
      }
      setRecordToDelete(null)
      setDeleteDialogOpen(false)
    }
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
    setSaveSuccess(true)
  }

  // 模型切換（採用 medical 的警告機制）
  const handleModelChange = (value: string) => {
    const newModel = value as ModelType
    if (messages.length > 0 && newModel !== selectedModel) {
      setPendingModel(newModel)
      setModelChangeDialogOpen(true)
    } else {
      setSelectedModel(newModel)
    }
  }

  const handleConfirmModelChange = () => {
    if (pendingModel) {
      setSelectedModel(pendingModel)
    }
    setPendingModel(null)
    setModelChangeDialogOpen(false)
  }

  const handleCancelModelChange = () => {
    setPendingModel(null)
    setModelChangeDialogOpen(false)
  }

  // 送出訊息（整合 medical 的 /api/analyze + /api/respond 流程）
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() && !uploadedImage) return

    setSaveSuccess(false)

    const userMessage: Message = { role: "user", content: input.trim(), timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setUploadedImage(null)
    setIsLoading(true)
    setLoadingMessage("正在分析中...")

    try {
      // 第一步：分析（可為情緒 or 內容分析）
      const analyzeResponse = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, image: uploadedImage }),
      })

      if (!analyzeResponse.ok) throw new Error(`分析失敗：${analyzeResponse.status}`)
      const analyzeData = await analyzeResponse.json()

      setLoadingMessage("生成回覆中...")

      // 第二步：生成回覆
      const respondResponse = await fetch("/api/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentInput,
          analysis: analyzeData.analysis,
          model: selectedModel,
          history: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          image: uploadedImage,
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

      // 送出後觸發情緒分析（若需要）
      // if (userMessage.content) {
      //   try {
      //     await analyzeEmotion(userMessage.content)
      //   } catch (err) {
      //     // 忽略情緒分析錯誤但記錄
      //     console.error("情緒分析錯誤：", err)
      //   }
      // }

    } catch (err) {
      console.error("❌ 錯誤:", err)
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "抱歉，目前無法連線到服務。", timestamp: new Date() },
      ])
    } finally {
      setIsLoading(false)
      setLoadingMessage("")
      // 發送後視為未儲存
      setSaveSuccess(false)
    }
  }

  // Filter entries based on search and tags
  useEffect(() => {
    let filtered = journalEntries

    if (searchTerm) {
      filtered = filtered.filter(
        (entry) =>
          entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((entry) => selectedTags.some((tag) => entry.tags.includes(tag)))
    }

    setFilteredEntries(filtered)
  }, [searchTerm, selectedTags, journalEntries])

  const handleEmotionalChange = (key: string, value: number[]) => {
    setEmotionalValues({
      ...emotionalValues,
      [key]: value[0],
    })
  }

  const suggestedQuestions = [
    "我最近感到很焦慮，有什麼方法可以幫助我放鬆？",
    "如何改善睡眠質量？",
    "我該如何處理工作壓力？",
    "如何提高自信心？",
  ]

  const analyzeEmotion = async (text: string) => {
    try {
      const response = await fetch("/api/emotion-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      const emotionData = await response.json()

      const newEmotion = {
        timestamp: new Date().toISOString(),
        emotions: emotionData.emotions,
        text: text,
      }

      setDetectedEmotions((prev) => [...prev, newEmotion])
      setCurrentEmotion(emotionData.primaryEmotion)

      // 更新情緒評估數據
      updateEmotionalValuesFromDetection(emotionData.emotions)
    } catch (error) {
      console.error("情緒分析失敗:", error)
    }
  }

  const updateEmotionalValuesFromDetection = (emotions: any) => {
    // 將偵測到的情緒轉換為評估數值
    const newValues = {
      anxiety: Math.round(emotions.fear * 10),
      stress: Math.round((emotions.anger + emotions.fear) * 5),
      mood: Math.round(10 - emotions.sadness * 10),
      happiness: Math.round(emotions.joy * 10),
      social: emotionalValues.social, // 保持原值
      confidence: Math.round(10 - emotions.fear * 10),
    }

    // 與現有數值平均
    setEmotionalValues((prev) => ({
      anxiety: Math.round((prev.anxiety + newValues.anxiety) / 2),
      stress: Math.round((prev.stress + newValues.stress) / 2),
      mood: Math.round((prev.mood + newValues.mood) / 2),
      happiness: Math.round((prev.happiness + newValues.happiness) / 2),
      social: prev.social,
      confidence: Math.round((prev.confidence + newValues.confidence) / 2),
    }))
  }

  // Get dates that have journal entries
  const getDatesWithEntries = () => {
    return journalEntries.map((entry) => new Date(entry.date))
  }

  // Check if a date has entries
  const hasEntry = (date: Date) => {
    return journalEntries.some((entry) => {
      const entryDate = new Date(entry.date)
      return entryDate.toDateString() === date.toDateString()
    })
  }

  // Get all unique tags
  const getAllTags = () => {
    const allTags = journalEntries.flatMap((entry) => entry.tags)
    return [...new Set(allTags)]
  }

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedTags([])
  }

  return (
    // 添加 flex-col flex-1 讓整個元件可以彈性伸展
    <div className="space-y-4 flex flex-col flex-1">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">心理諮詢</CardTitle>
        {/* 統一將警語放在頂部，與 medical-consultation.tsx 結構一致 */}
        <div className="flex items-center mt-2 text-sm text-gray-500"> 
          <Info size={16} className="mr-2" />
          <span>本系統提供的建議僅供心理輔導與放鬆參考，非臨床診斷用途</span> 
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col"> 
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="assessment">情緒狀態評估</TabsTrigger>
          <TabsTrigger value="chat">心理諮詢機器人</TabsTrigger>
          <TabsTrigger value="history">諮詢記錄</TabsTrigger>
          <TabsTrigger value="journal">心靈便箋</TabsTrigger>
        </TabsList>

        {/* 情緒狀態評估 */}
        <TabsContent value="assessment">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Brain className="mr-2 h-5 w-5 text-teal-600" />
                  今日情緒評估
                </h3>
                <span className="text-sm text-gray-500">2023/05/21</span>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>焦慮程度</Label>
                      <span className="text-sm">{emotionalValues.anxiety}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.anxiety]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("anxiety", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>壓力程度</Label>
                      <span className="text-sm">{emotionalValues.stress}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.stress]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("stress", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>情緒穩定度</Label>
                      <span className="text-sm">{emotionalValues.mood}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.mood]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("mood", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>幸福感</Label>
                      <span className="text-sm">{emotionalValues.happiness}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.happiness]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("happiness", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>社交滿足度</Label>
                      <span className="text-sm">{emotionalValues.social}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.social]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("social", value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>自信程度</Label>
                      <span className="text-sm">{emotionalValues.confidence}/10</span>
                    </div>
                    <Slider
                      value={[emotionalValues.confidence]}
                      max={10}
                      step={1}
                      onValueChange={(value) => handleEmotionalChange("confidence", value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    儲存評估
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-teal-600" />
                  情緒分析
                </h3>
              </div>

              <div className="space-y-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={emotionalRadarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 10]} />
                      <Radar name="情緒狀態" dataKey="A" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-teal-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">情緒分析摘要</h4>
                  <p className="text-sm text-gray-700">
                    根據您的評估，目前壓力水平較高（7/10），可能需要關注。
                    情緒穩定度和自信程度中等（6/10），幸福感和社交滿足度略低於平均水平。
                    焦慮程度較低（3/10），這是一個積極的指標。
                  </p>
                  <h4 className="font-medium mt-3 mb-2">建議</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>考慮增加壓力管理活動，如冥想或深呼吸練習</li>
                    <li>增加社交互動以提高社交滿足度</li>
                    <li>保持目前有效的焦慮管理策略</li>
                    <li>嘗試增加能提升幸福感的活動，如戶外活動或愛好</li>
                  </ul>
                </div>

                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">對話情緒分析</h4>
                  {detectedEmotions.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-700">根據您最近的對話內容，系統偵測到以下情緒變化：</p>
                      <div className="space-y-1">
                        {detectedEmotions.slice(-3).map((emotion, index) => (
                          <div key={index} className="text-xs bg-white p-2 rounded border">
                            <div className="flex justify-between items-center">
                              <span className="font-medium">{new Date(emotion.timestamp).toLocaleTimeString()}</span>
                              <div className="flex space-x-2">
                                {Object.entries(emotion.emotions).map(
                                  ([key, value]) =>
                                    value > 0.3 && (
                                      <Badge key={key} variant="outline" className="text-xs">
                                        {key === "joy"
                                          ? "喜悅"
                                          : key === "sadness"
                                            ? "悲傷"
                                            : key === "anger"
                                              ? "憤怒"
                                              : key === "fear"
                                                ? "恐懼"
                                                : key === "surprise"
                                                  ? "驚訝"
                                                  : "厭惡"}
                                        : {Math.round(value * 100)}%
                                      </Badge>
                                    ),
                                )}
                              </div>
                            </div>
                            <p className="text-gray-600 mt-1 truncate">{emotion.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">開始與心理諮詢機器人對話，系統將自動分析您的情緒狀態。</p>
                  )}
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={emotionalTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="anxiety" stroke="#ef4444" name="焦慮" />
                      <Line type="monotone" dataKey="stress" stroke="#f97316" name="壓力" />
                      <Line type="monotone" dataKey="happiness" stroke="#14b8a6" name="幸福感" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-teal-50 p-4 rounded-md">
                  <h4 className="font-medium mb-2">趨勢分析</h4>
                  <p className="text-sm text-gray-700">
                    過去7天的情緒趨勢顯示積極的變化：焦慮和壓力水平持續下降，
                    而幸福感則呈上升趨勢。這表明您最近的情緒管理策略有效。
                  </p>
                  <h4 className="font-medium mt-3 mb-2">關鍵觀察</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    <li>壓力水平從8/10下降到3/10，降幅顯著</li>
                    <li>焦慮程度從5/10下降到2/10</li>
                    <li>幸福感從4/10上升到8/10</li>
                    <li>5/18是情緒轉折點，各指標開始明顯改善</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 心理諮詢機器人 */}
        <TabsContent value="chat" className="flex flex-col flex-1">
          
          {/* 模型選擇區 */}
          <div className="mb-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium text-sm mb-3">選擇對話模型</h3>
            <RadioGroup value={selectedModel} onValueChange={handleModelChange}>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="auto" id="auto" className="mt-1" />
                  <Label htmlFor="auto">
                    <div className="font-medium">自動選擇（推薦）</div>
                    <div className="text-xs text-gray-600">系統根據訊息內容自動選擇模型</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="gpt" id="gpt" className="mt-1" />
                  <Label htmlFor="gpt">
                    <div className="font-medium">GPT</div>
                    <div className="text-xs text-gray-600">語意豐富、回答完整但較慢</div>
                  </Label>
                </div>
                <div className="flex items-start space-x-3">
                  <RadioGroupItem value="llama" id="llama" className="mt-1" />
                  <Label htmlFor="llama">
                    <div className="font-medium">LLaMA</div>
                    <div className="text-xs text-gray-600">回應快速、簡潔，適合短句互動</div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* 聊天內容區 */}
          <div ref={messagesEndRef} className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-md">
            {messages.length === 0 ? (
              <div className="text-center p-4">
                <h3 className="font-medium text-lg mb-2">歡迎使用心理諮詢助手</h3>
                <p className="text-gray-500 mb-4">您可以描述您的心理困擾或煩惱，我會盡力給予建議</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {["我最近壓力很大怎麼辦？", "有點焦慮，怎麼緩解？", "我失眠該怎麼辦？"].map((q, i) => (
                    <Button key={i} variant="outline" className="justify-start text-left h-auto py-2 bg-transparent font-medium" onClick={() => { setInput(q); setSaveSuccess(false) }}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"}`}
                  >
                    <div
                      className="prose max-w-none text-base"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
                    />
                    {message.role === "assistant" && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs">心理建議</Badge>
                        <Badge variant="outline" className="text-xs">壓力管理</Badge>
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
              ))
            )}

            {/* 顯示上傳圖片（若有） */}
            {uploadedImage && messages.length > 0 && messages[messages.length - 1].role === "user" && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg overflow-hidden">
                  <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded" className="max-h-40 object-contain" />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100">
                  <p className="text-sm text-gray-600 mb-1">{loadingMessage || "正在回覆..."}</p>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 輸入區塊（與 medical-consultation 同步） */}
          <div className="mt-auto">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
              
              <Textarea 
                value={input} 
                onChange={(e) => { setInput(e.target.value); setSaveSuccess(false) }} 
                placeholder={"請描述您的心理狀況或煩惱..."} 
                className="min-h-[100px]"
                disabled={isLoading}
              />
              
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="icon" onClick={toggleVoiceInput} disabled={isLoading}>
                    <Mic size={18} />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleFileButtonClick} disabled={isLoading}>
                    <ImageIcon size={18} />
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
                
                <div className="flex items-center space-x-2">
                  {saveSuccess && <span className="text-sm text-green-600 font-medium">已儲存</span>}
                  
                  <Button type="button" variant="outline" onClick={handleSaveChat} disabled={messages.length === 0 || saveSuccess}>
                    <Save size={18} className="mr-2" />
                    儲存
                  </Button>
                  
                  <Button type="submit" disabled={(!input.trim() && !uploadedImage) || isLoading} className="bg-teal-600 hover:bg-teal-700">
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

        {/* 諮詢記錄 */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>諮詢記錄</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-6">尚無諮詢記錄</p>
              ) : (
                history.map((r) => (
                  <div key={r.id} className="border rounded-md p-4 mb-3">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">
                          {r.date
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
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {r.keywords.map((k, i) => (
                            <Badge key={i}>{k}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenHistory(r)}>
                          開啟
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => handleDeleteClick(r.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {r.messages[0]?.content.substring(0, 50)}
                      {r.messages[0]?.content.length > 50 && "..."}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 心靈便箋 */}
        <TabsContent value="journal">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-teal-600" />
                  心靈便箋
                </h3>
                <span className="text-sm text-gray-500">2023/05/21</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label htmlFor="journal-title" className="text-base mb-2 block">
                      標題
                    </Label>
                    <Input id="journal-title" placeholder="今日便箋標題..." />
                  </div>

                  <div>
                    <Label htmlFor="journal-content" className="text-base mb-2 block">
                      內容
                    </Label>
                    <Textarea
                      id="journal-content"
                      placeholder="記錄今天的感受、事件、想法或反思..."
                      className="min-h-[200px]"
                    />
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">標籤</Label>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">健康</Badge>
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">工作</Badge>
                      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer">家庭</Badge>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 cursor-pointer">學習</Badge>
                      <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer">
                        <Tag className="h-3 w-3 mr-1" />
                        添加標籤
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-base mb-2 block">媒體附件</Label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Upload className="h-4 w-4 mr-1" />
                        <span>上傳檔案</span>
                        <input type="file" className="hidden" accept="image/*,video/*,audio/*" />
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Camera className="h-4 w-4 mr-1" />
                        <span>拍攝照片</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex items-center ${isRecording ? "bg-red-100 text-red-600 border-red-300" : ""}`}
                        onClick={() => {
                          if (isRecording) {
                            setIsRecording(false)
                            setRecordingTime(0)
                            setMediaFiles([
                              ...mediaFiles,
                              {
                                type: "audio",
                                url: "/placeholder.svg?height=40&width=200",
                                name: `錄音_${new Date().toISOString().slice(0, 10)}.mp3`,
                              },
                            ])
                          } else {
                            setIsRecording(true)
                          }
                        }}
                      >
                        <Mic className="h-4 w-4 mr-1" />
                        <span>{isRecording ? `錄音中 ${recordingTime}s` : "錄製語音"}</span>
                      </Button>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <Video className="h-4 w-4 mr-1" />
                        <span>錄製影片</span>
                      </Button>
                    </div>

                    {mediaFiles.length > 0 && (
                      <div className="border rounded-md p-3 space-y-2">
                        <h6 className="text-sm font-medium">已附加的媒體</h6>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {mediaFiles.map((file, index) => (
                            <div key={index} className="border rounded-md p-2 flex flex-col">
                              {file.type === "image" && (
                                <div className="h-20 bg-gray-100 rounded flex items-center justify-center mb-1">
                                  <ImageIcon className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              {file.type === "video" && (
                                <div className="h-20 bg-gray-100 rounded flex items-center justify-center mb-1">
                                  <Video className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              {file.type === "audio" && (
                                <div className="h-10 bg-gray-100 rounded flex items-center justify-center mb-1">
                                  <Volume2 className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-xs truncate">{file.name}</span>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-4 w-4 text-gray-500" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base mb-2 block">今日心情</Label>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        className={`flex-1 ${mood === "happy" ? "bg-green-100 border-green-300" : ""}`}
                        onClick={() => setMood("happy")}
                      >
                        <Smile className="h-5 w-5 text-green-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 mx-2 ${mood === "neutral" ? "bg-blue-100 border-blue-300" : ""}`}
                        onClick={() => setMood("neutral")}
                      >
                        <Meh className="h-5 w-5 text-blue-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 ${mood === "sad" ? "bg-red-100 border-red-300" : ""}`}
                        onClick={() => setMood("sad")}
                      >
                        <Frown className="h-5 w-5 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">今日天氣</Label>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        className={`flex-1 ${weather === "sunny" ? "bg-amber-100 border-amber-300" : ""}`}
                        onClick={() => setWeather("sunny")}
                      >
                        <Sun className="h-5 w-5 text-amber-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 mx-2 ${weather === "cloudy" ? "bg-gray-100 border-gray-300" : ""}`}
                        onClick={() => setWeather("cloudy")}
                      >
                        <Cloud className="h-5 w-5 text-gray-500" />
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 ${weather === "rainy" ? "bg-blue-100 border-blue-300" : ""}`}
                        onClick={() => setWeather("rainy")}
                      >
                        <CloudRain className="h-5 w-5 text-blue-500" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">健康記錄</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>睡眠時間</span>
                        <span>7.5小時</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>運動時間</span>
                        <span>45分鐘</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>水分攝取</span>
                        <span>1800ml</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>壓力指數</span>
                        <span>3/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      便箋設定
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">便箋設定</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="private-mode" className="flex items-center">
                            <Lock className="h-4 w-4 mr-2" />
                            <span>隱私模式</span>
                          </Label>
                          <Switch
                            id="private-mode"
                            checked={journalSettings.privateMode}
                            onCheckedChange={(checked) =>
                              setJournalSettings({ ...journalSettings, privateMode: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-save" className="flex items-center">
                            <Save className="h-4 w-4 mr-2" />
                            <span>自動儲存</span>
                          </Label>
                          <Switch
                            id="auto-save"
                            checked={journalSettings.autoSave}
                            onCheckedChange={(checked) => setJournalSettings({ ...journalSettings, autoSave: checked })}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="reminder" className="flex items-center">
                            <Bell className="h-4 w-4 mr-2" />
                            <span>便箋提醒</span>
                          </Label>
                          <Switch
                            id="reminder"
                            checked={journalSettings.reminderEnabled}
                            onCheckedChange={(checked) =>
                              setJournalSettings({ ...journalSettings, reminderEnabled: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="template" className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            <span>使用模板</span>
                          </Label>
                          <Switch
                            id="template"
                            checked={journalSettings.templateEnabled}
                            onCheckedChange={(checked) =>
                              setJournalSettings({ ...journalSettings, templateEnabled: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="encrypt" className="flex items-center">
                            <EyeOff className="h-4 w-4 mr-2" />
                            <span>內容加密</span>
                          </Label>
                          <Switch
                            id="encrypt"
                            checked={journalSettings.encryptContent}
                            onCheckedChange={(checked) =>
                              setJournalSettings({ ...journalSettings, encryptContent: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <div className="flex space-x-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <MoreHorizontal className="h-4 w-4 mr-2" />
                        更多選項
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        <span>匯出便箋</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="h-4 w-4 mr-2" />
                        <span>預覽模式</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        <span>刪除便箋</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button>
                    <Save className="mr-2 h-4 w-4" />
                    儲存便箋
                  </Button>
                </div>
              </div>

              <div className="pt-6 border-t mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">便箋回顧</h4>
                  <Dialog open={allEntriesDialogOpen} onOpenChange={setAllEntriesDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <List className="h-4 w-4 mr-2" />
                        查看所有便箋
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                      <DialogHeader>
                        <DialogTitle>所有心靈便箋</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* 搜尋和過濾區域 */}
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                placeholder="搜尋便箋標題或內容..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                              />
                            </div>
                            {(searchTerm || selectedTags.length > 0) && (
                              <Button variant="outline" size="sm" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-1" />
                                清除
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm font-medium">標籤過濾</Label>
                            <div className="flex flex-wrap gap-2">
                              {getAllTags().map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => toggleTag(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* 便箋列表 */}
                        <div className="max-h-[50vh] overflow-y-auto space-y-3">
                          {filteredEntries.length > 0 ? (
                            filteredEntries.map((entry) => (
                              <div key={entry.id} className="border rounded-md p-4 hover:bg-gray-50 cursor-pointer">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h5 className="font-medium">{entry.title}</h5>
                                    <p className="text-sm text-gray-500">{entry.date}</p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {entry.mood === "happy" && <Smile className="h-4 w-4 text-green-500" />}
                                    {entry.mood === "neutral" && <Meh className="h-4 w-4 text-blue-500" />}
                                    {entry.mood === "sad" && <Frown className="h-4 w-4 text-red-500" />}

                                    {entry.weather === "sunny" && <Sun className="h-4 w-4 text-amber-500" />}
                                    {entry.weather === "cloudy" && <Cloud className="h-4 w-4 text-gray-500" />}
                                    {entry.weather === "rainy" && <CloudRain className="h-4 w-4 text-blue-500" />}
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">{entry.content}</p>

                                <div className="flex justify-between items-center">
                                  <div className="flex flex-wrap gap-1">
                                    {entry.tags.map((tag, index) => (
                                      <Badge key={index} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>

                                  {entry.mediaFiles.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <h6 className="text-xs font-medium text-gray-500">媒體附件</h6>
                                      <div className="flex flex-wrap gap-2">
                                        {entry.mediaFiles.map((file, fileIndex) => (
                                          <div key={fileIndex} className="relative">
                                            {file.type === "image" ? (
                                              <div className="w-16 h-16 bg-gray-100 rounded border overflow-hidden">
                                                <img
                                                  src="/placeholder.svg?height=64&width=64"
                                                  alt={file.name}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                            ) : file.type === "video" ? (
                                              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                                                <Video className="h-6 w-6 text-gray-400" />
                                              </div>
                                            ) : (
                                              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                                                <Volume2 className="h-6 w-6 text-gray-400" />
                                              </div>
                                            )}
                                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                              {file.type === "image" && <ImageIcon className="h-3 w-3 text-blue-500" />}
                                              {file.type === "video" && <Video className="h-3 w-3 text-purple-500" />}
                                              {file.type === "audio" && <Volume2 className="h-3 w-3 text-green-500" />}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>沒有找到符合條件的便箋</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h5 className="font-medium mb-2">選擇日期</h5>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="border rounded-md p-2"
                      modifiers={{
                        hasEntry: getDatesWithEntries(),
                      }}
                      modifiersStyles={{
                        hasEntry: {
                          backgroundColor: "#dcfce7",
                          color: "#166534",
                          fontWeight: "bold",
                        },
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-2">綠色標記的日期有便箋記錄</p>
                  </div>

                  <div className="md:col-span-2">
                    <h5 className="font-medium mb-2">2023/05/15 便箋</h5>
                    <div className="border rounded-md p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h6 className="font-medium">開始新的健康計畫</h6>
                        <div className="flex space-x-1">
                          <Badge className="bg-teal-100 text-teal-800">健康</Badge>
                          <Badge className="bg-green-100 text-green-800">運動</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        今天開始了新的健康計畫，包括每天30分鐘的有氧運動和飲食控制。
                        感覺很有動力，希望能堅持下去。早上去公園跑步，感覺很舒暢...
                      </p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Smile className="h-4 w-4 text-green-500 mr-1" />
                          <span>心情愉快</span>
                        </div>
                        <div className="flex items-center">
                          <Sun className="h-4 w-4 text-amber-500 mr-1" />
                          <span>晴天</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <h6 className="text-sm font-medium mb-1">媒體附件</h6>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="border rounded-md p-1">
                            <div className="h-16 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-center mt-1 truncate">晨跑照片.jpg</p>
                          </div>
                          <div className="border rounded-md p-1">
                            <div className="h-16 bg-gray-100 rounded flex items-center justify-center">
                              <Volume2 className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-xs text-center mt-1 truncate">心情記錄.mp3</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-4">
                      <Button variant="outline" size="sm">
                        上一篇
                      </Button>
                      <Button variant="outline" size="sm">
                        下一篇
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 刪除確認對話框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除紀錄？</AlertDialogTitle>
            <AlertDialogDescription>刪除後將無法復原。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>確認刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 未儲存即結束提示（簡單版） */}
      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>尚未儲存紀錄</AlertDialogTitle>
            <AlertDialogDescription>您尚未儲存本次諮詢，確認要結束嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setEndDialogOpen(false); handleEndConsultation(); }}>直接結束</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 模型切換警告對話框（來自 medical-consultation） */}
      <AlertDialog open={modelChangeDialogOpen} onOpenChange={setModelChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>切換模型會影響對話一致性</AlertDialogTitle>
            <AlertDialogDescription>您目前已有進行中的對話，切換模型可能導致回覆風格不同。確認要切換嗎？</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelModelChange}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmModelChange}>確認切換</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}