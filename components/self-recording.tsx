"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  BookOpen, 
  Search, 
  CalendarIcon, 
  Save, 
  Smile, 
  Frown, 
  Meh, 
  Sun, 
  Cloud, 
  CloudRain,
  Upload,
  X,
  Image as ImageIcon,
  Video,
  Music,
  File,
  Trash2,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"

// 類型定義
type JournalEntry = {
  id: string
  date: string
  title: string
  content: string
  mood: "happy" | "neutral" | "sad" | "anxious" | "excited"
  weather: "sunny" | "cloudy" | "rainy" | "snowy"
  tags: string[]
  attachments: Attachment[]
  healthData: {
    sleep: number
    exercise: number
    water: number
    stress: number
  }
}

type Attachment = {
  id: string
  name: string
  type: "image" | "video" | "audio" | "document"
  url: string
  size: number
  preview?: string
}

// 心情顏色
const moodColors = {
  happy: { bg: "bg-green-100", text: "text-green-700", icon: Smile },
  excited: { bg: "bg-purple-100", text: "text-purple-700", icon: Sun },
  neutral: { bg: "bg-blue-100", text: "text-blue-700", icon: Meh },
  anxious: { bg: "bg-amber-100", text: "text-amber-700", icon: Cloud },
  sad: { bg: "bg-red-100", text: "text-red-700", icon: Frown }
}

// 天氣圖示
const weatherIcons = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: CloudRain
}

