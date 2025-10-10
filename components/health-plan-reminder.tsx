"use client"

import { useState } from "react"
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

export function HealthPlanReminder() {
  const [activeTab, setActiveTab] = useState("today")

  const [reminders, setReminders] = useState([
    {
      id: 1,
      title: "有氧運動",
      description: "30分鐘快走或騎自行車",
      time: "18:00 - 18:30",
      type: "exercise",
      completed: false,
      color: "teal",
      notificationEnabled: true,
      snoozed: false,
    },
    {
      id: 2,
      title: "服用維生素",
      description: "每日維生素補充",
      time: "08:00",
      type: "medication",
      completed: false,
      color: "blue",
      notificationEnabled: true,
      snoozed: false,
    },
    {
      id: 3,
      title: "喝水提醒",
      description: "至少喝一杯水(250ml)",
      time: "14:00",
      type: "hydration",
      completed: true,
      color: "green",
      notificationEnabled: true,
      snoozed: false,
    },
    {
      id: 4,
      title: "冥想練習",
      description: "10分鐘正念冥想",
      time: "21:30",
      type: "meditation",
      completed: false,
      color: "purple",
      notificationEnabled: false,
      snoozed: false,
    },
  ])

  const [addReminderOpen, setAddReminderOpen] = useState(false)
  const [reminderSettingsOpen, setReminderSettingsOpen] = useState(false)
  const [selectedReminder, setSelectedReminder] = useState<any>(null)
  const [newReminder, setNewReminder] = useState({
    title: "",
    description: "",
    time: "",
    endTime: "",
    type: "exercise",
    repeat: "none",
    priority: "normal",
  })

  const reminderTypes = [
    { value: "exercise", label: "運動", color: "teal", icon: "💪" },
    { value: "medication", label: "用藥", color: "blue", icon: "💊" },
    { value: "hydration", label: "喝水", color: "green", icon: "💧" },
    { value: "meditation", label: "冥想", color: "purple", icon: "🧘" },
    { value: "meal", label: "用餐", color: "orange", icon: "🍽️" },
    { value: "sleep", label: "睡眠", color: "indigo", icon: "😴" },
    { value: "checkup", label: "檢查", color: "red", icon: "🏥" },
    { value: "other", label: "其他", color: "gray", icon: "📝" },
  ]

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.time) return

    const timeDisplay = newReminder.endTime ? `${newReminder.time} - ${newReminder.endTime}` : newReminder.time

    const reminderType = reminderTypes.find((type) => type.value === newReminder.type)

    const reminder = {
      id: Date.now(),
      title: newReminder.title,
      description: newReminder.description,
      time: timeDisplay,
      type: newReminder.type,
      completed: false,
      color: reminderType?.color || "gray",
      notificationEnabled: true,
      snoozed: false,
    }

    setReminders((prev) => [...prev, reminder])
    setNewReminder({
      title: "",
      description: "",
      time: "",
      endTime: "",
      type: "exercise",
      repeat: "none",
      priority: "normal",
    })
    setAddReminderOpen(false)
    toast({
      title: "提醒已添加",
      description: `${reminder.title} 已成功添加到您的提醒列表`,
    })
  }

  const handleCompleteReminder = (id: number) => {
    setReminders((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, completed: !reminder.completed } : reminder)),
    )
  }

  const handleBellClick = (reminder: any) => {
    setSelectedReminder(reminder)
    setReminderSettingsOpen(true)
  }

  const handleToggleNotification = (id: number) => {
    setReminders((prev) =>
      prev.map((reminder) =>
        reminder.id === id ? { ...reminder, notificationEnabled: !reminder.notificationEnabled } : reminder,
      ),
    )

    const reminder = reminders.find((r) => r.id === id)
    if (reminder) {
      toast({
        title: reminder.notificationEnabled ? "通知已關閉" : "通知已開啟",
        description: `${reminder.title} 的通知已${reminder.notificationEnabled ? "關閉" : "開啟"}`,
      })
    }
  }

  const handleSnoozeReminder = (id: number) => {
    setReminders((prev) =>
      prev.map((reminder) => (reminder.id === id ? { ...reminder, snoozed: !reminder.snoozed } : reminder)),
    )

    const reminder = reminders.find((r) => r.id === id)
    if (reminder) {
      toast({
        title: reminder.snoozed ? "取消延遲" : "延遲提醒",
        description: `${reminder.title} 已${reminder.snoozed ? "取消延遲" : "延遲15分鐘"}`,
      })
    }
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">健康計畫提醒</CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="today">今日提醒</TabsTrigger>
          <TabsTrigger value="upcoming">即將到來</TabsTrigger>
          <TabsTrigger value="settings">提醒設定</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Bell className="mr-2 h-5 w-5 text-teal-600" />
                  今日提醒
                </h3>
                <span className="text-sm text-gray-500">2023/05/21</span>
              </div>

              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`border rounded-md p-4 flex items-center justify-between ${
                      reminder.completed ? "bg-gray-50" : ""
                    } ${reminder.snoozed ? "border-orange-200 bg-orange-50" : ""}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`bg-${reminder.color}-100 p-2 rounded-full`}>
                        <Calendar className={`h-5 w-5 text-${reminder.color}-600`} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${reminder.completed ? "line-through text-gray-500" : ""}`}>
                          {reminder.title}
                          {reminder.snoozed && <Badge className="ml-2 bg-orange-100 text-orange-800">已延遲</Badge>}
                        </h4>
                        <p className={`text-sm ${reminder.completed ? "text-gray-400" : "text-gray-500"}`}>
                          {reminder.description}
                        </p>
                        <div className="flex items-center mt-1">
                          <Clock className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{reminder.time}</span>
                          {!reminder.notificationEnabled && <BellOff className="h-3 w-3 text-gray-400 ml-2" />}
                        </div>
                      </div>
                    </div>
                    <div>
                      {reminder.completed ? (
                        <Badge className="bg-green-100 text-green-800">已完成</Badge>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleCompleteReminder(reminder.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            完成
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleBellClick(reminder)}>
                            {reminder.notificationEnabled ? (
                              <Bell className="h-4 w-4" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-500">
                    今日完成: {reminders.filter((r) => r.completed).length}/{reminders.length}
                  </span>
                </div>
                <Dialog open={addReminderOpen} onOpenChange={setAddReminderOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-1" />
                      添加提醒
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>添加新提醒</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="reminder-type">提醒類型</Label>
                        <Select
                          value={newReminder.type}
                          onValueChange={(value) => setNewReminder((prev) => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇提醒類型" />
                          </SelectTrigger>
                          <SelectContent>
                            {reminderTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <span className="flex items-center">
                                  <span className="mr-2">{type.icon}</span>
                                  {type.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reminder-title">提醒標題</Label>
                        <Input
                          id="reminder-title"
                          placeholder="例如：晨間運動"
                          value={newReminder.title}
                          onChange={(e) => setNewReminder((prev) => ({ ...prev, title: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reminder-description">詳細描述</Label>
                        <Textarea
                          id="reminder-description"
                          placeholder="例如：30分鐘快走或騎自行車"
                          value={newReminder.description}
                          onChange={(e) => setNewReminder((prev) => ({ ...prev, description: e.target.value }))}
                          rows={2}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-time">開始時間</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={newReminder.time}
                            onChange={(e) => setNewReminder((prev) => ({ ...prev, time: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-time">結束時間 (可選)</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={newReminder.endTime}
                            onChange={(e) => setNewReminder((prev) => ({ ...prev, endTime: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="repeat">重複設定</Label>
                        <Select
                          value={newReminder.repeat}
                          onValueChange={(value) => setNewReminder((prev) => ({ ...prev, repeat: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇重複頻率" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不重複</SelectItem>
                            <SelectItem value="daily">每日</SelectItem>
                            <SelectItem value="weekly">每週</SelectItem>
                            <SelectItem value="weekdays">工作日</SelectItem>
                            <SelectItem value="weekends">週末</SelectItem>
                            <SelectItem value="custom">自訂</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">優先級</Label>
                        <Select
                          value={newReminder.priority}
                          onValueChange={(value) => setNewReminder((prev) => ({ ...prev, priority: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇優先級" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">低</SelectItem>
                            <SelectItem value="normal">普通</SelectItem>
                            <SelectItem value="high">高</SelectItem>
                            <SelectItem value="urgent">緊急</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setAddReminderOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={handleAddReminder} disabled={!newReminder.title || !newReminder.time}>
                          添加提醒
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-teal-600" />
                  即將到來的提醒
                </h3>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <span className="text-sm text-gray-500 mr-2">明天</span>
                    2023/05/22
                  </h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-teal-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">重量訓練</h5>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">18:00 - 19:00</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="border rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">服用維生素</h5>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">08:00</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <span className="text-sm text-gray-500 mr-2">後天</span>
                    2023/05/23
                  </h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-teal-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-teal-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">有氧運動</h5>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">18:00 - 18:30</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="border rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">服用維生素</h5>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">08:00</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 flex items-center">
                    <span className="text-sm text-gray-500 mr-2">即將到來</span>
                    預約與檢查
                  </h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-amber-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">牙科檢查</h5>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">2023/06/05 14:30</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="border rounded-md p-3 flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-red-100 p-2 rounded-full">
                          <Calendar className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <h5 className="font-medium">年度健康檢查</h5>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">2023/07/10 09:00</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Settings className="mr-2 h-5 w-5 text-teal-600" />
                  提醒設定
                </h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">通知偏好</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="push-notifications" className="flex-1">
                        推送通知
                      </Label>
                      <Switch id="push-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email-notifications" className="flex-1">
                        電子郵件通知
                      </Label>
                      <Switch id="email-notifications" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sms-notifications" className="flex-1">
                        簡訊通知
                      </Label>
                      <Switch id="sms-notifications" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sound-notifications" className="flex-1">
                        通知聲音
                      </Label>
                      <Switch id="sound-notifications" defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">提醒時間設定</h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>提前提醒時間</Label>
                        <Select defaultValue="15min">
                          <SelectTrigger>
                            <SelectValue placeholder="選擇時間" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5min">5分鐘前</SelectItem>
                            <SelectItem value="15min">15分鐘前</SelectItem>
                            <SelectItem value="30min">30分鐘前</SelectItem>
                            <SelectItem value="1hour">1小時前</SelectItem>
                            <SelectItem value="1day">1天前</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>重複提醒</Label>
                        <Select defaultValue="none">
                          <SelectTrigger>
                            <SelectValue placeholder="選擇頻率" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">不重複</SelectItem>
                            <SelectItem value="5min">每5分鐘</SelectItem>
                            <SelectItem value="15min">每15分鐘</SelectItem>
                            <SelectItem value="30min">每30分鐘</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 提醒設定對話框 */}
      <Dialog open={reminderSettingsOpen} onOpenChange={setReminderSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>提醒設定 - {selectedReminder?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>啟用通知</Label>
              <Switch
                checked={selectedReminder?.notificationEnabled}
                onCheckedChange={() => selectedReminder && handleToggleNotification(selectedReminder.id)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>延遲提醒</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedReminder && handleSnoozeReminder(selectedReminder.id)}
              >
                {selectedReminder?.snoozed ? "取消延遲" : "延遲15分鐘"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>提醒音效</Label>
              <Select defaultValue="default">
                <SelectTrigger>
                  <SelectValue placeholder="選擇音效" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">預設音效</SelectItem>
                  <SelectItem value="gentle">輕柔提醒</SelectItem>
                  <SelectItem value="urgent">緊急提醒</SelectItem>
                  <SelectItem value="silent">靜音</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setReminderSettingsOpen(false)}>
                關閉
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
