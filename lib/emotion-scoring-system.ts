// lib/emotion-scoring-system.ts
/**
 * 完整的情緒評分系統
 * 
 * 評分結構：
 * 1. 心靈諮詢對話評分 (50%)
 *    - 近期對話分析評分 (100%)
 * 
 * 2. 歷史對話平均評分 (35%)
 *    - 過去 30 天的對話平均分數
 * 
 * 3. 自我評估與心靈便籤 (15%)
 *    - 自我評估問卷 (85-90%)
 *    - 心靈便籤心情記錄 (10-15%)
 */

export type EmotionScore = {
  totalScore: number              // 總分 (0-100)
  breakdown: {
    recentDialogues: number       // 近期對話評分 (50%)
    historicalDialogues: number   // 歷史對話評分 (35%)
    selfAssessment: number        // 自我評估評分 (12.75-13.5%)
    journalMood: number          // 心靈便籤評分 (1.5-2.25%)
  }
  emotionLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
  suggestions: string[]
  timestamp: string
}

export type DialogueAnalysis = {
  timestamp: string
  userid?: string
  userMessage: string
  aiResponse: string
  emotionDetected: {
    joy: number        // 0-1
    sadness: number    // 0-1
    anger: number      // 0-1
    fear: number       // 0-1
    surprise: number   // 0-1
    disgust: number    // 0-1
  }
  primaryEmotion: string
  emotionScore: number  // 這次對話的情緒分數 0-100
  confidence: number    // 分析信心度 0-1
}

export type JournalMood = 'happy' | 'excited' | 'neutral' | 'anxious' | 'sad'

export type SelfAssessmentData = {
  anxiety: number      // 0-10
  stress: number       // 0-10
  mood: number         // 0-10
  happiness: number    // 0-10
  social: number       // 0-10
  confidence: number   // 0-10
  timestamp: string
}

// 心情基礎分數映射（用於心靈便籤，佔 1.5-2.25%）
const MOOD_SCORES = {
  happy: 95,
  excited: 90,
  neutral: 60,
  anxious: 40,
  sad: 25
}

// 情緒等級判定
function getEmotionLevel(score: number): EmotionScore['emotionLevel'] {
  if (score >= 80) return 'excellent'
  if (score >= 65) return 'good'
  if (score >= 50) return 'fair'
  if (score >= 35) return 'poor'
  return 'critical'
}

// 根據分數生成建議
function generateSuggestions(score: number, breakdown: EmotionScore['breakdown']): string[] {
  const suggestions: string[] = []

  // 根據總分
  if (score < 50) {
    suggestions.push('建議尋求專業心理諮商師的協助')
    suggestions.push('考慮與信任的朋友或家人分享您的感受')
  }

  // 根據近期對話評分
  if (breakdown.recentDialogues < 40) {
    suggestions.push('近期情緒狀態較低，建議增加與 AI 諮詢的互動頻率')
    suggestions.push('嘗試寫下您的感受，有助於情緒整理')
  }

  // 根據歷史趨勢
  if (breakdown.historicalDialogues < breakdown.recentDialogues - 15) {
    suggestions.push('情緒狀態有下降趨勢，請注意自我照顧')
  }

  // 根據自我評估
  if (breakdown.selfAssessment < 30) {
    suggestions.push('自我評估顯示壓力或焦慮較高，建議進行放鬆練習')
    suggestions.push('嘗試深呼吸、冥想或輕度運動來緩解壓力')
  }

  // 正面回饋
  if (score >= 70) {
    suggestions.push('您的情緒狀態保持良好，繼續維持！')
    suggestions.push('可以考慮分享您的正向經驗給需要的人')
  }

  return suggestions.slice(0, 5) // 最多返回 5 條建議
}

/**
 * 計算單次對話的情緒分數（0-100）
 */
export function calculateDialogueScore(emotionData: DialogueAnalysis['emotionDetected']): number {
  // 正面情緒權重
  const positiveScore = emotionData.joy * 100

  // 負面情緒權重（反向計分）
  const negativeScore = (
    emotionData.sadness * 0.8 +
    emotionData.anger * 0.9 +
    emotionData.fear * 0.85 +
    emotionData.disgust * 0.7
  ) * 100

  // 驚訝視為中性
  const neutralScore = emotionData.surprise * 60

  // 綜合計算
  const rawScore = (
    positiveScore * 0.5 +
    (100 - negativeScore) * 0.4 +
    neutralScore * 0.1
  )

  // 限制在 0-100 範圍
  return Math.max(0, Math.min(100, Math.round(rawScore)))
}

/**
 * 計算近期對話的平均分數
 * @param dialogues 近期對話記錄（建議最近 7 天）
 * @returns 近期對話評分 (0-100)
 */
