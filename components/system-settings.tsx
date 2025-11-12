"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type Preferences = {
  notifications: boolean;
  notifyMethods: string[];
  language: string;
  consentAI: boolean;
};

export default function SystemSettings() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId"); // 通常註冊後會從 URL 帶入
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    notifications: true,
    notifyMethods: ["App"],
    language: "zh",
    consentAI: true,
  });

  // 🟢 初次載入抓取資料
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/preferences?userId=${userId}`);
        const data = await res.json();

        if (data && !data.error) {
          setPreferences({
            notifications: data.notifications ?? true,
            notifyMethods: data.notify_methods ?? ["App"],
            language: data.language ?? "zh",
            consentAI: data.consent_ai ?? true,
          });
        }
      } catch (err) {
        console.error("❌ 載入使用者偏好失敗:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, [userId]);

  // 🟢 儲存設定
  const handleSave = async () => {
    if (!userId) {
      alert("找不到使用者 ID");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, userId }),
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ 設定已儲存！");
      } else {
        alert("❌ 儲存失敗：" + (data.error || "未知錯誤"));
      }
    } catch (err) {
      console.error("❌ 更新偏好錯誤:", err);
      alert("伺服器錯誤，請稍後再試。");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 p-6">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">系統設定</CardTitle>
          <CardDescription className="text-center">
            管理您的通知、語言與 AI 同意設定
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 通知設定 */}
          <div className="flex items-center justify-between">
            <Label>啟用健康通知</Label>
            <Switch
              checked={preferences.notifications}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, notifications: checked })
              }
            />
          </div>

          {/* 通知方式 */}
          <div>
            <Label>通知方式</Label>
            <Select
              value={preferences.notifyMethods[0] || "App"}
              onValueChange={(value) =>
                setPreferences({ ...preferences, notifyMethods: [value] })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇通知方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="App">App 通知</SelectItem>
                <SelectItem value="Email">電子郵件</SelectItem>
                <SelectItem value="SMS">簡訊</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 語言設定 */}
          <div>
            <Label>偏好語言</Label>
            <Select
              value={preferences.language}
              onValueChange={(value) =>
                setPreferences({ ...preferences, language: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇語言" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* AI 同意 */}
          <div className="flex items-center justify-between">
            <Label>同意 AI 使用健康資料</Label>
            <Switch
              checked={preferences.consentAI}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, consentAI: checked })
              }
            />
          </div>

          {/* 儲存按鈕 */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "儲存中..." : "儲存設定"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
