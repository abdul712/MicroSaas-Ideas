import googleTrends from 'google-trends-api'

export interface TrendData {
  keyword: string
  searchVolume?: number
  trendDirection: 'rising' | 'declining' | 'stable' | 'viral'
  relatedQueries: string[]
  geographicData?: any
  competition?: 'low' | 'medium' | 'high'
  seasonalityData?: any
}

export interface TrendAnalysisRequest {
  keywords: string[]
  timeframe?: string
  geo?: string
  category?: number
}

export class TrendAnalysisService {
  async getInterestOverTime(keywords: string[], timeframe: string = 'today 12-m', geo: string = 'US'): Promise<any> {
    try {
      const results = await googleTrends.interestOverTime({
        keyword: keywords,
        startTime: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        endTime: new Date(),
        geo: geo,
      })
      
      return JSON.parse(results)
    } catch (error) {
      console.error('Error fetching interest over time:', error)
      return null
    }
  }

  async getRelatedQueries(keyword: string, geo: string = 'US'): Promise<string[]> {
    try {
      const results = await googleTrends.relatedQueries({
        keyword: keyword,
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
        endTime: new Date(),
        geo: geo,
      })
      
      const parsed = JSON.parse(results)
      const queries: string[] = []
      
      // Extract rising and top queries
      if (parsed.default?.rankedList) {
        parsed.default.rankedList.forEach((list: any) => {
          if (list.rankedKeyword) {
            list.rankedKeyword.forEach((item: any) => {
              if (item.query) {
                queries.push(item.query)
              }
            })
          }
        })
      }
      
      return queries.slice(0, 10) // Return top 10 related queries
    } catch (error) {
      console.error('Error fetching related queries:', error)
      return []
    }
  }

  async getRelatedTopics(keyword: string, geo: string = 'US'): Promise<string[]> {
    try {
      const results = await googleTrends.relatedTopics({
        keyword: keyword,
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
        endTime: new Date(),
        geo: geo,
      })
      
      const parsed = JSON.parse(results)
      const topics: string[] = []
      
      if (parsed.default?.rankedList) {
        parsed.default.rankedList.forEach((list: any) => {
          if (list.rankedKeyword) {
            list.rankedKeyword.forEach((item: any) => {
              if (item.topic?.title) {
                topics.push(item.topic.title)
              }
            })
          }
        })
      }
      
      return topics.slice(0, 10) // Return top 10 related topics
    } catch (error) {
      console.error('Error fetching related topics:', error)
      return []
    }
  }

  async getDailyTrends(geo: string = 'US'): Promise<string[]> {
    try {
      const results = await googleTrends.dailyTrends({
        trendDate: new Date(),
        geo: geo,
      })
      
      const parsed = JSON.parse(results)
      const trends: string[] = []
      
      if (parsed.default?.trendingSearchesDays) {
        parsed.default.trendingSearchesDays.forEach((day: any) => {
          if (day.trendingSearches) {
            day.trendingSearches.forEach((search: any) => {
              if (search.title?.query) {
                trends.push(search.title.query)
              }
            })
          }
        })
      }
      
      return trends.slice(0, 20) // Return top 20 daily trends
    } catch (error) {
      console.error('Error fetching daily trends:', error)
      return []
    }
  }

