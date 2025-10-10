"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Mic, ImageIcon, Send, Info, AlertTriangle } from "lucide-react"
import { useChat } from "ai/react"

export function MedicalConsultation() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/medical-chat",
  })
  const [isVoiceInput, setIsVoiceInput] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleFileButtonClick = () => {
    fileInputRef.current?.click()
  }

  const toggleVoiceInput = () => {
    setIsVoiceInput(!isVoiceInput)
    // Here you would implement actual voice recognition
  }

  const suggestedQuestions = [
    "我最近頭痛很嚴重，可能是什麼原因？",
    "高血壓患者的飲食建議",
    "如何改善睡眠質量？",
    "運動後肌肉酸痛如何緩解？",
  ]

  return (
    <div className="flex flex-col h-[80vh]">
      <CardHeader className="px-0">
        <CardTitle className="text-xl text-teal-600">醫病諮詢語言模型</CardTitle>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Info size={16} className="mr-2" />
          <span>此系統提供的建議僅供參考，不能替代專業醫療診斷</span>
        </div>
      </CardHeader>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="chat">對話諮詢</TabsTrigger>
          <TabsTrigger value="history">諮詢歷史</TabsTrigger>
          <TabsTrigger value="keywords">關鍵字分析</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 border rounded-md">
            {messages.length === 0 && (
              <div className="text-center p-4">
                <h3 className="font-medium text-lg mb-2">歡迎使用醫療諮詢助手</h3>
                <p className="text-gray-500 mb-4">您可以詢問任何健康相關的問題，我會盡力提供幫助</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {suggestedQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => handleInputChange({ target: { value: question } } as any)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user" ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {message.content}
                  {message.role === "assistant" && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {["血壓", "頭痛", "飲食建議"].map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {uploadedImage && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg overflow-hidden">
                  <img src={uploadedImage || "/placeholder.svg"} alt="Uploaded" className="max-h-40 object-contain" />
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 rounded-full bg-teal-600 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-auto">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-2">
              {isVoiceInput ? (
                <div className="border rounded-md p-4 text-center">
                  <p>正在聆聽您的聲音...</p>
                  <Button type="button" variant="outline" className="mt-2" onClick={toggleVoiceInput}>
                    停止錄音
                  </Button>
                </div>
              ) : (
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="請描述您的症狀或健康問題..."
                  className="min-h-[100px]"
                />
              )}

              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" size="icon" onClick={toggleVoiceInput}>
                    <Mic size={18} />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={handleFileButtonClick}>
                    <ImageIcon size={18} />
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
                <Button type="submit" disabled={isLoading || (!input && !uploadedImage)}>
                  <Send size={18} className="mr-2" />
                  發送
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">2023/05/20 諮詢記錄</h3>
                <Badge>頭痛</Badge>
              </div>
              <p className="text-sm text-gray-600">關於持續性頭痛的諮詢，建議進行進一步檢查...</p>
            </div>
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">2023/05/15 諮詢記錄</h3>
                <Badge>過敏</Badge>
              </div>
              <p className="text-sm text-gray-600">季節性過敏症狀的諮詢，建議使用抗組織胺藥物...</p>
            </div>
            <div className="border rounded-md p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">2023/05/10 諮詢記錄</h3>
                <Badge>飲食建議</Badge>
              </div>
              <p className="text-sm text-gray-600">關於高血壓患者的飲食建議諮詢...</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="keywords">
          <div className="space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">常見關鍵字分析</h3>
              <div className="flex flex-wrap gap-2">
                {["頭痛", "過敏", "血壓", "睡眠", "飲食", "運動", "壓力", "感冒", "消化", "皮膚"].map((keyword, i) => (
                  <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="border rounded-md p-4">
              <h3 className="font-medium mb-2">您的常見關鍵字</h3>
              <div className="flex flex-wrap gap-2">
                {["頭痛", "血壓", "睡眠", "壓力"].map((keyword, i) => (
                  <Badge key={i} className="text-sm py-1 px-3 bg-teal-100 text-teal-800 hover:bg-teal-200">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
        <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5" />
        <p className="text-sm text-amber-800">
          請注意：本系統提供的建議僅供參考，不能替代專業醫療診斷。如有緊急情況，請立即就醫或撥打急救電話。
        </p>
      </div>
    </div>
  )
}