export function SelfRecording({ hideStats = false }: { hideStats?: boolean } = {}) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    title: "",
    content: "",
    mood: "neutral",
    weather: "sunny",
    tags: [],
    attachments: [],
    healthData: { sleep: 7, exercise: 30, water: 1500, stress: 5 }
  })
  const [availableTags, setAvailableTags] = useState<string[]>([
    "健康", "工作", "家庭", "學習", "運動", "睡眠", "壓力", "開心", "焦慮", "疲倦"
  ])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedEntryForView, setSelectedEntryForView] = useState<JournalEntry | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // 載入資料
  useEffect(() => {
    const savedEntries = localStorage.getItem('journalEntries')
    if (savedEntries) {
      try {
        const parsedEntries = JSON.parse(savedEntries)
        // 驗證並修正每個 entry 的資料
        const validatedEntries = parsedEntries.map((entry: any) => ({
          ...entry,
          mood: entry.mood && Object.keys(moodColors).includes(entry.mood) ? entry.mood : "neutral",
          weather: entry.weather && Object.keys(weatherIcons).includes(entry.weather) ? entry.weather : "sunny",
          attachments: entry.attachments || [],
          tags: entry.tags || [],
          healthData: entry.healthData || { sleep: 7, exercise: 30, water: 1500, stress: 5 }
        }))
        setEntries(validatedEntries)
      } catch (error) {
        console.error("Failed to load journal entries:", error)
        setEntries([])
      }
    }
    const savedTags = localStorage.getItem('availableTags')
    if (savedTags) {
      try {
        setAvailableTags(JSON.parse(savedTags))
      } catch (error) {
        console.error("Failed to load tags:", error)
      }
    }
  }, [])

  // 儲存日誌
  const saveJournal = () => {
    if (!currentEntry.title || !currentEntry.content) {
      toast.error("請填寫標題和內容")
      return
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: currentEntry.date || new Date().toISOString().split('T')[0],
      title: currentEntry.title,
      content: currentEntry.content,
      mood: currentEntry.mood as any || "neutral",
      weather: currentEntry.weather as any || "sunny",
      tags: currentEntry.tags || [],
      attachments: currentEntry.attachments || [],
      healthData: currentEntry.healthData || { sleep: 7, exercise: 30, water: 1500, stress: 5 }
    }

    const updatedEntries = [...entries, newEntry]
    setEntries(updatedEntries)
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries))
    
    toast.success("日誌已儲存！")
    
    // 重置表單
    setCurrentEntry({
      date: new Date().toISOString().split('T')[0],
      title: "",
      content: "",
      mood: "neutral",
      weather: "sunny",
      tags: [],
      attachments: [],
      healthData: { sleep: 7, exercise: 30, water: 1500, stress: 5 }
    })
  }

  // 處理檔案上傳
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingFile(true)

    try {
      const newAttachments: Attachment[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} 檔案過大（最大 10MB）`)
          continue
        }

        let fileType: "image" | "video" | "audio" | "document" = "document"
        if (file.type.startsWith('image/')) fileType = "image"
        else if (file.type.startsWith('video/')) fileType = "video"
        else if (file.type.startsWith('audio/')) fileType = "audio"

        const reader = new FileReader()
        
        await new Promise((resolve) => {
          reader.onload = (e) => {
            const preview = e.target?.result as string
            
            newAttachments.push({
              id: Date.now().toString() + i,
              name: file.name,
              type: fileType,
              url: preview,
              size: file.size,
              preview: fileType === "image" || fileType === "video" ? preview : undefined
            })
            resolve(null)
          }
          reader.readAsDataURL(file)
        })
      }

      setCurrentEntry({
        ...currentEntry,
        attachments: [...(currentEntry.attachments || []), ...newAttachments]
      })

      toast.success(`已上傳 ${newAttachments.length} 個檔案`)
    } catch (error) {
      toast.error("上傳失敗")
    } finally {
      setUploadingFile(false)
    }
  }

  // 刪除記錄
  const deleteEntry = (id: string) => {
    if (window.confirm('確定要刪除這篇日誌嗎？')) {
      const updatedEntries = entries.filter(e => e.id !== id)
      setEntries(updatedEntries)
      localStorage.setItem('journalEntries', JSON.stringify(updatedEntries))
      toast.success('日誌已刪除')
      setIsDetailDialogOpen(false)
    }
  }

  // 查看詳細內容
  const viewEntryDetail = (entry: JournalEntry) => {
    setSelectedEntryForView(entry)
    setIsDetailDialogOpen(true)
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Tabs defaultValue="write" className="w-full">
        <TabsList className={`grid w-full ${hideStats ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <TabsTrigger value="write">
            <BookOpen className="mr-2 h-4 w-4" />
            生活記錄
          </TabsTrigger>
          {!hideStats && (
            <TabsTrigger value="stats">
              <TrendingUp className="mr-2 h-4 w-4" />
              統計分析
            </TabsTrigger>
          )}
          <TabsTrigger value="list">
            <Search className="mr-2 h-4 w-4" />
            歷史記錄
          </TabsTrigger>
        </TabsList>

        {/* 生活記錄 */}
        <TabsContent value="write">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-teal-600" />
                  生活記錄
                </h3>
                <Button onClick={saveJournal} className="bg-teal-600 hover:bg-teal-700">
                  <Save className="mr-2 h-4 w-4" />
                  儲存
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <Label htmlFor="title">標題</Label>
                    <Input 
                      id="title"
                      placeholder="今天發生了什麼..." 
                      value={currentEntry.title}
                      onChange={(e) => setCurrentEntry({...currentEntry, title: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">內容</Label>
                    <Textarea 
                      id="content"
                      placeholder="記錄你的想法與感受..." 
                      className="min-h-[200px]"
                      value={currentEntry.content}
                      onChange={(e) => setCurrentEntry({...currentEntry, content: e.target.value})}
                    />
                  </div>

                  {/* 獨立圖片上傳區域 */}
                  <div>
                    <Label>圖片</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        id="image-upload"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">點擊上傳圖片</p>
                        <p className="text-xs text-gray-400 mt-1">支援 JPG, PNG, GIF (最大 10MB)</p>
                      </label>
                    </div>
                    
                    {/* 已上傳圖片預覽 */}
                    {currentEntry.attachments && currentEntry.attachments.filter(a => a.type === 'image').length > 0 && (
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {currentEntry.attachments
                          .filter(att => att.type === 'image')
                          .map((attachment) => (
                            <div key={attachment.id} className="relative group">
                              <img 
                                src={attachment.preview} 
                                alt={attachment.name}
                                className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                              />
                              <button
                                onClick={() => {
                                  setCurrentEntry({
                                    ...currentEntry,
                                    attachments: currentEntry.attachments?.filter(a => a.id !== attachment.id)
                                  })
                                }}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* 其他附件 */}
                  <div>
                    <Label>其他附件</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('video-upload')?.click()}>
                        <Video className="mr-2 h-4 w-4" />
                        影片
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('audio-upload')?.click()}>
                        <Music className="mr-2 h-4 w-4" />
                        音訊
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
                        <File className="mr-2 h-4 w-4" />
                        文件
                      </Button>
                    </div>
                    <input type="file" id="video-upload" accept="video/*" className="hidden" onChange={handleFileUpload} />
                    <input type="file" id="audio-upload" accept="audio/*" className="hidden" onChange={handleFileUpload} />
                    <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} />

                    {currentEntry.attachments && currentEntry.attachments.filter(a => a.type !== 'image').length > 0 && (
                      <div className="mt-2 space-y-2">
                        {currentEntry.attachments
                          .filter(att => att.type !== 'image')
                          .map((attachment) => (
                            <div key={attachment.id} className="flex items-center justify-between text-sm border rounded p-2">
                              <span className="truncate flex items-center">
                                {attachment.type === 'video' && <Video className="h-4 w-4 mr-2" />}
                                {attachment.type === 'audio' && <Music className="h-4 w-4 mr-2" />}
                                {attachment.type === 'document' && <File className="h-4 w-4 mr-2" />}
                                {attachment.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setCurrentEntry({
                                    ...currentEntry,
                                    attachments: currentEntry.attachments?.filter(a => a.id !== attachment.id)
                                  })
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 右側欄 */}
                <div className="space-y-4">
                  <div>
                    <Label>日期</Label>
                    <Input 
                      type="date" 
                      value={currentEntry.date}
                      onChange={(e) => setCurrentEntry({...currentEntry, date: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label>心情</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'happy', icon: Smile, label: '開心' },
                        { value: 'excited', icon: Sun, label: '興奮' },
                        { value: 'neutral', icon: Meh, label: '平靜' },
                        { value: 'anxious', icon: Cloud, label: '焦慮' },
                        { value: 'sad', icon: Frown, label: '難過' }
                      ].map(({ value, icon: Icon, label }) => (
                        <Button
                          key={value}
                          variant="outline"
                          size="sm"
                          className={currentEntry.mood === value ? moodColors[value as keyof typeof moodColors].bg : ''}
                          onClick={() => setCurrentEntry({...currentEntry, mood: value as any})}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>天氣</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'sunny', icon: Sun, label: '晴天' },
                        { value: 'cloudy', icon: Cloud, label: '多雲' },
                        { value: 'rainy', icon: CloudRain, label: '下雨' },
                        { value: 'snowy', icon: CloudRain, label: '下雪' }
                      ].map(({ value, icon: Icon, label }) => (
                        <Button
                          key={value}
                          variant="outline"
                          size="sm"
                          className={currentEntry.weather === value ? 'bg-gray-100' : ''}
                          onClick={() => setCurrentEntry({...currentEntry, weather: value as any})}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>常用標籤</Label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <Badge 
                          key={tag}
                          variant={currentEntry.tags?.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const tags = currentEntry.tags || []
                            if (tags.includes(tag)) {
                              setCurrentEntry({...currentEntry, tags: tags.filter(t => t !== tag)})
                            } else {
                              setCurrentEntry({...currentEntry, tags: [...tags, tag]})
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                      <Badge 
                        variant="outline"
                        className="cursor-pointer border-dashed border-2"
                        onClick={() => {
                          const newTagName = prompt('輸入新標籤名稱：')
                          if (newTagName && newTagName.trim()) {
                            const trimmedTag = newTagName.trim()
                            if (!availableTags.includes(trimmedTag)) {
                              const updatedTags = [...availableTags, trimmedTag]
                              setAvailableTags(updatedTags)
                              localStorage.setItem('availableTags', JSON.stringify(updatedTags))
                            }
                            const tags = currentEntry.tags || []
                            if (!tags.includes(trimmedTag)) {
                              setCurrentEntry({...currentEntry, tags: [...tags, trimmedTag]})
                            }
                          }
                        }}
                      >
                        + 新增
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 統計分析 */}
        {!hideStats && (
          <TabsContent value="stats">
            <Card>
            <CardHeader>
              <CardTitle>統計分析</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">心情分佈</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      entries.reduce((acc, entry) => {
                        acc[entry.mood] = (acc[entry.mood] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([mood, count]) => {
                      const MoodIcon = moodColors[mood as keyof typeof moodColors]?.icon || Smile
                      return (
                        <div key={mood} className="flex items-center gap-3">
                          <MoodIcon className="h-5 w-5" />
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{
                                mood === 'happy' ? '開心' : 
                                mood === 'excited' ? '興奮' :
                                mood === 'neutral' ? '平靜' :
                                mood === 'anxious' ? '焦慮' : '難過'
                              }</span>
                              <span className="text-sm text-gray-500">{count} 次</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-teal-500 h-2 rounded-full"
                                style={{ width: `${(count / entries.length) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">標籤統計</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(entries.flatMap(e => e.tags))).map(tag => {
                      const count = entries.filter(e => e.tags.includes(tag)).length
                      return (
                        <Badge key={tag} variant="secondary">
                          {tag} ({count})
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* 歷史記錄與日曆 */}
        <TabsContent value="list">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側日曆 */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  日曆檢視
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 圖例說明 */}
                  <div className="space-y-2 pb-4 border-b">
                    <p className="text-sm font-medium text-gray-600">心情標記</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(moodColors).map(([mood, { bg, text, icon: Icon }]) => (
                        <div key={mood} className="flex items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${bg}`} />
                          <Icon className="w-3 h-3" />
                          <span className={text}>
                            {mood === 'happy' ? '開心' : 
                             mood === 'excited' ? '興奮' :
                             mood === 'neutral' ? '平靜' :
                             mood === 'anxious' ? '焦慮' : '難過'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* 自定義日曆 */}
                  <div className="calendar-container">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        // 如果選擇的日期有記錄，顯示該記錄
                        if (date) {
                          const dateStr = date.toISOString().split('T')[0]
                          const entry = entries.find(e => e.date === dateStr)
                          if (entry) {
                            viewEntryDetail(entry)
                          }
                        }
                      }}
                      className="rounded-md border"
                      components={{
                        DayContent: ({ date }) => {
                          const dateStr = date.toISOString().split('T')[0]
                          const entry = entries.find(e => e.date === dateStr)
                          const validMood = entry?.mood && Object.keys(moodColors).includes(entry.mood) ? entry.mood : null
                          
                          return (
                            <div className="relative w-full h-full flex flex-col items-center justify-center p-1">
                              <div className={`text-center ${entry ? 'font-semibold' : ''}`}>
                                {date.getDate()}
                              </div>
                              {entry && validMood && (
                                <div 
                                  className={`absolute bottom-0.5 w-4 h-1 rounded-sm ${moodColors[validMood as keyof typeof moodColors].bg} opacity-75`}
                                  title={`心情: ${validMood === 'happy' ? '開心' : 
                                        validMood === 'excited' ? '興奮' :
                                        validMood === 'neutral' ? '平靜' :
                                        validMood === 'anxious' ? '焦慮' : '難過'}`}
                                />
                              )}
                            </div>
                          )
                        }
                      }}
                    />
                  </div>
                  
                  {/* 當月統計 */}
                  <div className="border rounded-lg p-3 bg-gray-50 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">當月統計</h4>
                    {(() => {
                      const currentMonthStr = currentMonth.toISOString().slice(0, 7)
                      const monthEntries = entries.filter(e => e.date.startsWith(currentMonthStr))
                      const moodStats = monthEntries.reduce((acc, entry) => {
                        const mood = entry.mood || 'neutral'
                        acc[mood] = (acc[mood] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                      
                      return (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600">
                            記錄數：{monthEntries.length} 筆
                          </p>
                          {Object.entries(moodStats).length > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {Object.entries(moodStats).map(([mood, count]) => {
                                const validMood = Object.keys(moodColors).includes(mood) ? mood : 'neutral'
                                const Icon = moodColors[validMood as keyof typeof moodColors].icon
                                return (
                                  <div key={mood} className="flex items-center gap-1">
                                    <Icon className="w-3 h-3" />
                                    <span>{count}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                  
                  {/* 選中日期的記錄預覽 */}
                  {selectedDate && (() => {
                    const dateStr = selectedDate.toISOString().split('T')[0]
                    const entry = entries.find(e => e.date === dateStr)
                    if (entry) {
                      const validMood = entry.mood && Object.keys(moodColors).includes(entry.mood) ? entry.mood : "neutral"
                      const MoodIcon = moodColors[validMood as keyof typeof moodColors].icon
                      
                      return (
                        <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">{entry.title}</h4>
                            <MoodIcon className="w-4 h-4" />
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{entry.content}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewEntryDetail(entry)}
                            className="w-full text-xs"
                          >
                            查看詳情
                          </Button>
                        </div>
                      )
                    }
                    return (
                      <div className="border rounded-lg p-3 text-center text-sm text-gray-500">
                        {selectedDate.toLocaleDateString('zh-TW')} 無記錄
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
            
            {/* 右側記錄列表 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>所有記錄</CardTitle>
                    <span className="text-sm text-gray-500">共 {entries.length} 筆</span>
                  </div>
                  
                  {/* 心情篩選器 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">篩選心情：</span>
                    <Button
                      size="sm"
                      variant={selectedMoodFilter === null ? "default" : "outline"}
                      onClick={() => setSelectedMoodFilter(null)}
                    >
                      全部
                    </Button>
                    {Object.entries(moodColors).map(([mood, { bg, icon: Icon }]) => (
                      <Button
                        key={mood}
                        size="sm"
                        variant={selectedMoodFilter === mood ? "default" : "outline"}
                        onClick={() => setSelectedMoodFilter(mood)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="w-3 h-3" />
                        <span className="text-xs">
                          {mood === 'happy' ? '開心' : 
                           mood === 'excited' ? '興奮' :
                           mood === 'neutral' ? '平靜' :
                           mood === 'anxious' ? '焦慮' : '難過'}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  // 根據篩選條件過濾記錄
                  const filteredEntries = selectedMoodFilter 
                    ? entries.filter(entry => entry.mood === selectedMoodFilter)
                    : entries
                  
                  return filteredEntries.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p>{selectedMoodFilter ? '此心情分類無記錄' : '尚無記錄'}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredEntries.slice().reverse().map((entry) => {
                    // 確保 mood 和 weather 有有效值
                    const validMood = entry.mood && Object.keys(moodColors).includes(entry.mood) ? entry.mood : "neutral"
                    const validWeather = entry.weather && Object.keys(weatherIcons).includes(entry.weather) ? entry.weather : "sunny"
                    
                    const MoodIcon = moodColors[validMood as keyof typeof moodColors].icon
                    const WeatherIcon = weatherIcons[validWeather as keyof typeof weatherIcons]
                    const firstImage = entry.attachments?.find(a => a.type === 'image')
                    
                    return (
                      <div 
                        key={entry.id} 
                        className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => viewEntryDetail(entry)}
                      >
                        {/* 縮圖 */}
                        {firstImage ? (
                          <img 
                            src={firstImage.preview} 
                            alt={entry.title}
                            className="w-full h-40 object-cover"
                          />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-teal-100 to-blue-100 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-teal-400" />
                          </div>
                        )}
                        
                        {/* 內容 */}
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold truncate">{entry.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2">{entry.content}</p>
                          
                          {/* 標籤 */}
                          <div className="flex flex-wrap gap-1">
                            {entry.tags?.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {entry.tags?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{entry.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                          
                          {/* 心情和天氣 */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <MoodIcon className="h-4 w-4" />
                              <WeatherIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.date).toLocaleDateString('zh-TW')}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 詳細內容對話框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedEntryForView && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEntryForView.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* 圖片 */}
                {selectedEntryForView.attachments.filter(a => a.type === 'image').length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedEntryForView.attachments
                      .filter(a => a.type === 'image')
                      .map(attachment => (
                        <img 
                          key={attachment.id}
                          src={attachment.preview} 
                          alt={attachment.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ))}
                  </div>
                )}
                
                {/* 內容 */}
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700">{selectedEntryForView.content}</p>
                </div>
                
                {/* 標籤 */}
                {selectedEntryForView.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">標籤：</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntryForView.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 其他附件 */}
                {selectedEntryForView.attachments.filter(a => a.type !== 'image').length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">附件：</p>
                    <div className="space-y-2">
                      {selectedEntryForView.attachments
                        .filter(a => a.type !== 'image')
                        .map(attachment => (
                          <div key={attachment.id} className="flex items-center gap-2 text-sm border rounded p-2">
                            {attachment.type === 'video' && <Video className="h-4 w-4" />}
                            {attachment.type === 'audio' && <Music className="h-4 w-4" />}
                            {attachment.type === 'document' && <File className="h-4 w-4" />}
                            <span>{attachment.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* 底部資訊 */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      {(() => {
                        const validMood = selectedEntryForView.mood && Object.keys(moodColors).includes(selectedEntryForView.mood) 
                          ? selectedEntryForView.mood : "neutral"
                        return React.createElement(moodColors[validMood as keyof typeof moodColors].icon, { className: "h-4 w-4" })
                      })()}
                      <span>{
                        selectedEntryForView.mood === 'happy' ? '開心' : 
                        selectedEntryForView.mood === 'excited' ? '興奮' :
                        selectedEntryForView.mood === 'neutral' ? '平靜' :
                        selectedEntryForView.mood === 'anxious' ? '焦慮' : 
                        selectedEntryForView.mood === 'sad' ? '難過' : '平靜'
                      }</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const validWeather = selectedEntryForView.weather && Object.keys(weatherIcons).includes(selectedEntryForView.weather)
                          ? selectedEntryForView.weather : "sunny"
                        return React.createElement(weatherIcons[validWeather as keyof typeof weatherIcons], { className: "h-4 w-4" })
                      })()}
                      <span>{
                        selectedEntryForView.weather === 'sunny' ? '晴天' : 
                        selectedEntryForView.weather === 'cloudy' ? '多雲' :
                        selectedEntryForView.weather === 'rainy' ? '下雨' : 
                        selectedEntryForView.weather === 'snowy' ? '下雪' : '晴天'
                      }</span>
                    </div>
                    <span>{new Date(selectedEntryForView.date).toLocaleDateString('zh-TW')}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteEntry(selectedEntryForView.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    刪除
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}