  async analyzeKeywordTrends(keywords: string[], geo: string = 'US'): Promise<TrendData[]> {
    const trendData: TrendData[] = []
    
    for (const keyword of keywords) {
      try {
        // Get interest over time to determine trend direction
        const interestData = await this.getInterestOverTime([keyword], 'today 3-m', geo)
        
        // Get related queries
        const relatedQueries = await this.getRelatedQueries(keyword, geo)
        
        // Analyze trend direction
        let trendDirection: TrendData['trendDirection'] = 'stable'
        if (interestData?.default?.timelineData) {
          const values = interestData.default.timelineData.map((item: any) => item.value[0])
          if (values.length >= 2) {
            const recent = values.slice(-4).reduce((a: number, b: number) => a + b, 0) / 4
            const earlier = values.slice(0, 4).reduce((a: number, b: number) => a + b, 0) / 4
            
            if (recent > earlier * 1.2) {
              trendDirection = 'rising'
            } else if (recent < earlier * 0.8) {
              trendDirection = 'declining'
            }
            
            // Check for viral trends (sudden spikes)
            const maxValue = Math.max(...values)
            const avgValue = values.reduce((a: number, b: number) => a + b, 0) / values.length
            if (maxValue > avgValue * 3) {
              trendDirection = 'viral'
            }
          }
        }
        
        // Estimate competition level (simplified)
        const competition = relatedQueries.length > 15 ? 'high' : relatedQueries.length > 8 ? 'medium' : 'low'
        
        trendData.push({
          keyword,
          trendDirection,
          relatedQueries,
          competition,
          geographicData: interestData?.default?.geoMap || null,
        })
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error analyzing keyword ${keyword}:`, error)
        // Add basic data even if analysis fails
        trendData.push({
          keyword,
          trendDirection: 'stable',
          relatedQueries: [],
          competition: 'medium',
        })
      }
    }
    
    return trendData
  }

  async getSeasonalTrends(keyword: string, geo: string = 'US'): Promise<any> {
    try {
      // Get data for the past 5 years to identify seasonal patterns
      const results = await googleTrends.interestOverTime({
        keyword: [keyword],
        startTime: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000), // 5 years ago
        endTime: new Date(),
        geo: geo,
      })
      
      const parsed = JSON.parse(results)
      
      if (parsed.default?.timelineData) {
        // Group data by month to identify seasonal patterns
        const monthlyData: { [key: number]: number[] } = {}
        
        parsed.default.timelineData.forEach((item: any) => {
          const date = new Date(item.time * 1000)
          const month = date.getMonth()
          
          if (!monthlyData[month]) {
            monthlyData[month] = []
          }
          monthlyData[month].push(item.value[0])
        })
        
        // Calculate average for each month
        const seasonalPattern = Object.keys(monthlyData).map(month => {
          const values = monthlyData[parseInt(month)]
          const average = values.reduce((a, b) => a + b, 0) / values.length
          return {
            month: parseInt(month),
            averageInterest: average,
          }
        })
        
        return {
          keyword,
          seasonalPattern,
          peakMonths: seasonalPattern
            .sort((a, b) => b.averageInterest - a.averageInterest)
            .slice(0, 3)
            .map(item => item.month),
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching seasonal trends:', error)
      return null
    }
  }

  async getCompetitorKeywords(domain: string): Promise<string[]> {
    // This would typically use a service like SEMrush or Ahrefs API
    // For now, we'll return a placeholder implementation
    // In a real implementation, you would integrate with these services
    
    try {
      // Placeholder - in real implementation, use SEMrush/Ahrefs API
      console.log(`Getting competitor keywords for domain: ${domain}`)
      
      // Return some common keywords as placeholder
      return [
        'content marketing',
        'digital marketing',
        'SEO',
        'social media marketing',
        'email marketing',
      ]
    } catch (error) {
      console.error('Error fetching competitor keywords:', error)
      return []
    }
  }

  async getKeywordDifficulty(keywords: string[]): Promise<{ keyword: string; difficulty: number }[]> {
    // This would typically use a service like SEMrush or Ahrefs API
    // For now, we'll return estimated difficulty based on keyword characteristics
    
    return keywords.map(keyword => {
      // Simple heuristic for keyword difficulty
      let difficulty = 50 // Base difficulty
      
      // Longer keywords are typically easier
      if (keyword.split(' ').length >= 3) {
        difficulty -= 15
      }
      
      // Very short keywords are typically harder
      if (keyword.length < 10) {
        difficulty += 20
      }
      
      // Commercial intent keywords are typically harder
      const commercialKeywords = ['buy', 'price', 'cost', 'review', 'best', 'top']
      if (commercialKeywords.some(word => keyword.toLowerCase().includes(word))) {
        difficulty += 15
      }
      
      // Informational keywords are typically easier
      const informationalKeywords = ['how', 'what', 'why', 'guide', 'tutorial']
      if (informationalKeywords.some(word => keyword.toLowerCase().includes(word))) {
        difficulty -= 10
      }
      
      // Ensure difficulty is between 1 and 100
      difficulty = Math.max(1, Math.min(100, difficulty))
      
      return {
        keyword,
        difficulty,
      }
    })
  }
}

export const trendAnalysisService = new TrendAnalysisService()