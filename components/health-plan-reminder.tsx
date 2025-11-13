"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, Clock, CheckCircle2, Settings, Plus, BellOff } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

// --- 輔助函式：獲取 "YYYY-MM-DD" 格式的今天日期 ---
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// --- TypeScript 類型定義 ---
interface Reminder {
  id: number;
  title: string;
  description: string;
  date: string; // "YYYY-MM-DD" 格式
  time: string; // "HH:mm" 格式
  type: string;
  completed: boolean;
  color: string;
  notificationEnabled: boolean;
  snoozed: boolean;
  repeat: 'none' | 'daily' | 'weekly';
  advance: 'none' | '5min' | '10min';
}

export function HealthPlanReminder() {
  const [activeTab, setActiveTab] = useState("today")

  // --- 從 localStorage 讀取提醒資料 (並加入預設日期) ---
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    try {
      const storedReminders = localStorage.getItem('healthReminders');
      if (storedReminders) {
        const parsed = JSON.parse(storedReminders) as any[];
        return parsed.map(r => ({
          ...r,
          date: r.date || getTodayDateString(),
          repeat: r.repeat || 'none',
          advance: r.advance || 'none'
        })) as Reminder[];
      }
    } catch (e) {
      console.error("Failed to load reminders from localStorage", e);
    }
    return []; 
  });

  // --- 自動將變動存回 localStorage ---
  useEffect(() => {
    try {
      localStorage.setItem('healthReminders', JSON.stringify(reminders));
    } catch (e) {
      console.error("Failed to save reminders to localStorage", e);
    }
  }, [reminders]);

  const [isAddReminderOpen, setAddReminderOpen] = useState(false)
  const [isReminderSettingsOpen, setReminderSettingsOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // --- 新增提醒的邏輯 ---
  const addReminder = (newReminder: Omit<Reminder, 'id'>) => {
    const reminderWithId = { ...newReminder, id: Date.now() }
    setReminders(prev => [...prev, reminderWithId])
    toast({
      title: "提醒已新增",
      description: newReminder.title,
    })
  }

  // --- 標記完成的邏輯 ---
  const handleToggleComplete = (id: number) => {
    setReminders(prev =>
      prev.map(r => (r.id === id ? { ...r, completed: !r.completed } : r))
    )
  }

  // --- 開啟「編輯/設定 Dialog」的邏輯 ---
  const handleOpenSettings = (reminder: Reminder) => {
    setEditingReminder({ ...reminder });
    setReminderSettingsOpen(true);
  }

  // --- 處理「編輯 Dialog」中輸入框的變動 ---
  const handleEditInputChange = (field: keyof Reminder, value: any) => {
    if (!editingReminder) return;
    setEditingReminder(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  // --- 儲存「編輯 Dialog」的變更 ---
  const handleSaveEdit = () => {
    if (!editingReminder) return;
    setReminders(prev => 
      prev.map(r => (r.id === editingReminder.id ? editingReminder : r))
    );
    setReminderSettingsOpen(false);
    setEditingReminder(null);
    toast({ title: "提醒已更新" });
  };
  
  // --- 根據日期重新篩選 "今日" 和 "即將到來" ---
  const todayStr = getTodayDateString();
  const todayReminders = reminders.filter(r => r.date === todayStr && !r.completed);
  const upcomingReminders = reminders.filter(r => r.date !== todayStr || r.completed);

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-teal-600">健康計畫提醒</CardTitle>
        <Button onClick={() => setAddReminderOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 新增提醒
        </Button>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">
            <Bell className="mr-2 h-4 w-4" />
            今日提醒 ({todayReminders.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <Calendar className="mr-2 h-4 w-4" />
            即將到來 / 已完成 ({upcomingReminders.length})
          </TabsTrigger>
        </TabsList>

        {/* --- "今日提醒" Tab 內容 --- */}
        <TabsContent value="today" className="space-y-3">
          {todayReminders.length > 0 ? (
            todayReminders.map(reminder => (
              <Card key={reminder.id} className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-8 w-8 rounded-full ${reminder.completed ? "bg-green-100" : ""}`}
                      onClick={() => handleToggleComplete(reminder.id)}
                    >
                      <CheckCircle2 className={`h-5 w-5 ${reminder.completed ? "text-green-600" : "text-gray-400"}`} />
                    </Button>
                    <div>
                      <h4 className="font-medium">{reminder.title}</h4>
                      <p className="text-sm text-gray-500">{reminder.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <span className="font-mono text-sm font-medium">{reminder.time}</span>
                      <span className="font-mono text-xs text-gray-500 block">{reminder.date}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenSettings(reminder)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 pt-4">今天沒有提醒。</p>
          )}
        </TabsContent>

        {/* --- "即將到來" Tab 內容 --- */}
        <TabsContent value="upcoming" className="space-y-3">
          {upcomingReminders.length > 0 ? (
             upcomingReminders.map(reminder => (
              <Card key={reminder.id} className={`shadow-sm ${reminder.completed ? "opacity-70" : ""}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className={`h-8 w-8 rounded-full ${reminder.completed ? "bg-green-100" : ""}`}
                      onClick={() => handleToggleComplete(reminder.id)}
                    >
                      <CheckCircle2 className={`h-5 w-5 ${reminder.completed ? "text-green-600" : "text-gray-400"}`} />
                    </Button>
                    <div>
                      <h4 className={`font-medium ${reminder.completed ? "line-through" : ""}`}>{reminder.title}</h4>
                      <p className="text-sm text-gray-500">{reminder.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <span className="font-mono text-sm font-medium">{reminder.time}</span>
                      <span className="font-mono text-xs text-gray-500 block">{reminder.date}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenSettings(reminder)}>
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
             <p className="text-center text-gray-500 pt-4">沒有即將到來或已完成的提醒。</p>
          )}
        </TabsContent>
      </Tabs>

      {/* --- "新增提醒" Dialog --- */}
      <Dialog open={isAddReminderOpen} onOpenChange={setAddReminderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增提醒</DialogTitle>
          </DialogHeader>
          <AddReminderForm
            onAdd={addReminder}
            onClose={() => setAddReminderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* --- "編輯/設定" Dialog --- */}
      <Dialog open={isReminderSettingsOpen} onOpenChange={setReminderSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯 / 設定提醒</DialogTitle>
          </DialogHeader>
          {editingReminder && (
            <div className="space-y-4 py-4">
              
              <div className="space-y-2">
                <Label htmlFor="edit-title">標題</Label>
                <Input
                  id="edit-title"
                  value={editingReminder.title}
                  onChange={(e) => handleEditInputChange('title', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-desc">描述</Label>
                <Textarea
                  id="edit-desc"
                  value={editingReminder.description}
                  onChange={(e) => handleEditInputChange('description', e.target.value)}
                  placeholder="新增描述..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">日期</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editingReminder.date}
                    onChange={(e) => handleEditInputChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">時間</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editingReminder.time}
                    onChange={(e) => handleEditInputChange('time', e.target.value)}
                  />
                </div>
              </div>
              
              <hr />

              <div className="space-y-2">
                <Label>重複提醒</Label>
                <Select
                  value={editingReminder.repeat}
                  onValueChange={(value) => handleEditInputChange('repeat', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇重複頻率" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不重複</SelectItem>
                    <SelectItem value="daily">每日重複</SelectItem>
                    <SelectItem value="weekly">每週重複</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>提前提醒</Label>
                <Select
                  value={editingReminder.advance}
                  onValueChange={(value) => handleEditInputChange('advance', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇提前時間" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">準時提醒</SelectItem>
                    <SelectItem value="5min">提前 5 分鐘</SelectItem>
                    <SelectItem value="10min">提前 10 分鐘</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <hr />

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-notification" className="flex items-center space-x-2">
                  {editingReminder.notificationEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  <span>開啟通知</span>
                </Label>
                <Switch
                  id="edit-notification"
                  checked={editingReminder.notificationEnabled}
                  onCheckedChange={(checked) => handleEditInputChange('notificationEnabled', checked)}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setReminderSettingsOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit}>
                  儲存變更
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- "新增提醒" 的表單元件 ---
function AddReminderForm({
  onAdd,
  onClose,
}: {
  onAdd: (newReminder: Omit<Reminder, 'id'>) => void
  onClose: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [date, setDate] = useState(getTodayDateString())
  const [time, setTime] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !time || !date) {
      toast({
        title: "缺少資訊",
        description: "請填寫標題、日期和時間。",
        variant: "destructive",
      })
      return
    }
    
    onAdd({
      title,
      description,
      date,
      time,
      type: "general",
      completed: false,
      color: "blue",
      notificationEnabled: true,
      snoozed: false,
      repeat: 'none',
      advance: 'none'
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="new-title">標題</Label>
        <Input
          id="new-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="例如：服用維生素"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-desc">描述 (可選)</Label>
        <Textarea
          id="new-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="例如：每日維生素 D"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="new-date">日期</Label>
          {/* --- [已修正] 這裡就是錯誤的地方 --- */}
          <Input
            id="new-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)} // 'e.gtarget' 已修正為 'e.target'
          />
          {/* --- [修正結束] --- */}
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-time">時間</Label>
          <Input
            id="new-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">
          新增
        </Button>
      </div>
    </form>
  )
}