export function calculateRecentDialoguesScore(dialogues: DialogueAnalysis[]): number {
  if (dialogues.length === 0) return 60 // 預設中性分數

  // 計算每次對話的分數
  const scores = dialogues.map(d => d.emotionScore)

  // 使用加權平均，較新的對話權重更高
  let weightedSum = 0
  let totalWeight = 0

  scores.forEach((score, index) => {
    // 越新的對話權重越高（線性遞增）
    const weight = index + 1
    weightedSum += score * weight
    totalWeight += weight
  })

  const averageScore = weightedSum / totalWeight

  return Math.round(averageScore)
}

/**
 * 計算歷史對話的平均分數
 * @param dialogues 歷史對話記錄（過去 30 天）
 * @returns 歷史對話評分 (0-100)
 */
export function calculateHistoricalDialoguesScore(dialogues: DialogueAnalysis[]): number {
  if (dialogues.length === 0) return 60 // 預設中性分數

  const scores = dialogues.map(d => d.emotionScore)
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  return Math.round(averageScore)
}

/**
 * 計算自我評估分數
 * @param assessment 自我評估數據
 * @returns 自我評估分數 (0-100)
 */
export function calculateSelfAssessmentScore(assessment: SelfAssessmentData): number {
  // 正向指標（分數越高越好）
  const positiveScore = (
    assessment.mood +
    assessment.happiness +
    assessment.social +
    assessment.confidence
  ) / 4 * 10

  // 負向指標（分數越低越好，需要反轉）
  const negativeScore = (
    (10 - assessment.anxiety) +
    (10 - assessment.stress)
  ) / 2 * 10

  // 綜合評分（正向 60%，負向 40%）
  const totalScore = positiveScore * 0.6 + negativeScore * 0.4

  return Math.round(totalScore)
}

/**
 * 計算心靈便籤心情分數
 * @param moods 最近的心情記錄（建議最近 7 天）
 * @returns 心靈便籤分數 (0-100)
 */
export function calculateJournalMoodScore(moods: JournalMood[]): number {
  if (moods.length === 0) return 60 // 預設中性分數

  // 計算每個心情的分數
  const scores = moods.map(mood => MOOD_SCORES[mood])

  // 使用加權平均，較新的記錄權重更高
  let weightedSum = 0
  let totalWeight = 0

  scores.forEach((score, index) => {
    const weight = index + 1
    weightedSum += score * weight
    totalWeight += weight
  })

  const averageScore = weightedSum / totalWeight

  return Math.round(averageScore)
}

/**
 * 計算完整的情緒評分
 * @param recentDialogues 近期對話（最近 7 天）
 * @param historicalDialogues 歷史對話（過去 30 天，不含近期）
 * @param selfAssessment 自我評估數據
 * @param journalMoods 心靈便籤心情記錄（最近 7 天）
 * @returns 完整的情緒評分
 */
export function calculateCompleteEmotionScore(
  recentDialogues: DialogueAnalysis[],
  historicalDialogues: DialogueAnalysis[],
  selfAssessment: SelfAssessmentData,
  journalMoods: JournalMood[]
): EmotionScore {
  // 1. 計算近期對話評分（佔 50%）
  const recentScore = calculateRecentDialoguesScore(recentDialogues)

  // 2. 計算歷史對話評分（佔 35%）
  const historicalScore = calculateHistoricalDialoguesScore(historicalDialogues)

  // 3. 計算自我評估分數（佔 12.75-13.5%，這裡取 13%）
  const selfAssessmentScore = calculateSelfAssessmentScore(selfAssessment)

  // 4. 計算心靈便籤分數（佔 1.5-2.25%，這裡取 2%）
  const journalScore = calculateJournalMoodScore(journalMoods)

  // 計算總分
  const totalScore = Math.round(
    recentScore * 0.50 +           // 50%
    historicalScore * 0.35 +       // 35%
    selfAssessmentScore * 0.13 +   // 13%
    journalScore * 0.02            // 2%
  )

  // 分數細分
  const breakdown = {
    recentDialogues: recentScore,
    historicalDialogues: historicalScore,
    selfAssessment: selfAssessmentScore,
    journalMood: journalScore
  }

  // 情緒等級
  const emotionLevel = getEmotionLevel(totalScore)

  // 生成建議
  const suggestions = generateSuggestions(totalScore, breakdown)

  return {
    totalScore,
    breakdown,
    emotionLevel,
    suggestions,
    timestamp: new Date().toISOString()
  }
}

/**
 * 從 localStorage 獲取數據並計算完整評分
 */
