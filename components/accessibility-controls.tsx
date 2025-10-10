"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accessibility, ZoomIn, ZoomOut, Volume2, Sun, Moon, Contrast, X, Eye, Palette } from "lucide-react"

type ColorBlindMode = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "monochrome"

export function AccessibilityControls() {
  const [open, setOpen] = useState(false)
  const [fontSize, setFontSize] = useState(100)
  const [highContrast, setHighContrast] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [currentUtterance, setCurrentUtterance] = useState<SpeechSynthesisUtterance | null>(null)
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindMode>("normal")

  // 初始化時從 localStorage 讀取設定
  useEffect(() => {
    const savedFontSize = localStorage.getItem("accessibility-fontSize")
    const savedHighContrast = localStorage.getItem("accessibility-highContrast")
    const savedDarkMode = localStorage.getItem("accessibility-darkMode")
    const savedTextToSpeech = localStorage.getItem("accessibility-textToSpeech")
    const savedColorBlindMode = localStorage.getItem("accessibility-colorBlindMode") as ColorBlindMode

    if (savedFontSize) setFontSize(Number.parseInt(savedFontSize))
    if (savedHighContrast) setHighContrast(savedHighContrast === "true")
    if (savedDarkMode) setDarkMode(savedDarkMode === "true")
    if (savedTextToSpeech) setTextToSpeechEnabled(savedTextToSpeech === "true")
    if (savedColorBlindMode) setColorBlindMode(savedColorBlindMode)

    // 應用已保存的設定
    applyFontSize(savedFontSize ? Number.parseInt(savedFontSize) : 100)
    applyHighContrast(savedHighContrast === "true")
    applyDarkMode(savedDarkMode === "true")
    applyColorBlindMode(savedColorBlindMode || "normal")
  }, [])

  // 應用字體大小
  const applyFontSize = (size: number) => {
    document.documentElement.style.fontSize = `${size}%`
    localStorage.setItem("accessibility-fontSize", size.toString())
  }

  // 應用高對比模式
  const applyHighContrast = (enabled: boolean) => {
    if (enabled) {
      document.body.classList.add("high-contrast-mode")
    } else {
      document.body.classList.remove("high-contrast-mode")
    }
    localStorage.setItem("accessibility-highContrast", enabled.toString())
  }

  // 應用深色模式
  const applyDarkMode = (enabled: boolean) => {
    if (enabled) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("accessibility-darkMode", enabled.toString())
  }

  // 應用色盲友善模式
  const applyColorBlindMode = (mode: ColorBlindMode) => {
    // 移除所有色盲模式類別
    document.body.classList.remove("protanopia-mode", "deuteranopia-mode", "tritanopia-mode", "monochrome-mode")

    // 添加新的模式類別
    if (mode !== "normal") {
      document.body.classList.add(`${mode}-mode`)
    }

    localStorage.setItem("accessibility-colorBlindMode", mode)
  }

  // 處理字體大小變更
  const handleFontSizeChange = (value: number[]) => {
    const newSize = value[0]
    setFontSize(newSize)
    applyFontSize(newSize)
  }

  // 增大字體
  const increaseFontSize = () => {
    const newSize = Math.min(fontSize + 10, 200)
    setFontSize(newSize)
    applyFontSize(newSize)
  }

  // 縮小字體
  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 10, 80)
    setFontSize(newSize)
    applyFontSize(newSize)
  }

  // 處理高對比模式變更
  const handleHighContrastChange = (checked: boolean) => {
    setHighContrast(checked)
    applyHighContrast(checked)
  }

  // 處理深色模式變更
  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked)
    applyDarkMode(checked)
  }

  // 處理色盲友善模式變更
  const handleColorBlindModeChange = (mode: ColorBlindMode) => {
    setColorBlindMode(mode)
    applyColorBlindMode(mode)
  }

  // 處理文字轉語音變更
  const handleTextToSpeechChange = (checked: boolean) => {
    setTextToSpeechEnabled(checked)
    localStorage.setItem("accessibility-textToSpeech", checked.toString())

    if (checked) {
      // 添加全局點擊事件監聽器
      document.addEventListener("click", handleTextClick)
    } else {
      // 移除全局點擊事件監聽器
      document.removeEventListener("click", handleTextClick)
      // 停止當前朗讀
      if (speaking) {
        window.speechSynthesis.cancel()
        setSpeaking(false)
      }
    }
  }

  // 處理文字點擊事件
  const handleTextClick = (e: MouseEvent) => {
    if (!textToSpeechEnabled) return

    const target = e.target as HTMLElement
    // 排除按鈕、輸入框等交互元素
    if (
      target.tagName === "BUTTON" ||
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.closest("button") ||
      target.closest("a")
    ) {
      return
    }

    // 獲取點擊元素的文字內容
    let text = target.textContent || ""

    // 如果文字太短，嘗試獲取父元素的文字
    if (text.length < 5 && target.parentElement) {
      text = target.parentElement.textContent || ""
    }

    // 如果有足夠的文字內容，進行朗讀
    if (text.trim().length > 5) {
      speakText(text)
    }
  }

  // 朗讀文字
  const speakText = (text: string) => {
    // 如果正在朗讀，先停止
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      if (currentUtterance && currentUtterance.text === text) {
        return // 如果是同一段文字，則不重複朗讀
      }
    }

    const utterance = new SpeechSynthesisUtterance(text)

    // 設置語言為中文
    utterance.lang = "zh-TW"

    // 設置朗讀結束事件
    utterance.onend = () => {
      setSpeaking(false)
      setCurrentUtterance(null)
    }

    // 開始朗讀
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
    setCurrentUtterance(utterance)
  }

  // 停止朗讀
  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
    setCurrentUtterance(null)
  }

  // 重置所有設定
  const resetAllSettings = () => {
    setFontSize(100)
    setHighContrast(false)
    setDarkMode(false)
    setTextToSpeechEnabled(false)
    setColorBlindMode("normal")

    applyFontSize(100)
    applyHighContrast(false)
    applyDarkMode(false)
    applyColorBlindMode("normal")

    document.removeEventListener("click", handleTextClick)
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }

    localStorage.removeItem("accessibility-fontSize")
    localStorage.removeItem("accessibility-highContrast")
    localStorage.removeItem("accessibility-darkMode")
    localStorage.removeItem("accessibility-textToSpeech")
    localStorage.removeItem("accessibility-colorBlindMode")
  }

  return (
    <>
      {/* SVG 濾鏡定義 */}
      <svg className="color-blind-filters" aria-hidden="true">
        <defs>
          <filter id="protanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0,     0, 0
                      0.558, 0.442, 0,     0, 0
                      0,     0.242, 0.758, 0, 0
                      0,     0,     0,     1, 0"
            />
          </filter>
          <filter id="deuteranopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0,   0, 0
                      0.7,   0.3,   0,   0, 0
                      0,     0.3,   0.7, 0, 0
                      0,     0,     0,   1, 0"
            />
          </filter>
          <filter id="tritanopia-filter">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05,  0,     0, 0
                      0,    0.433, 0.567, 0, 0
                      0,    0.475, 0.525, 0, 0
                      0,    0,     0,     1, 0"
            />
          </filter>
        </defs>
      </svg>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-teal-600 hover:text-teal-800 hover:bg-teal-50">
            <Accessibility size={20} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setOpen(true)}>
            <Accessibility className="mr-2 h-4 w-4" />
            <span>無障礙設定</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={increaseFontSize}>
            <ZoomIn className="mr-2 h-4 w-4" />
            <span>放大字體</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={decreaseFontSize}>
            <ZoomOut className="mr-2 h-4 w-4" />
            <span>縮小字體</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDarkModeChange(!darkMode)}>
            {darkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            <span>{darkMode ? "淺色模式" : "深色模式"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleHighContrastChange(!highContrast)}>
            <Contrast className="mr-2 h-4 w-4" />
            <span>{highContrast ? "標準對比" : "高對比模式"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleTextToSpeechChange(!textToSpeechEnabled)}>
            <Volume2 className="mr-2 h-4 w-4" />
            <span>{textToSpeechEnabled ? "關閉朗讀" : "開啟朗讀"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Accessibility className="h-5 w-5" /> 無障礙設定
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 字體大小設定 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base flex items-center">
                  <ZoomIn className="mr-2 h-4 w-4" /> 字體大小
                </Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={decreaseFontSize} disabled={fontSize <= 80}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[50px] text-center">{fontSize}%</span>
                  <Button variant="outline" size="sm" onClick={increaseFontSize} disabled={fontSize >= 200}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Slider
                value={[fontSize]}
                min={80}
                max={200}
                step={10}
                onValueChange={handleFontSizeChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>小 (80%)</span>
                <span>標準 (100%)</span>
                <span>大 (150%)</span>
                <span>最大 (200%)</span>
              </div>
            </div>

            {/* 視覺模式設定 */}
            <div className="space-y-4">
              <Label className="text-base flex items-center">
                <Eye className="mr-2 h-4 w-4" /> 視覺模式
              </Label>

              {/* 高對比模式 */}
              <div className="flex items-center justify-between">
                <Label className="flex items-center">
                  <Contrast className="mr-2 h-4 w-4" /> 高對比模式
                </Label>
                <Switch checked={highContrast} onCheckedChange={handleHighContrastChange} />
              </div>

              {/* 深淺色模式 */}
              <div className="flex items-center justify-between">
                <Label className="flex items-center">
                  {darkMode ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}{" "}
                  {darkMode ? "深色模式" : "淺色模式"}
                </Label>
                <Switch checked={darkMode} onCheckedChange={handleDarkModeChange} />
              </div>

              {/* 色盲友善模式 */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" /> 色盲友善模式
                </Label>
                <Select value={colorBlindMode} onValueChange={handleColorBlindModeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇色盲友善模式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">正常視覺</SelectItem>
                    <SelectItem value="protanopia">紅色盲 (Protanopia)</SelectItem>
                    <SelectItem value="deuteranopia">綠色盲 (Deuteranopia)</SelectItem>
                    <SelectItem value="tritanopia">藍色盲 (Tritanopia)</SelectItem>
                    <SelectItem value="monochrome">全色盲 (單色模式)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  選擇適合您視覺需求的色彩模式，系統會調整介面色彩以提供更好的辨識度。
                </p>
              </div>
            </div>

            {/* 文字轉語音 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base flex items-center">
                  <Volume2 className="mr-2 h-4 w-4" /> 文字轉語音朗讀
                </Label>
                <Switch checked={textToSpeechEnabled} onCheckedChange={handleTextToSpeechChange} />
              </div>
              {textToSpeechEnabled && (
                <p className="text-xs text-gray-500">點擊任何文字內容即可開始朗讀。避免點擊按鈕和輸入框。</p>
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

            {/* 重置按鈕 */}
            <div className="pt-4 border-t flex justify-end">
              <Button variant="outline" onClick={resetAllSettings} className="text-red-600 hover:text-red-700">
                重置所有設定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
