"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Clock, Phone, Video, Pill } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

export function TreatmentCollaboration() {
  const [activeTab, setActiveTab] = useState("map")
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      hospital: "仁愛醫院",
      department: "心臟內科",
      date: "2023/06/05",
      time: "上午診 10:30",
      doctor: "王心臟醫師",
      reason: "高血壓追蹤檢查",
    },
    {
      id: 2,
      hospital: "健康家庭醫學科診所",
      department: "家醫科",
      date: "2023/05/25",
      time: "晚間診 19:00",
      doctor: "李家醫醫師",
      reason: "一般健康檢查",
    },
  ])

  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    hospital: "",
    department: "",
    date: "",
    time: "",
    reason: "",
  })

  const handleEditAppointment = (appointment: any) => {
    setSelectedAppointment(appointment)
    setEditForm({
      hospital: appointment.hospital,
      department: appointment.department,
      date: appointment.date,
      time: appointment.time,
      reason: appointment.reason,
    })
    setEditAppointmentOpen(true)
  }

  const handleSaveAppointment = () => {
    if (!editForm.hospital || !editForm.date || !editForm.time) {
      toast({
        title: "請填寫必要資訊",
        description: "醫療機構、日期和時間為必填項目",
        variant: "destructive",
      })
      return
    }

    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === selectedAppointment.id
          ? {
              ...apt,
              hospital: editForm.hospital,
              department: editForm.department,
              date: editForm.date,
              time: editForm.time,
              reason: editForm.reason,
            }
          : apt,
      ),
    )

    setEditAppointmentOpen(false)
    setSelectedAppointment(null)
    toast({
      title: "預約已更新",
      description: "您的預約資訊已成功更新",
    })
  }

  const handleCancelAppointment = (id: number) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== id))
    toast({
      title: "預約已取消",
      description: "您的預約已成功取消",
    })
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">診療合作</CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="map">醫療支援地圖</TabsTrigger>
          <TabsTrigger value="appointment">診所預約</TabsTrigger>
          <TabsTrigger value="online">線上診療</TabsTrigger>
          <TabsTrigger value="prescription">處方箋管理</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <MapPin className="mr-2 h-5 w-5 text-teal-600" />
                  醫療支援地圖
                </h3>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Input placeholder="搜尋附近醫療機構..." />
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="類型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有類型</SelectItem>
                    <SelectItem value="hospital">醫院</SelectItem>
                    <SelectItem value="clinic">診所</SelectItem>
                    <SelectItem value="pharmacy">藥局</SelectItem>
                    <SelectItem value="emergency">急診</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <MapPin className="h-4 w-4 mr-2" />
                  搜尋
                </Button>
              </div>

              <div className="border rounded-md overflow-hidden">
                <div className="h-[300px] bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">醫療機構地圖將顯示在此處</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <h4 className="font-medium">附近醫療機構</h4>
                <div className="space-y-3">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">仁愛醫院</h5>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>台北市大安區仁愛路四段10號</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>02-2709-3600</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline">綜合醫院</Badge>
                          <Badge variant="outline">急診</Badge>
                          <Badge variant="outline">內科</Badge>
                          <Badge variant="outline">外科</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge className="mb-2 bg-green-100 text-green-800">營業中</Badge>
                        <span className="text-xs text-gray-500">距離: 0.8公里</span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button variant="outline" size="sm" className="mr-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        導航
                      </Button>
                      <Button size="sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        預約
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">健康家庭醫學科診所</h5>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>台北市大安區信義路三段134號</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>02-2700-2700</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline">家醫科</Badge>
                          <Badge variant="outline">內科</Badge>
                          <Badge variant="outline">兒科</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge className="mb-2 bg-green-100 text-green-800">營業中</Badge>
                        <span className="text-xs text-gray-500">距離: 1.2公里</span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button variant="outline" size="sm" className="mr-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        導航
                      </Button>
                      <Button size="sm">
                        <Calendar className="h-4 w-4 mr-1" />
                        預約
                      </Button>
                    </div>
                  </div>

                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">康是美藥局</h5>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span>台北市大安區復興南路一段126號</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>02-2711-3611</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline">藥局</Badge>
                          <Badge variant="outline">健保特約</Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <Badge className="mb-2 bg-green-100 text-green-800">營業中</Badge>
                        <span className="text-xs text-gray-500">距離: 0.5公里</span>
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        導航
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointment">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-teal-600" />
                  診所預約功能
                </h3>
              </div>

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">預約新門診</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>醫療機構</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇醫療機構" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="renai">仁愛醫院</SelectItem>
                            <SelectItem value="health">健康家庭醫學科診所</SelectItem>
                            <SelectItem value="taipei">台北醫學大學附設醫院</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>科別</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇科別" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="internal">內科</SelectItem>
                            <SelectItem value="family">家醫科</SelectItem>
                            <SelectItem value="cardio">心臟內科</SelectItem>
                            <SelectItem value="gastro">胃腸肝膽科</SelectItem>
                            <SelectItem value="derma">皮膚科</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>預約日期</Label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <Label>預約時段</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇時段" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">上午診 (09:00-12:00)</SelectItem>
                            <SelectItem value="afternoon">下午診 (14:00-17:00)</SelectItem>
                            <SelectItem value="evening">晚間診 (18:00-21:00)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>就診原因</Label>
                      <Textarea placeholder="簡述就診原因..." />
                    </div>
                    <div className="flex justify-end">
                      <Button>
                        <Calendar className="h-4 w-4 mr-2" />
                        確認預約
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">我的預約</h4>
                  <div className="space-y-3">
                    {appointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-md p-3 flex justify-between items-center">
                        <div>
                          <h5 className="font-medium">
                            {appointment.hospital} - {appointment.department}
                          </h5>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{appointment.date}</span>
                            <Clock className="h-3 w-3 ml-2 mr-1" />
                            <span>{appointment.time}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{appointment.reason}</p>
                        </div>
                        <div className="flex">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            修改
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="online">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Video className="mr-2 h-5 w-5 text-teal-600" />
                  線上診療諮詢
                </h3>
              </div>

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">可預約的線上診療</h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">王大明 醫師 - 內科</h5>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>週一至週五</span>
                          <Clock className="h-3 w-3 ml-2 mr-1" />
                          <span>19:00-21:00</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline">高血壓</Badge>
                          <Badge variant="outline">糖尿病</Badge>
                          <Badge variant="outline">慢性病管理</Badge>
                        </div>
                      </div>
                      <Button size="sm">預約</Button>
                    </div>

                    <div className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">李小芬 醫師 - 家醫科</h5>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>週二、週四、週六</span>
                          <Clock className="h-3 w-3 ml-2 mr-1" />
                          <span>14:00-17:00</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline">一般諮詢</Badge>
                          <Badge variant="outline">兒科</Badge>
                          <Badge variant="outline">預防保健</Badge>
                        </div>
                      </div>
                      <Button size="sm">預約</Button>
                    </div>

                    <div className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">張心理 心理師</h5>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>週一至週日</span>
                          <Clock className="h-3 w-3 ml-2 mr-1" />
                          <span>彈性時間</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          <Badge variant="outline">心理諮商</Badge>
                          <Badge variant="outline">壓力管理</Badge>
                          <Badge variant="outline">情緒調節</Badge>
                        </div>
                      </div>
                      <Button size="sm">預約</Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">我的線上診療預約</h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3 flex justify-between items-center">
                      <div>
                        <h5 className="font-medium">張心理 心理師 - 線上心理諮商</h5>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>2023/05/23</span>
                          <Clock className="h-3 w-3 ml-2 mr-1" />
                          <span>19:30-20:30</span>
                        </div>
                      </div>
                      <div className="flex">
                        <Button variant="outline" size="sm" className="mr-2">
                          <Video className="h-4 w-4 mr-1" />
                          進入會議
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50">
                          取消
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">線上諮詢記錄</h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">王大明 醫師 - 高血壓追蹤</h5>
                        <Badge>已完成</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>2023/05/10</span>
                        <Clock className="h-3 w-3 ml-2 mr-1" />
                        <span>20:00-20:30</span>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <h6 className="text-sm font-medium mb-1">諮詢摘要</h6>
                        <p className="text-sm text-gray-600">
                          血壓控制良好，繼續原藥物治療。建議增加有氧運動頻率，每週至少3次，每次30分鐘。
                        </p>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="link" size="sm" className="h-auto p-0">
                          查看詳情
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prescription">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Pill className="mr-2 h-5 w-5 text-teal-600" />
                  處方箋管理
                </h3>
              </div>

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">我的處方箋</h4>
                  <div className="space-y-3">
                    <div className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">高血壓藥物處方</h5>
                        <Badge className="bg-green-100 text-green-800">有效</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>開立日期: 2023/04/15</span>
                        <Calendar className="h-3 w-3 ml-2 mr-1" />
                        <span>有效期限: 2023/07/15</span>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <h6 className="text-sm font-medium mb-1">藥物清單</h6>
                        <div className="space-y-1 text-sm">
                          <div>1. 血管收縮素轉化酶抑制劑 (ACEI) - 每日一次，早上服用</div>
                          <div>2. 鈣通道阻斷劑 - 每日一次，晚上服用</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <h6 className="text-sm font-medium mb-1">處方醫師</h6>
                        <div className="text-sm">王大明 醫師 - 仁愛醫院內科</div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm" className="mr-2">
                          下載處方箋
                        </Button>
                        <Button size="sm">申請續藥</Button>
                      </div>
                    </div>

                    <div className="border rounded-md p-3">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium">感冒藥物處方</h5>
                        <Badge className="bg-gray-100 text-gray-800">已過期</Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>開立日期: 2023/03/10</span>
                        <Calendar className="h-3 w-3 ml-2 mr-1" />
                        <span>有效期限: 2023/03/17</span>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <h6 className="text-sm font-medium mb-1">藥物清單</h6>
                        <div className="space-y-1 text-sm">
                          <div>1. 止咳藥 - 每日三次，飯後服用</div>
                          <div>2. 退燒藥 - 需要時使用</div>
                          <div>3. 抗組織胺 - 每日兩次，早晚服用</div>
                        </div>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <h6 className="text-sm font-medium mb-1">處方醫師</h6>
                        <div className="text-sm">李小芬 醫師 - 健康診所</div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm">
                          下載處方箋
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-3">線上開立處方箋申請</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>申請類型</Label>
                      <Select defaultValue="refill">
                        <SelectTrigger>
                          <SelectValue placeholder="選擇申請類型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="refill">續藥申請</SelectItem>
                          <SelectItem value="new">新處方申請</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>選擇處方</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇處方" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bp">高血壓藥物處方 (2023/04/15)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>申請原因</Label>
                      <Textarea placeholder="請簡述申請原因..." />
                    </div>
                    <div className="space-y-2">
                      <Label>偏好取藥方式</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇取藥方式" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pharmacy">指定藥局取藥</SelectItem>
                          <SelectItem value="delivery">宅配到府</SelectItem>
                          <SelectItem value="hospital">醫院藥局取藥</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end">
                      <Button>提交申請</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 修改預約對話框 */}
      <Dialog open={editAppointmentOpen} onOpenChange={setEditAppointmentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>修改預約</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>醫療機構</Label>
              <Input
                value={editForm.hospital}
                onChange={(e) => setEditForm((prev) => ({ ...prev, hospital: e.target.value }))}
                placeholder="醫療機構名稱"
              />
            </div>
            <div className="space-y-2">
              <Label>科別</Label>
              <Input
                value={editForm.department}
                onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="科別"
              />
            </div>
            <div className="space-y-2">
              <Label>預約日期</Label>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>預約時間</Label>
              <Input
                value={editForm.time}
                onChange={(e) => setEditForm((prev) => ({ ...prev, time: e.target.value }))}
                placeholder="例如：上午診 10:30"
              />
            </div>
            <div className="space-y-2">
              <Label>就診原因</Label>
              <Textarea
                value={editForm.reason}
                onChange={(e) => setEditForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="就診原因"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setEditAppointmentOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSaveAppointment}>保存修改</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