export function calculateEmotionScoreFromStorage(): EmotionScore {
  try {
    // 獲取近期對話（最近 7 天）
    const recentDialoguesStr = localStorage.getItem('recentDialogues')
    const recentDialogues: DialogueAnalysis[] = recentDialoguesStr 
      ? JSON.parse(recentDialoguesStr) 
      : []

    // 獲取歷史對話（8-30 天前）
    const historicalDialoguesStr = localStorage.getItem('historicalDialogues')
    const historicalDialogues: DialogueAnalysis[] = historicalDialoguesStr 
      ? JSON.parse(historicalDialoguesStr) 
      : []

    // 獲取自我評估數據
    const selfAssessmentStr = localStorage.getItem('currentSelfAssessment')
    const selfAssessment: SelfAssessmentData = selfAssessmentStr
      ? JSON.parse(selfAssessmentStr)
      : {
          anxiety: 5,
          stress: 5,
          mood: 5,
          happiness: 5,
          social: 5,
          confidence: 5,
          timestamp: new Date().toISOString()
        }

    // 獲取心靈便籤心情記錄（最近 7 天）
    const journalEntriesStr = localStorage.getItem('journalEntries')
    const journalEntries = journalEntriesStr ? JSON.parse(journalEntriesStr) : []
    
    // 提取最近 7 天的心情
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentMoods: JournalMood[] = journalEntries
      .filter((entry: any) => new Date(entry.date) >= sevenDaysAgo)
      .map((entry: any) => entry.mood as JournalMood)

    // 計算完整評分
    return calculateCompleteEmotionScore(
      recentDialogues,
      historicalDialogues,
      selfAssessment,
      recentMoods
    )
  } catch (error) {
    console.error('計算情緒評分時發生錯誤:', error)
    
    // 返回預設評分
    return {
      totalScore: 60,
      breakdown: {
        recentDialogues: 60,
        historicalDialogues: 60,
        selfAssessment: 60,
        journalMood: 60
      },
      emotionLevel: 'fair',
      suggestions: ['無法計算評分，請確保已完成自我評估和對話記錄'],
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 儲存對話分析記錄
 */
export function saveDialogueAnalysis(analysis: DialogueAnalysis) {
  try {
    // 獲取現有記錄
    const recentStr = localStorage.getItem('recentDialogues')
    const historicalStr = localStorage.getItem('historicalDialogues')
    
    let recentDialogues: DialogueAnalysis[] = recentStr ? JSON.parse(recentStr) : []
    let historicalDialogues: DialogueAnalysis[] = historicalStr ? JSON.parse(historicalStr) : []

    // 添加新記錄到近期對話
    recentDialogues.push(analysis)

    // 計算日期邊界
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 7)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(now.getDate() - 30)

    // 整理記錄
    const allDialogues = [...recentDialogues, ...historicalDialogues]
    
    // 分離近期和歷史
    recentDialogues = allDialogues.filter(d => 
      new Date(d.timestamp) >= sevenDaysAgo
    )
    
    historicalDialogues = allDialogues.filter(d => {
      const date = new Date(d.timestamp)
      return date < sevenDaysAgo && date >= thirtyDaysAgo
    })

    // 儲存
    localStorage.setItem('recentDialogues', JSON.stringify(recentDialogues))
    localStorage.setItem('historicalDialogues', JSON.stringify(historicalDialogues))

    console.log('✅ 對話分析已儲存')
  } catch (error) {
    console.error('❌ 儲存對話分析失敗:', error)
  }
}

/**
 * 儲存自我評估數據
 */
export function saveSelfAssessment(assessment: SelfAssessmentData) {
  try {
    localStorage.setItem('currentSelfAssessment', JSON.stringify(assessment))
    console.log('✅ 自我評估已儲存')
  } catch (error) {
    console.error('❌ 儲存自我評估失敗:', error)
  }
}

/**
 * 獲取最新的情緒評分
 */
export function getLatestEmotionScore(): EmotionScore | null {
  try {
    const scoreStr = localStorage.getItem('latestEmotionScore')
    return scoreStr ? JSON.parse(scoreStr) : null
  } catch (error) {
    console.error('❌ 獲取情緒評分失敗:', error)
    return null
  }
}

/**
 * 儲存情緒評分
 */
export function saveEmotionScore(score: EmotionScore) {
  try {
    localStorage.setItem('latestEmotionScore', JSON.stringify(score))
    
    // 同時儲存到歷史記錄
    const historyStr = localStorage.getItem('emotionScoreHistory')
    const history: EmotionScore[] = historyStr ? JSON.parse(historyStr) : []
    history.push(score)
    
    // 只保留最近 30 天的記錄
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const filteredHistory = history.filter(s => 
      new Date(s.timestamp) >= thirtyDaysAgo
    )
    
    localStorage.setItem('emotionScoreHistory', JSON.stringify(filteredHistory))
    
    console.log('✅ 情緒評分已儲存')
  } catch (error) {
    console.error('❌ 儲存情緒評分失敗:', error)
  }
}