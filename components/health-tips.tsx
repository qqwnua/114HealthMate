import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Utensils, Dumbbell, Moon } from "lucide-react"

export function HealthTips() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-emerald-600">健康小貼士</CardTitle>
        <CardDescription>根據科學研究的健康建議</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span>一般健康</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              <span>營養</span>
            </TabsTrigger>
            <TabsTrigger value="exercise" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              <span>運動</span>
            </TabsTrigger>
            <TabsTrigger value="sleep" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>睡眠</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">每日健康習慣</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>保持充分水分 - 每天至少喝8杯水</li>
                <li>定期進行健康檢查</li>
                <li>保持良好的姿勢，特別是長時間坐著時</li>
                <li>每天至少進行30分鐘的中等強度活動</li>
                <li>練習正念和壓力管理技巧</li>
                <li>限制酒精攝入並避免吸煙</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">預防疾病的小貼士</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>勤洗手，尤其是在公共場所後</li>
                <li>保持免疫系統健康的均衡飲食</li>
                <li>確保接種最新的疫苗</li>
                <li>避免與生病的人密切接觸</li>
                <li>保持家居和工作環境清潔</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">健康飲食原則</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>增加蔬菜和水果的攝入 - 每天至少5份</li>
                <li>選擇全穀物而不是精製穀物</li>
                <li>限制加工食品和添加糖</li>
                <li>選擇健康的蛋白質來源，如豆類、魚和瘦肉</li>
                <li>使用健康的油脂，如橄欖油和亞麻籽油</li>
                <li>控制鹽的攝入量</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">營養均衡的餐點建議</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>早餐：全麥吐司配雞蛋和蔬菜</li>
                <li>午餐：混合蔬菜沙拉配烤雞胸肉</li>
                <li>晚餐：烤魚配藜麥和蒸蔬菜</li>
                <li>零食：堅果、水果或希臘酸奶</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="exercise" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">運動建議</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>每週至少進行150分鐘的中等強度有氧運動</li>
                <li>每週至少進行兩天的肌肉強化活動</li>
                <li>包括柔韌性和平衡訓練</li>
                <li>選擇您喜歡的活動以保持動力</li>
                <li>逐漸增加運動強度和持續時間</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">適合初學者的運動</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>步行 - 從每天15-20分鐘開始</li>
                <li>游泳 - 低衝擊全身運動</li>
                <li>瑜伽 - 改善柔韌性和平衡</li>
                <li>騎自行車 - 戶外或室內</li>
                <li>輕度阻力訓練 - 使用輕量啞鈴或彈力帶</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="sleep" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">睡眠衛生建議</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>保持規律的睡眠時間表，包括週末</li>
                <li>創造一個舒適、安靜、黑暗和涼爽的睡眠環境</li>
                <li>避免睡前使用電子設備</li>
                <li>限制咖啡因和酒精，特別是在下午和晚上</li>
                <li>睡前放鬆活動，如閱讀或冥想</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">改善睡眠質量的技巧</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>白天保持活躍，但避免睡前劇烈運動</li>
                <li>如果20分鐘內無法入睡，起床做些放鬆活動</li>
                <li>限制白天小睡的時間（不超過30分鐘）</li>
                <li>管理壓力和焦慮</li>
                <li>考慮使用白噪音或放鬆應用程序</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
