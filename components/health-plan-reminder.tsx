"use client"

import { useState, useEffect } from "react"
// [修改] 移除 useRouter 和 next/navigation 引用
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Calendar, Clock, CheckCircle2, Plus, BellOff, Loader2, Trash2, RefreshCcw, AlertCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

// --- 輔助函式 ---
const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const formatToLocalDate = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- TypeScript 類型定義 ---
interface Reminder {
  id: number;
  user_id: number;
  plan_id?: number;
  title: string;
  description: string | null;
  due_date: string;
  due_time: string;
  completed: boolean;
  notification_enabled: boolean;
  repeat: string;
  advance: string;
}

export function HealthPlanReminder() {
  // [無 useRouter]
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Dialog 狀態
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 表單狀態
  const [newTitle, setNewTitle] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newDate, setNewDate] = useState(getTodayDateString())
  const [newTime, setNewTime] = useState("09:00")
  const [newNotification, setNewNotification] = useState(true)
  const [newRepeat, setNewRepeat] = useState("none")

  // 1. 初始載入
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = localStorage.getItem("userId");
      if (storedId) {
        setUserId(storedId);
      } else {
        setIsLoading(false);
      }
    }
  }, []);

  // 2. 取得資料
  useEffect(() => {
    if (userId) {
      fetchReminders(userId);
    }
  }, [userId]);

  const fetchReminders = async (currentUserId: string) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/reminders?userId=${currentUserId}`)
      if (!res.ok) throw new Error("無法取得資料")
      
      const data = await res.json()
      
      const formattedData = data.map((item: any) => ({
        ...item,
        // 處理時區問題
        due_date: typeof item.due_date === 'string' ? formatToLocalDate(item.due_date) : item.due_date,
        due_time: item.due_time.length > 5 ? item.due_time.slice(0, 5) : item.due_time
      }))

      setReminders(formattedData)
    } catch (error) {
      console.error(error)
      toast({ title: "讀取失敗", description: "無法連線至資料庫", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  // --- 功能：新增 ---
  const handleAddReminder = async () => {
    if (!userId || !newTitle) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          title: newTitle,
          description: newDesc,
          due_date: newDate,
          due_time: newTime,
          notification_enabled: newNotification,
          repeat: newRepeat
        })
      })
      if (!res.ok) throw new Error("新增失敗")
      await fetchReminders(userId)
      setIsDialogOpen(false)
      resetForm()
      toast({ title: "已新增提醒" })
    } catch (error) {
      toast({ title: "新增失敗", variant: "destructive" })
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- 功能：切換狀態 ---
  const toggleComplete = async (id: number, currentStatus: boolean) => {
    if (!userId) return
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !currentStatus } : r))
    try {
      await fetch(`/api/reminders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, completed: !currentStatus })
      })
    } catch (error) {
      setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: currentStatus } : r))
      toast({ title: "更新失敗", variant: "destructive" })
    }
  }

  // --- 功能：刪除 ---
  const deleteReminder = async (id: number) => {
    if (!userId) return
    if (!confirm("確定要刪除此提醒嗎？")) return
    const original = [...reminders]
    setReminders(prev => prev.filter(r => r.id !== id))
    try {
      await fetch(`/api/reminders/${id}?userId=${userId}`, { method: 'DELETE' })
      toast({ title: "已刪除" })
    } catch (error) {
      setReminders(original)
      toast({ title: "刪除失敗", variant: "destructive" })
    }
  }

  const resetForm = () => {
    setNewTitle("")
    setNewDesc("")
    setNewDate(getTodayDateString())
    setNewTime("09:00")
    setNewNotification(true)
    setNewRepeat("none")
  }

  // --- 分類邏輯 ---
  const todayStr = getTodayDateString();
  const todaysReminders = reminders.filter(r => r.due_date === todayStr);
  const upcomingReminders = reminders.filter(r => r.due_date > todayStr);
  const overdueReminders = reminders.filter(r => r.due_date < todayStr && !r.completed);

  // 未登入狀態 (使用傳統跳轉或隱藏)
  if (!userId && !isLoading) {
    return (
      <div className="p-8 text-center max-w-3xl mx-auto">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">請先登入</h3>
        <p className="text-gray-500 mt-2">登入後即可查看您的個人化健康提醒。</p>
        <Button className="mt-4 bg-teal-600" onClick={() => window.location.href = '/login'}>
          前往登入
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto min-h-screen bg-white">
      {/* 頂部標題區 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
          <Bell className="h-6 w-6 text-teal-600"/> 健康計畫提醒
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => userId && fetchReminders(userId)} disabled={isLoading}>
             <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="h-4 w-4 mr-2"/> 新增
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>新增提醒</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">標題</Label>
                  <Input id="title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="例如：喝水" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">描述 (選填)</Label>
                  <Textarea id="desc" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="備註..." className="h-20"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">日期</Label>
                    <Input id="date" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">時間</Label>
                    <Input id="time" type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                   <div className="space-y-2">
                     <Label>重複</Label>
                     <Select value={newRepeat} onValueChange={setNewRepeat}>
                        <SelectTrigger>
                          <SelectValue placeholder="不重複" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">不重複</SelectItem>
                          <SelectItem value="daily">每天</SelectItem>
                          <SelectItem value="weekly">每週</SelectItem>
                        </SelectContent>
                      </Select>
                   </div>
                   <div className="flex items-center space-x-2 pt-6">
                      <Switch id="notify" checked={newNotification} onCheckedChange={setNewNotification} />
                      <Label htmlFor="notify">開啟通知</Label>
                   </div>
                </div>
                <Button onClick={handleAddReminder} className="w-full bg-teal-600 text-white mt-4" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : "確認新增"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 統計概覽 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
         <div className="bg-teal-50 p-3 rounded-lg text-center border border-teal-100 shadow-sm">
           <div className="text-2xl font-bold text-teal-700">{reminders.length}</div>
           <div className="text-xs text-teal-600">全部任務</div>
         </div>
         <div className="bg-orange-50 p-3 rounded-lg text-center border border-orange-100 shadow-sm">
           <div className="text-2xl font-bold text-orange-700">{todaysReminders.length}</div>
           <div className="text-xs text-orange-600">今日待辦</div>
         </div>
         <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100 shadow-sm">
           <div className="text-2xl font-bold text-green-700">{reminders.filter(r => r.completed).length}</div>
           <div className="text-xs text-green-600">已完成</div>
         </div>
      </div>

      {/* Tabs 內容切換 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger value="all">全部列表 ({reminders.length})</TabsTrigger>
          <TabsTrigger value="today">今日任務 ({todaysReminders.length})</TabsTrigger>
          <TabsTrigger value="upcoming">未來排程 ({upcomingReminders.length})</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-4">
            {isLoading && (
                <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-teal-600 mb-2"/>
                    <p className="text-gray-500">資料同步中...</p>
                </div>
            )}

            {!isLoading && reminders.length === 0 && (
                <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <div className="bg-white p-3 rounded-full w-fit mx-auto mb-4 shadow-sm">
                    <Bell className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">目前沒有提醒</h3>
                  <p className="text-sm text-gray-500 mt-2">
                    您可以手動新增，或在健康計畫生成器中建立。
                  </p>
                  {/* [修改] 移除了這裡的跳轉按鈕 */}
                </div>
            )}

            {/* 全部列表 (含逾期) */}
            <TabsContent value="all" className="space-y-3 m-0">
                {overdueReminders.length > 0 && (
                   <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-red-500 font-medium px-1 text-sm">
                        <AlertCircle className="h-4 w-4"/>
                        <span>已逾期 ({overdueReminders.length})</span>
                      </div>
                      {overdueReminders.map(r => (
                        <ReminderCard key={r.id} reminder={r} onToggle={toggleComplete} onDelete={deleteReminder}/>
                      ))}
                   </div>
                )}
                
                {reminders.filter(r => r.due_date >= todayStr || r.completed).map(r => (
                   <ReminderCard key={r.id} reminder={r} onToggle={toggleComplete} onDelete={deleteReminder} />
                ))}
            </TabsContent>

            <TabsContent value="today" className="space-y-3 m-0">
               {!isLoading && todaysReminders.length === 0 && <div className="text-center text-gray-500 py-8">今天暫無任務，好好休息！</div>}
               {todaysReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={toggleComplete} onDelete={deleteReminder}/>)}
            </TabsContent>

            <TabsContent value="upcoming" className="space-y-3 m-0">
               {!isLoading && upcomingReminders.length === 0 && <div className="text-center text-gray-500 py-8">暫無未來排程。</div>}
               {upcomingReminders.map(r => <ReminderCard key={r.id} reminder={r} onToggle={toggleComplete} onDelete={deleteReminder}/>)}
            </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

