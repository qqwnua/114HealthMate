"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Lock,
  Heart,
  Settings,
  Bell,
  Shield,
  LogOut,
  Save,
  Edit,
  ZoomIn,
  ZoomOut,
  Volume2,
  Sun,
  Moon,
  Contrast,
  X,
  Eye,
  Palette,
  Camera,
  Mail,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Accessibility,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type ColorBlindMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "monochrome"

interface UserProfile {
  name: string
  email: string
  phone: string
  avatar: string
  birthDate: string
  gender: string
  address: string
  emergencyContact: string
  emergencyPhone: string
}

interface HealthProfile {
  height: string
  weight: string
  bloodType: string
  allergies: string
  medications: string
  medicalHistory: string
  chronicConditions: string[]
  familyHistory: string
  smokingStatus: string
  alcoholConsumption: string
  exerciseFrequency: string
}

interface SystemPreferences {
  fontSize: number
  highContrast: boolean
  darkMode: boolean
  textToSpeechEnabled: boolean
  colorBlindMode: ColorBlindMode
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  healthReminders: boolean
  appointmentReminders: boolean
  medicationReminders: boolean
  exerciseReminders: boolean
}

export function PersonalizationSettings({
  open,
  onOpenChange,
}: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isEditingHealth, setIsEditingHealth] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  // 用戶資料
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "王小明",
    email: "wang.xiaoming@email.com",
    phone: "0912-345-678",
    avatar: "/placeholder.svg?height=100&width=100",
    birthDate: "1988-05-15",
    gender: "male",
    address: "台北市大安區信義路四段123號",
    emergencyContact: "王小華",
    emergencyPhone: "0987-654-321",
  })

  // 健康資料
  const [healthProfile, setHealthProfile] = useState<HealthProfile>({
    height: "175",
    weight: "70",
    bloodType: "A+",
    allergies: "花粉過敏",
    medications: "維生素D補充劑",
    medicalHistory: "2020年闌尾炎手術",
    chronicConditions: ["高血壓"],
    familyHistory: "父親有糖尿病史",
    smokingStatus: "never",
    alcoholConsumption: "occasional",
    exerciseFrequency: "3-4times",
  })

  // 系統偏好設定
  const [systemPreferences, setSystemPreferences] = useState<SystemPreferences>({
    fontSize: 100,
    highContrast: false,
    darkMode: false,
    textToSpeechEnabled: false,
    colorBlindMode: "normal",
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    healthReminders: true,
    appointmentReminders: true,
    medicationReminders: true,
    exerciseReminders: true,
  })

  // 密碼變更
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // 初始化設定
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = () => {
    // 從 localStorage 載入設定
    const savedPreferences = {
      fontSize: Number.parseInt(localStorage.getItem("accessibility-fontSize") || "100"),
      highContrast: localStorage.getItem("accessibility-highContrast") === "true",
      darkMode: localStorage.getItem("accessibility-darkMode") === "true",
      textToSpeechEnabled: localStorage.getItem("accessibility-textToSpeech") === "true",
      colorBlindMode: (localStorage.getItem("accessibility-colorBlindMode") as ColorBlindMode) || "normal",
      emailNotifications: localStorage.getItem("notification-email") !== "false",
      pushNotifications: localStorage.getItem("notification-push") !== "false",
      smsNotifications: localStorage.getItem("notification-sms") === "true",
      healthReminders: localStorage.getItem("notification-health") !== "false",
      appointmentReminders: localStorage.getItem("notification-appointment") !== "false",
      medicationReminders: localStorage.getItem("notification-medication") !== "false",
      exerciseReminders: localStorage.getItem("notification-exercise") !== "false",
    }
    setSystemPreferences((prev) => ({ ...prev, ...savedPreferences }))
  }

  // 應用系統偏好設定
  const applySystemPreferences = (preferences: SystemPreferences) => {
    document.documentElement.style.fontSize = `${preferences.fontSize}%`

    if (preferences.highContrast) {
      document.body.classList.add("high-contrast-mode")
    } else {
      document.body.classList.remove("high-contrast-mode")
    }

    if (preferences.darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }

    // 色盲友善模式
    document.body.classList.remove("protanopia-mode", "deuteranopia-mode", "tritanopia-mode", "monochrome-mode")
    if (preferences.colorBlindMode !== "normal") {
      document.body.classList.add(`${preferences.colorBlindMode}-mode`)
    }

    // 保存到 localStorage
    localStorage.setItem("accessibility-fontSize", preferences.fontSize.toString())
    localStorage.setItem("accessibility-highContrast", preferences.highContrast.toString())
    localStorage.setItem("accessibility-darkMode", preferences.darkMode.toString())
    localStorage.setItem("accessibility-textToSpeech", preferences.textToSpeechEnabled.toString())
    localStorage.setItem("accessibility-colorBlindMode", preferences.colorBlindMode)
    localStorage.setItem("notification-email", preferences.emailNotifications.toString())
    localStorage.setItem("notification-push", preferences.pushNotifications.toString())
    localStorage.setItem("notification-sms", preferences.smsNotifications.toString())
    localStorage.setItem("notification-health", preferences.healthReminders.toString())
    localStorage.setItem("notification-appointment", preferences.appointmentReminders.toString())
    localStorage.setItem("notification-medication", preferences.medicationReminders.toString())
    localStorage.setItem("notification-exercise", preferences.exerciseReminders.toString())
  }

  const handlePreferenceChange = (key: keyof SystemPreferences, value: any) => {
    const newPreferences = { ...systemPreferences, [key]: value }
    setSystemPreferences(newPreferences)
    applySystemPreferences(newPreferences)
  }

  const handleSaveProfile = () => {
    // 這裡應該調用 API 保存用戶資料
    console.log("保存用戶資料:", userProfile)
    setIsEditingProfile(false)
  }

  const handleSaveHealthProfile = () => {
    // 這裡應該調用 API 保存健康資料
    console.log("保存健康資料:", healthProfile)
    setIsEditingHealth(false)
  }

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("新密碼與確認密碼不符")
      return
    }
    // 這裡應該調用 API 變更密碼
    console.log("變更密碼")
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    setShowPasswordChange(false)
  }

  const handleLogout = () => {
    // 這裡應該調用登出 API
    console.log("用戶登出")
    // 清除本地存儲
    localStorage.clear()
    // 重新載入頁面或導向登入頁
    window.location.reload()
  }

  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5 text-teal-600" /> 個人化設定
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="profile">基本資料</TabsTrigger>
            <TabsTrigger value="health">健康資料</TabsTrigger>
            <TabsTrigger value="preferences">系統偏好</TabsTrigger>
            <TabsTrigger value="security">安全設定</TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[65vh]">
            {/* 基本資料 */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      個人基本資料
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingProfile(!isEditingProfile)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditingProfile ? "取消編輯" : "編輯資料"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 頭像區域 */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={userProfile.avatar || "/placeholder.svg"} alt="用戶頭像" />
                      <AvatarFallback>{userProfile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    {isEditingProfile && (
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        更換頭像
                      </Button>
                    )}
                  </div>

                  {/* 基本資料 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input
                        id="name"
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                        disabled={!isEditingProfile}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">電子郵件</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          type="email"
                          value={userProfile.email}
                          onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">電話號碼</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">出生日期</Label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <Input
                          id="birthDate"
                          type="date"
                          value={userProfile.birthDate}
                          onChange={(e) => setUserProfile({ ...userProfile, birthDate: e.target.value })}
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">性別</Label>
                      <Select
                        value={userProfile.gender}
                        onValueChange={(value) => setUserProfile({ ...userProfile, gender: value })}
                        disabled={!isEditingProfile}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">男性</SelectItem>
                          <SelectItem value="female">女性</SelectItem>
                          <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 地址 */}
                  <div className="space-y-2">
                    <Label htmlFor="address">地址</Label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <Input
                        id="address"
                        value={userProfile.address}
                        onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
                        disabled={!isEditingProfile}
                      />
                    </div>
                  </div>

                  {/* 緊急聯絡人 */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      緊急聯絡人
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergencyContact">聯絡人姓名</Label>
                        <Input
                          id="emergencyContact"
                          value={userProfile.emergencyContact}
                          onChange={(e) => setUserProfile({ ...userProfile, emergencyContact: e.target.value })}
                          disabled={!isEditingProfile}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergencyPhone">聯絡人電話</Label>
                        <Input
                          id="emergencyPhone"
                          value={userProfile.emergencyPhone}
                          onChange={(e) => setUserProfile({ ...userProfile, emergencyPhone: e.target.value })}
                          disabled={!isEditingProfile}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditingProfile && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSaveProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        保存
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 健康資料 */}
            <TabsContent value="health" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      健康基本資料
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsEditingHealth(!isEditingHealth)}>
                      <Edit className="h-4 w-4 mr-2" />
                      {isEditingHealth ? "取消編輯" : "編輯資料"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 基本生理數據 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="height">身高 (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={healthProfile.height}
                        onChange={(e) => setHealthProfile({ ...healthProfile, height: e.target.value })}
                        disabled={!isEditingHealth}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="weight">體重 (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={healthProfile.weight}
                        onChange={(e) => setHealthProfile({ ...healthProfile, weight: e.target.value })}
                        disabled={!isEditingHealth}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bloodType">血型</Label>
                      <Select
                        value={healthProfile.bloodType}
                        onValueChange={(value) => setHealthProfile({ ...healthProfile, bloodType: value })}
                        disabled={!isEditingHealth}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 過敏史 */}
                  <div className="space-y-2">
                    <Label htmlFor="allergies">過敏史</Label>
                    <Textarea
                      id="allergies"
                      value={healthProfile.allergies}
                      onChange={(e) => setHealthProfile({ ...healthProfile, allergies: e.target.value })}
                      placeholder="請列出您的過敏史，如藥物過敏、食物過敏等"
                      disabled={!isEditingHealth}
                    />
                  </div>

                  {/* 目前用藥 */}
                  <div className="space-y-2">
                    <Label htmlFor="medications">目前用藥</Label>
                    <Textarea
                      id="medications"
                      value={healthProfile.medications}
                      onChange={(e) => setHealthProfile({ ...healthProfile, medications: e.target.value })}
                      placeholder="請列出您目前正在服用的藥物"
                      disabled={!isEditingHealth}
                    />
                  </div>

                  {/* 病史 */}
                  <div className="space-y-2">
                    <Label htmlFor="medicalHistory">重要病史</Label>
                    <Textarea
                      id="medicalHistory"
                      value={healthProfile.medicalHistory}
                      onChange={(e) => setHealthProfile({ ...healthProfile, medicalHistory: e.target.value })}
                      placeholder="請列出重要的疾病史或手術史"
                      disabled={!isEditingHealth}
                    />
                  </div>

                  {/* 慢性疾病 */}
                  <div className="space-y-2">
                    <Label>慢性疾病</Label>
                    <div className="flex flex-wrap gap-2">
                      {["高血壓", "糖尿病", "高血脂", "心臟病", "腎臟病", "肝病", "甲狀腺疾病"].map((condition) => (
                        <Badge
                          key={condition}
                          variant={healthProfile.chronicConditions.includes(condition) ? "default" : "outline"}
                          className={`cursor-pointer ${!isEditingHealth ? "pointer-events-none opacity-60" : ""}`}
                          onClick={() => {
                            if (!isEditingHealth) return
                            const conditions = healthProfile.chronicConditions.includes(condition)
                              ? healthProfile.chronicConditions.filter((c) => c !== condition)
                              : [...healthProfile.chronicConditions, condition]
                            setHealthProfile({ ...healthProfile, chronicConditions: conditions })
                          }}
                        >
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 家族病史 */}
                  <div className="space-y-2">
                    <Label htmlFor="familyHistory">家族病史</Label>
                    <Textarea
                      id="familyHistory"
                      value={healthProfile.familyHistory}
                      onChange={(e) => setHealthProfile({ ...healthProfile, familyHistory: e.target.value })}
                      placeholder="請列出家族重要疾病史"
                      disabled={!isEditingHealth}
                    />
                  </div>

                  {/* 生活習慣 */}
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">生活習慣</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>吸煙狀況</Label>
                        <Select
                          value={healthProfile.smokingStatus}
                          onValueChange={(value) => setHealthProfile({ ...healthProfile, smokingStatus: value })}
                          disabled={!isEditingHealth}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">從不吸煙</SelectItem>
                            <SelectItem value="former">已戒煙</SelectItem>
                            <SelectItem value="current">目前吸煙</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>飲酒習慣</Label>
                        <Select
                          value={healthProfile.alcoholConsumption}
                          onValueChange={(value) => setHealthProfile({ ...healthProfile, alcoholConsumption: value })}
                          disabled={!isEditingHealth}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">從不飲酒</SelectItem>
                            <SelectItem value="occasional">偶爾飲酒</SelectItem>
                            <SelectItem value="regular">規律飲酒</SelectItem>
                            <SelectItem value="heavy">大量飲酒</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>運動頻率</Label>
                        <Select
                          value={healthProfile.exerciseFrequency}
                          onValueChange={(value) => setHealthProfile({ ...healthProfile, exerciseFrequency: value })}
                          disabled={!isEditingHealth}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="never">從不運動</SelectItem>
                            <SelectItem value="1-2times">每週1-2次</SelectItem>
                            <SelectItem value="3-4times">每週3-4次</SelectItem>
                            <SelectItem value="daily">每天運動</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {isEditingHealth && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditingHealth(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSaveHealthProfile}>
                        <Save className="h-4 w-4 mr-2" />
                        保存健康資料
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 系統偏好 */}
            <TabsContent value="preferences" className="space-y-6">
              {/* 無障礙設定 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    無障礙設定
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 字體大小設定 */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-base flex items-center">
                        <ZoomIn className="mr-2 h-4 w-4" /> 字體大小
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePreferenceChange("fontSize", Math.max(systemPreferences.fontSize - 10, 80))
                          }
                          disabled={systemPreferences.fontSize <= 80}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium min-w-[50px] text-center">
                          {systemPreferences.fontSize}%
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handlePreferenceChange("fontSize", Math.min(systemPreferences.fontSize + 10, 200))
                          }
                          disabled={systemPreferences.fontSize >= 200}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[systemPreferences.fontSize]}
                      min={80}
                      max={200}
                      step={10}
                      onValueChange={(value) => handlePreferenceChange("fontSize", value[0])}
                      className="w-full"
                    />
                  </div>

                  {/* 視覺模式設定 */}
                  <div className="space-y-4">
                    <Label className="text-base flex items-center">
                      <Eye className="mr-2 h-4 w-4" /> 視覺模式
                    </Label>

                    <div className="flex items-center justify-between">
                      <Label className="flex items-center">
                        <Contrast className="mr-2 h-4 w-4" /> 高對比模式
                      </Label>
                      <Switch
                        checked={systemPreferences.highContrast}
                        onCheckedChange={(checked) => handlePreferenceChange("highContrast", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="flex items-center">
                        {systemPreferences.darkMode ? (
                          <Moon className="mr-2 h-4 w-4" />
                        ) : (
                          <Sun className="mr-2 h-4 w-4" />
                        )}
                        {systemPreferences.darkMode ? "深色模式" : "淺色模式"}
                      </Label>
                      <Switch
                        checked={systemPreferences.darkMode}
                        onCheckedChange={(checked) => handlePreferenceChange("darkMode", checked)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center">
                        <Palette className="mr-2 h-4 w-4" /> 色盲友善模式
                      </Label>
                      <Select
                        value={systemPreferences.colorBlindMode}
                        onValueChange={(value: ColorBlindMode) => handlePreferenceChange("colorBlindMode", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">正常視覺</SelectItem>
                          <SelectItem value="protanopia">紅色盲 (Protanopia)</SelectItem>
                          <SelectItem value="deuteranopia">綠色盲 (Deuteranopia)</SelectItem>
                          <SelectItem value="tritanopia">藍色盲 (Tritanopia)</SelectItem>
                          <SelectItem value="monochrome">全色盲 (單色模式)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* 文字轉語音 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base flex items-center">
                        <Volume2 className="mr-2 h-4 w-4" /> 文字轉語音朗讀
                      </Label>
                      <Switch
                        checked={systemPreferences.textToSpeechEnabled}
                        onCheckedChange={(checked) => handlePreferenceChange("textToSpeechEnabled", checked)}
                      />
                    </div>
                    {systemPreferences.textToSpeechEnabled && (
                      <p className="text-xs text-gray-500">點擊任何文字內容即可開始朗讀。</p>
                    )}
                  </div>

                  {/* 朗讀控制 */}
                  {speaking && (
                    <div className="flex items-center justify-between bg-teal-50 p-3 rounded-md">
                      <span className="text-sm flex items-center">
                        <Volume2 className="mr-2 h-4 w-4 text-teal-600 animate-pulse" /> 正在朗讀...
                      </span>
                      <Button variant="outline" size="sm" onClick={stopSpeaking}>
                        <X className="mr-1 h-3 w-3" /> 停止朗讀
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 通知設定 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    通知設定
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">通知方式</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>電子郵件通知</Label>
                        <Switch
                          checked={systemPreferences.emailNotifications}
                          onCheckedChange={(checked) => handlePreferenceChange("emailNotifications", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>推送通知</Label>
                        <Switch
                          checked={systemPreferences.pushNotifications}
                          onCheckedChange={(checked) => handlePreferenceChange("pushNotifications", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>簡訊通知</Label>
                        <Switch
                          checked={systemPreferences.smsNotifications}
                          onCheckedChange={(checked) => handlePreferenceChange("smsNotifications", checked)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">健康提醒</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>健康計畫提醒</Label>
                        <Switch
                          checked={systemPreferences.healthReminders}
                          onCheckedChange={(checked) => handlePreferenceChange("healthReminders", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>預約提醒</Label>
                        <Switch
                          checked={systemPreferences.appointmentReminders}
                          onCheckedChange={(checked) => handlePreferenceChange("appointmentReminders", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>用藥提醒</Label>
                        <Switch
                          checked={systemPreferences.medicationReminders}
                          onCheckedChange={(checked) => handlePreferenceChange("medicationReminders", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>運動提醒</Label>
                        <Switch
                          checked={systemPreferences.exerciseReminders}
                          onCheckedChange={(checked) => handlePreferenceChange("exerciseReminders", checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 安全設定 */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    安全設定
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 密碼變更 */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">密碼</h4>
                        <p className="text-sm text-gray-500">上次變更：2023年3月15日</p>
                      </div>
                      <Button variant="outline" onClick={() => setShowPasswordChange(!showPasswordChange)}>
                        <Lock className="h-4 w-4 mr-2" />
                        變更密碼
                      </Button>
                    </div>

                    {showPasswordChange && (
                      <div className="space-y-4 p-4 border rounded-md bg-gray-50">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">目前密碼</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">新密碼</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">確認新密碼</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setShowPasswordChange(false)}>
                            取消
                          </Button>
                          <Button onClick={handleChangePassword}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            確認變更
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* 登出 */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">登出帳號</h4>
                        <p className="text-sm text-gray-500">登出並清除本地資料</p>
                      </div>
                      <Button variant="destructive" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" />
                        登出
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
