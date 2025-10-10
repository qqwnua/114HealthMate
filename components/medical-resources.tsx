"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Book,
  FileText,
  Info,
  ExternalLink,
  Upload,
  Plus,
  Calendar,
  User,
  MapPin,
  Clock,
  Edit,
  Trash2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

export function MedicalResources() {
  const [activeTab, setActiveTab] = useState("search")
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [medicalRecords, setMedicalRecords] = useState([
    {
      id: 1,
      date: "2023/04/15",
      department: "內科門診",
      doctor: "王大明 醫師",
      hospital: "仁愛醫院 內科部",
      diagnosis: "高血壓追蹤",
      symptoms: "高血壓追蹤檢查",
      treatment: "血壓控制良好(118/78 mmHg)，繼續原藥物治療。建議定期監測血壓，保持低鹽飲食和規律運動。",
      medications: ["血管收縮素轉化酶抑制劑 (ACEI) - 每日一次", "鈣通道阻斷劑 - 每日一次"],
      nextVisit: "2023/07/15",
      tags: ["高血壓追蹤"],
      hasFile: true,
    },
    {
      id: 2,
      date: "2023/03/10",
      department: "家醫科門診",
      doctor: "李小芬 醫師",
      hospital: "健康診所",
      diagnosis: "感冒",
      symptoms: "咳嗽、喉嚨痛、輕微發燒",
      treatment: "上呼吸道感染，建議多休息、多喝水。症狀應在7-10天內改善。",
      medications: ["止咳藥 - 每日三次", "退燒藥 - 需要時使用", "抗組織胺 - 每日兩次"],
      nextVisit: null,
      tags: ["感冒"],
      hasFile: false,
    },
  ])

  const [newRecord, setNewRecord] = useState({
    date: "",
    department: "",
    doctor: "",
    hospital: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    medications: "",
    nextVisit: "",
    tags: "",
  })

  const [editRecord, setEditRecord] = useState({
    date: "",
    department: "",
    doctor: "",
    hospital: "",
    diagnosis: "",
    symptoms: "",
    treatment: "",
    medications: "",
    nextVisit: "",
    tags: "",
  })

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const handleSaveRecord = () => {
    const record = {
      id: medicalRecords.length + 1,
      ...newRecord,
      medications: newRecord.medications.split("\n").filter((med) => med.trim()),
      tags: newRecord.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
      hasFile: !!uploadedFile,
    }

    setMedicalRecords([record, ...medicalRecords])
    setNewRecord({
      date: "",
      department: "",
      doctor: "",
      hospital: "",
      diagnosis: "",
      symptoms: "",
      treatment: "",
      medications: "",
      nextVisit: "",
      tags: "",
    })
    setUploadedFile(null)
    setUploadDialogOpen(false)
    toast({
      title: "看診紀錄已新增",
      description: "您的看診紀錄已成功保存",
    })
  }

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record)
    setEditRecord({
      date: record.date,
      department: record.department,
      doctor: record.doctor,
      hospital: record.hospital,
      diagnosis: record.diagnosis,
      symptoms: record.symptoms,
      treatment: record.treatment,
      medications: Array.isArray(record.medications) ? record.medications.join("\n") : record.medications,
      nextVisit: record.nextVisit || "",
      tags: Array.isArray(record.tags) ? record.tags.join(", ") : record.tags,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEditRecord = () => {
    if (!selectedRecord) return

    const updatedRecord = {
      ...selectedRecord,
      ...editRecord,
      medications: editRecord.medications.split("\n").filter((med) => med.trim()),
      tags: editRecord.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag),
    }

    setMedicalRecords((prev) =>
      prev.map((record) => (record.id === selectedRecord.id ? updatedRecord : record)),
    )

    setEditDialogOpen(false)
    setSelectedRecord(null)
    toast({
      title: "看診紀錄已更新",
      description: "您的看診紀錄已成功更新",
    })
  }

  const handleDeleteRecord = (record: any) => {
    setSelectedRecord(record)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteRecord = () => {
    if (!selectedRecord) return

    setMedicalRecords((prev) => prev.filter((record) => record.id !== selectedRecord.id))
    setDeleteDialogOpen(false)
    setSelectedRecord(null)
    toast({
      title: "看診紀錄已刪除",
      description: "您的看診紀錄已成功刪除",
    })
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">醫療資源引導</CardTitle>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="search">資料搜索</TabsTrigger>
          <TabsTrigger value="knowledge">醫療知識</TabsTrigger>
          <TabsTrigger value="records">看診紀錄</TabsTrigger>
          <TabsTrigger value="guides">診療指引</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Search className="mr-2 h-5 w-5 text-teal-600" />
                  醫療資料搜索
                </h3>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <Input placeholder="搜尋醫療資訊、症狀、藥物..." />
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  搜尋
                </Button>
              </div>

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">熱門搜尋</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">高血壓</Badge>
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">糖尿病</Badge>
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">頭痛</Badge>
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">過敏</Badge>
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">失眠</Badge>
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">感冒</Badge>
                    <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200 cursor-pointer">腸胃炎</Badge>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">您的最近搜尋</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">高血壓藥物副作用</span>
                      <span className="text-xs text-gray-500">2023/05/20</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">頭痛與眩暈</span>
                      <span className="text-xs text-gray-500">2023/05/18</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">季節性過敏</span>
                      <span className="text-xs text-gray-500">2023/05/15</span>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">搜尋結果範例</h4>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h5 className="font-medium text-teal-700">高血壓 (本態性高血壓)</h5>
                      <p className="text-sm text-gray-600">
                        高血壓是一種常見的慢性疾病，指血壓持續高於正常水平。正常血壓應低於120/80
                        mmHg，高血壓定義為收縮壓≥140 mmHg和/或舒張壓≥90 mmHg。
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex space-x-2">
                          <Badge variant="outline">疾病</Badge>
                          <Badge variant="outline">慢性病</Badge>
                        </div>
                        <Button variant="link" size="sm" className="h-auto p-0">
                          查看詳情
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-medium text-teal-700">降血壓藥物</h5>
                      <p className="text-sm text-gray-600">
                        常見的降血壓藥物包括利尿劑、β受體阻斷劑、鈣通道阻斷劑、血管緊張素轉換酶抑制劑(ACEI)和血管緊張素II受體阻斷劑(ARB)等。
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex space-x-2">
                          <Badge variant="outline">藥物</Badge>
                          <Badge variant="outline">治療</Badge>
                        </div>
                        <Button variant="link" size="sm" className="h-auto p-0">
                          查看詳情
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Book className="mr-2 h-5 w-5 text-teal-600" />
                  每日醫療知識
                </h3>
                <span className="text-sm text-gray-500">2023/05/21</span>
              </div>

              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">今日健康小知識</h4>
                  <p className="text-sm text-gray-600">
                    適度的有氧運動可以幫助降低血壓。研究表明，每週進行150分鐘中等強度的有氧運動（如快走、游泳或騎自行車）可使收縮壓降低約5-8
                    mmHg。
                  </p>
                  <div className="flex justify-end mt-2">
                    <Button variant="link" size="sm" className="h-auto p-0">
                      了解更多
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">醫療術語解析</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium">收縮壓 (Systolic Pressure)</h5>
                      <p className="text-xs text-gray-600">
                        血壓測量中的上值，代表心臟收縮時血管內的壓力。正常值應低於120 mmHg。
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">舒張壓 (Diastolic Pressure)</h5>
                      <p className="text-xs text-gray-600">
                        血壓測量中的下值，代表心臟舒張時血管內的壓力。正常值應低於80 mmHg。
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">血脂 (Blood Lipids)</h5>
                      <p className="text-xs text-gray-600">
                        血液中的脂肪物質，包括膽固醇和三酸甘油酯。高血脂是心血管疾病的危險因素。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">健康新聞</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium">研究發現：地中海飲食可能降低心臟病風險</h5>
                      <p className="text-xs text-gray-600">
                        最新研究顯示，富含橄欖油、堅果、水果、蔬菜和全穀物的地中海飲食可能使心臟病風險降低約25%。
                      </p>
                      <div className="flex justify-end mt-1">
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          閱讀全文
                        </Button>
                      </div>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">新冠病毒最新研究進展</h5>
                      <p className="text-xs text-gray-600">
                        科學家發現新冠病毒變異株的新特性，可能影響疫苗效力和傳播速度。
                      </p>
                      <div className="flex justify-end mt-1">
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          閱讀全文
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-teal-600" />
                  看診紀錄
                </h3>
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      新增紀錄
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>新增看診紀錄</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">看診日期</Label>
                          <Input
                            id="date"
                            type="date"
                            value={newRecord.date}
                            onChange={(e) => setNewRecord({ ...newRecord, date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department">科別</Label>
                          <Select
                            value={newRecord.department}
                            onValueChange={(value) => setNewRecord({ ...newRecord, department: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="選擇科別" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="內科門診">內科門診</SelectItem>
                              <SelectItem value="家醫科門診">家醫科門診</SelectItem>
                              <SelectItem value="心臟內科">心臟內科</SelectItem>
                              <SelectItem value="胃腸肝膽科">胃腸肝膽科</SelectItem>
                              <SelectItem value="皮膚科">皮膚科</SelectItem>
                              <SelectItem value="骨科">骨科</SelectItem>
                              <SelectItem value="眼科">眼科</SelectItem>
                              <SelectItem value="耳鼻喉科">耳鼻喉科</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="doctor">醫師</Label>
                          <Input
                            id="doctor"
                            placeholder="醫師姓名"
                            value={newRecord.doctor}
                            onChange={(e) => setNewRecord({ ...newRecord, doctor: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="hospital">醫院/診所</Label>
                          <Input
                            id="hospital"
                            placeholder="醫院或診所名稱"
                            value={newRecord.hospital}
                            onChange={(e) => setNewRecord({ ...newRecord, hospital: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="symptoms">主訴症狀</Label>
                        <Textarea
                          id="symptoms"
                          placeholder="描述主要症狀..."
                          value={newRecord.symptoms}
                          onChange={(e) => setNewRecord({ ...newRecord, symptoms: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="diagnosis">診斷</Label>
                        <Input
                          id="diagnosis"
                          placeholder="醫師診斷結果"
                          value={newRecord.diagnosis}
                          onChange={(e) => setNewRecord({ ...newRecord, diagnosis: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="treatment">診斷與處置</Label>
                        <Textarea
                          id="treatment"
                          placeholder="醫師的診斷說明和處置建議..."
                          value={newRecord.treatment}
                          onChange={(e) => setNewRecord({ ...newRecord, treatment: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medications">用藥清單</Label>
                        <Textarea
                          id="medications"
                          placeholder="每行一種藥物，例如：&#10;血管收縮素轉化酶抑制劑 - 每日一次&#10;鈣通道阻斷劑 - 每日一次"
                          value={newRecord.medications}
                          onChange={(e) => setNewRecord({ ...newRecord, medications: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nextVisit">下次回診</Label>
                          <Input
                            id="nextVisit"
                            type="date"
                            value={newRecord.nextVisit}
                            onChange={(e) => setNewRecord({ ...newRecord, nextVisit: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="tags">標籤</Label>
                          <Input
                            id="tags"
                            placeholder="用逗號分隔，例如：高血壓,追蹤"
                            value={newRecord.tags}
                            onChange={(e) => setNewRecord({ ...newRecord, tags: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="file">上傳相關檔案</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                          <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="mt-2 block text-sm font-medium text-gray-900">
                                  點擊上傳檔案或拖拽檔案到此處
                                </span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                  onChange={handleFileUpload}
                                />
                              </label>
                              <p className="mt-1 text-xs text-gray-500">支援 PDF, JPG, PNG, DOC, DOCX 格式</p>
                            </div>
                          </div>
                          {uploadedFile && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <FileText className="h-5 w-5 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-900">{uploadedFile.name}</span>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setUploadedFile(null)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={handleSaveRecord}>儲存紀錄</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <div key={record.id} className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        {record.date} - {record.department}
                        {record.hasFile && <FileText className="h-4 w-4 ml-2 text-blue-500" />}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {record.tags.map((tag, index) => (
                          <Badge key={index}>{tag}</Badge>
                        ))}
                        <Button variant="ghost" size="sm" onClick={() => handleEditRecord(record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteRecord(record)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center text-gray-500">
                          <User className="h-3 w-3 mr-1" />
                          醫師
                        </div>
                        <div>{record.doctor}</div>
                        <div className="flex items-center text-gray-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          診所/醫院
                        </div>
                        <div>{record.hospital}</div>
                        <div className="text-gray-500">主訴</div>
                        <div>{record.symptoms}</div>
                      </div>
                      <div className="pt-2 border-t mt-2">
                        <h5 className="text-sm font-medium mb-1">診斷與處置</h5>
                        <p className="text-sm text-gray-600">{record.treatment}</p>
                      </div>
                      {record.medications.length > 0 && (
                        <div className="pt-2 border-t mt-2">
                          <h5 className="text-sm font-medium mb-1">用藥</h5>
                          <div className="space-y-1 text-sm">
                            {record.medications.map((med, index) => (
                              <div key={index}>
                                {index + 1}. {med}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {record.nextVisit && (
                        <div className="pt-2 border-t mt-2">
                          <h5 className="text-sm font-medium mb-1 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            下次回診
                          </h5>
                          <div className="text-sm">{record.nextVisit}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Info className="mr-2 h-5 w-5 text-teal-600" />
                  診療指引
                </h3>
              </div>

              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center">
                    <Info className="mr-2 h-4 w-4" />
                    非醫療建議聲明
                  </h4>
                  <p className="text-sm text-amber-700">
                    本系統提供的資訊僅供參考，不能替代專業醫療診斷、建議或治療。
                    如有健康問題，請諮詢合格的醫療專業人員。在緊急情況下，請立即就醫或撥打急救電話。
                  </p>
                </div>

                <div className="border rounded-md p-4">
                  <h4 className="font-medium mb-2">常見症狀處理指南</h4>
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium">發燒</h5>
                      <p className="text-xs text-gray-600">
                        成人體溫超過38°C即為發燒。可使用退燒藥物如acetaminophen (普拿疼)，多休息和補充水分。
                        如果發燒超過三天、體溫超過39.4°C或伴隨嚴重症狀，應立即就醫。
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">頭痛</h5>
                      <p className="text-xs text-gray-600">
                        常見頭痛可使用非處方止痛藥如ibuprofen (布洛芬)或acetaminophen (普拿疼)緩解。
                        確保充分休息、補充水分並減少壓力。如果頭痛劇烈、突然發作或伴隨其他症狀如發燒、頸部僵硬，應立即就醫。
                      </p>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium">腹瀉</h5>
                      <p className="text-xs text-gray-600">…</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}