// --- 單張卡片組件 ---
function ReminderCard({ reminder, onToggle, onDelete }: { reminder: Reminder, onToggle: any, onDelete: any }) {
  return (
    <Card className={`transition-all duration-200 group hover:shadow-md border-l-4 ${
        reminder.completed 
        ? 'bg-gray-50 opacity-70 border-l-gray-300' 
        : 'bg-white border-l-teal-500'
    }`}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4 overflow-hidden flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className={`shrink-0 rounded-full h-8 w-8 ${
                reminder.completed ? 'text-teal-600 bg-teal-50' : 'text-gray-300 hover:text-teal-600 hover:bg-teal-50'
            }`}
            onClick={() => onToggle(reminder.id, reminder.completed)}
          >
            <CheckCircle2 className={`h-6 w-6 ${reminder.completed ? 'fill-current' : ''}`} />
          </Button>
          
          <div className="min-w-0 flex-1">
            <h4 className={`font-medium text-base truncate ${
                reminder.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}>
              {reminder.title}
            </h4>
            
            {reminder.description && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{reminder.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                <Calendar className="h-3 w-3"/> {reminder.due_date}
              </span>
              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                <Clock className="h-3 w-3"/> {reminder.due_time}
              </span>
              {reminder.repeat !== 'none' && (
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                    <RefreshCcw className="h-3 w-3"/> {reminder.repeat === 'daily' ? '每天' : '每週'}
                  </span>
              )}
              {!reminder.notification_enabled && (
                  <span className="flex items-center gap-1 bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">
                    <BellOff className="h-3 w-3"/> 靜音
                  </span>
              )}
            </div>
          </div>
        </div>
        
        <Button 
            variant="ghost" 
            size="icon" 
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-opacity" 
            onClick={() => onDelete(reminder.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}