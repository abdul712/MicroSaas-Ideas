import { Matrix } from "ml-matrix"
import { prisma } from "@/lib/prisma"
import { cacheGet, cacheSet, CACHE_KEYS } from "@/lib/redis"

export interface BundleRecommendation {
  products: string[]
  confidence: number
  expectedRevenue: number
  algorithm: string
  metadata: Record<string, any>
}

export interface RecommendationContext {
  storeId: string
  targetProductId?: string
  customerSegment?: string
  seasonality?: boolean
  inventoryConstraints?: boolean
}

/**
 * Advanced AI-powered bundle recommendation engine
 * Combines multiple ML algorithms for optimal bundle suggestions
 */
export class BundleRecommendationEngine {
  private storeId: string
  
  constructor(storeId: string) {
    this.storeId = storeId
  }

  /**
   * Generate bundle recommendations using hybrid approach
   */
  async generateRecommendations(
    context: RecommendationContext,
    limit: number = 10
  ): Promise<BundleRecommendation[]> {
    const cacheKey = CACHE_KEYS.BUNDLE_RECOMMENDATIONS(this.storeId, context.targetProductId || "all")
    
    // Try cache first
    const cached = await cacheGet<BundleRecommendation[]>(cacheKey)
    if (cached) {
      return cached.slice(0, limit)
    }

    // Get historical transaction data
    const transactionData = await this.getTransactionData()
    if (transactionData.length === 0) {
      return []
    }

    // Generate recommendations using multiple algorithms
    const recommendations = await Promise.all([
      this.associationRuleMining(transactionData, context),
      this.collaborativeFiltering(transactionData, context),
      this.contentBasedFiltering(context),
      this.seasonalAnalysis(transactionData, context),
      this.inventoryOptimization(context)
    ])

    // Combine and rank recommendations
    const combinedRecommendations = this.hybridRanking(recommendations.flat())
    
    // Cache results
    await cacheSet(cacheKey, combinedRecommendations, 3600) // 1 hour cache
    
    return combinedRecommendations.slice(0, limit)
  }

  /**
   * Association Rule Mining using FP-Growth algorithm
   */
  private async associationRuleMining(
    transactions: Transaction[],
    context: RecommendationContext
  ): Promise<BundleRecommendation[]> {
    const minSupport = 0.01
    const minConfidence = 0.3
    
    // Build item frequency table
    const itemFrequency = new Map<string, number>()
    transactions.forEach(transaction => {
      transaction.items.forEach(item => {
        itemFrequency.set(item, (itemFrequency.get(item) || 0) + 1)
      })
    })

    // Filter frequent items
    const frequentItems = Array.from(itemFrequency.entries())
      .filter(([_, count]) => count / transactions.length >= minSupport)
      .map(([item]) => item)

    // Generate frequent itemsets using FP-Growth
    const frequentItemsets = this.fpGrowth(transactions, frequentItems, minSupport)
    
    // Generate association rules
    const rules = this.generateAssociationRules(frequentItemsets, transactions.length, minConfidence)
    
    // Convert rules to bundle recommendations
    return rules.map(rule => ({
      products: [...rule.antecedent, ...rule.consequent],
      confidence: rule.confidence,
      expectedRevenue: this.estimateRevenue(rule.antecedent.concat(rule.consequent)),
      algorithm: "association_rules",
      metadata: {
        support: rule.support,
        lift: rule.lift
      }
    }))
  }

  /**
   * Collaborative Filtering using Matrix Factorization
   */
  private async collaborativeFiltering(
    transactions: Transaction[],
    context: RecommendationContext
  ): Promise<BundleRecommendation[]> {
    // Build customer-product matrix
    const customers = [...new Set(transactions.map(t => t.customerId).filter(Boolean))]
    const products = await this.getProducts()
    
    const matrix = this.buildCustomerProductMatrix(customers, products, transactions)
    
    // Apply SVD for matrix factorization
    const { U, s, V } = this.svdDecomposition(matrix, 50) // 50 latent factors
    
    // Generate recommendations based on reconstructed matrix
    const recommendations = this.extractCollaborativeRecommendations(U, s, V, products, context)
    
    return recommendations.map(rec => ({
      products: rec.products,
      confidence: rec.similarity,
      expectedRevenue: this.estimateRevenue(rec.products),
      algorithm: "collaborative_filtering",
      metadata: {
        similarity: rec.similarity,
        factorCount: 50
      }
    }))
  }

  /**
   * Content-Based Filtering using product attributes
   */
  private async contentBasedFiltering(context: RecommendationContext): Promise<BundleRecommendation[]> {
    const products = await this.getProducts()
    
    if (!context.targetProductId) {
      return []
    }

    const targetProduct = products.find(p => p.id === context.targetProductId)
    if (!targetProduct) {
      return []
    }

    // Calculate content similarity
    const similarities = products
      .filter(p => p.id !== targetProduct.id)
      .map(product => ({
        product,
        similarity: this.calculateContentSimilarity(targetProduct, product)
      }))
      .sort((a, b) => b.similarity - a.similarity)

    // Generate bundles with high similarity products
    return similarities.slice(0, 5).map(({ product, similarity }) => ({
      products: [targetProduct.id, product.id],
      confidence: similarity,
      expectedRevenue: this.estimateRevenue([targetProduct.id, product.id]),
      algorithm: "content_based",
      metadata: {
        contentSimilarity: similarity,
        targetProductId: targetProduct.id
      }
    }))
  }

  /**
   * Seasonal Analysis for time-based recommendations
   */
  private async seasonalAnalysis(
    transactions: Transaction[],
    context: RecommendationContext
  ): Promise<BundleRecommendation[]> {
    if (!context.seasonality) {
      return []
    }

    const currentMonth = new Date().getMonth()
    const currentSeason = Math.floor(currentMonth / 3)
    
    // Filter transactions by season
    const seasonalTransactions = transactions.filter(t => {
      const transactionSeason = Math.floor(new Date(t.date).getMonth() / 3)
      return transactionSeason === currentSeason
    })

    // Find trending product combinations in current season
    const combinations = this.extractProductCombinations(seasonalTransactions, 2, 4)
    const trendingCombinations = combinations
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)

    return trendingCombinations.map(combo => ({
      products: combo.products,
      confidence: Math.min(combo.frequency / seasonalTransactions.length * 10, 1), // Normalize
      expectedRevenue: this.estimateRevenue(combo.products),
      algorithm: "seasonal_analysis",
      metadata: {
        season: currentSeason,
        frequency: combo.frequency,
        trend: "increasing"
      }
    }))
  }

  /**
   * Inventory Optimization for moving slow-selling items
   */
  private async inventoryOptimization(context: RecommendationContext): Promise<BundleRecommendation[]> {
    if (!context.inventoryConstraints) {
      return []
    }

    // Get products with high inventory and low sales velocity
    const products = await prisma.product.findMany({
      where: {
        storeId: this.storeId,
        status: "ACTIVE",
        quantity: { gt: 50 }, // High inventory
      },
      include: {
        analytics: {
          where: {
            date: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        }
      }
    })

    // Calculate sales velocity and identify slow-moving items
    const slowMovingProducts = products
      .map(product => {
        const totalSales = product.analytics.reduce((sum, a) => sum + a.purchases, 0)
        const velocity = totalSales / 30 // Sales per day
        return { product, velocity }
      })
      .filter(p => p.velocity < 1) // Less than 1 sale per day
      .sort((a, b) => a.velocity - b.velocity) // Slowest first

    // Create bundles pairing slow-moving with popular items
    const popularProducts = products
      .map(product => {
        const totalSales = product.analytics.reduce((sum, a) => sum + a.purchases, 0)
        return { product, sales: totalSales }
      })
      .filter(p => p.sales > 10) // At least 10 sales in last 30 days
      .sort((a, b) => b.sales - a.sales)

    const inventoryBundles: BundleRecommendation[] = []
    
    for (const slowItem of slowMovingProducts.slice(0, 5)) {
      for (const popularItem of popularProducts.slice(0, 3)) {
        if (slowItem.product.id !== popularItem.product.id) {
          inventoryBundles.push({
            products: [slowItem.product.id, popularItem.product.id],
            confidence: 0.7, // High confidence for inventory management
            expectedRevenue: this.estimateRevenue([slowItem.product.id, popularItem.product.id]),
            algorithm: "inventory_optimization",
            metadata: {
              slowMovingVelocity: slowItem.velocity,
              popularItemSales: popularItem.sales,
              inventoryCount: slowItem.product.quantity
            }
          })
        }
      }
    }

    return inventoryBundles
  }

  /**
   * Hybrid ranking algorithm combining multiple signals
   */
  private hybridRanking(recommendations: BundleRecommendation[]): BundleRecommendation[] {
    // Remove duplicates and combine scores
    const uniqueRecommendations = new Map<string, BundleRecommendation>()
    
    recommendations.forEach(rec => {
      const key = rec.products.sort().join("-")
      
      if (uniqueRecommendations.has(key)) {
        const existing = uniqueRecommendations.get(key)!
        // Combine confidence scores using weighted average
        const combinedConfidence = (existing.confidence * 0.7 + rec.confidence * 0.3)
        const combinedRevenue = Math.max(existing.expectedRevenue, rec.expectedRevenue)
        
        uniqueRecommendations.set(key, {
          ...existing,
          confidence: combinedConfidence,
          expectedRevenue: combinedRevenue,
          algorithm: `${existing.algorithm}+${rec.algorithm}`,
          metadata: { ...existing.metadata, ...rec.metadata }
        })
      } else {
        uniqueRecommendations.set(key, rec)
      }
    })

    // Score and rank recommendations
    return Array.from(uniqueRecommendations.values())
      .map(rec => ({
        ...rec,
        score: this.calculateHybridScore(rec)
      }))
      .sort((a, b) => (b as any).score - (a as any).score)
  }

  /**
   * Calculate hybrid score combining multiple factors
   */
  private calculateHybridScore(recommendation: BundleRecommendation): number {
    const confidenceWeight = 0.4
    const revenueWeight = 0.3
    const diversityWeight = 0.2
    const freshnessWeight = 0.1

    const confidenceScore = recommendation.confidence
    const revenueScore = Math.min(recommendation.expectedRevenue / 1000, 1) // Normalize to $1000
    const diversityScore = recommendation.products.length / 5 // Normalize to 5 products
    const freshnessScore = recommendation.algorithm.includes("+") ? 0.8 : 1.0 // Prefer hybrid recommendations

    return (
      confidenceScore * confidenceWeight +
      revenueScore * revenueWeight +
      diversityScore * diversityWeight +
      freshnessScore * freshnessWeight
    )
  }

  // Helper methods for ML algorithms

  private async getTransactionData(): Promise<Transaction[]> {
    const orders = await prisma.order.findMany({
      where: {
        storeId: this.storeId,
        status: "COMPLETED",
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    })

    return orders.map(order => ({
      id: order.id,
      customerId: order.customerId,
      date: order.createdAt,
      items: order.items.map(item => item.productId),
      total: order.total
    }))
  }

  private async getProducts() {
    return await prisma.product.findMany({
      where: {
        storeId: this.storeId,
        status: "ACTIVE"
      },
      select: {
        id: true,
        title: true,
        price: true,
        categoryId: true,
        tags: true
      }
    })
  }

  private fpGrowth(transactions: Transaction[], frequentItems: string[], minSupport: number) {
    // Simplified FP-Growth implementation
    const frequentItemsets: Array<{ items: string[], support: number }> = []
    
    // Generate 2-itemsets
    for (let i = 0; i < frequentItems.length; i++) {
      for (let j = i + 1; j < frequentItems.length; j++) {
        const itemset = [frequentItems[i], frequentItems[j]]
        const support = this.calculateSupport(itemset, transactions)
        
        if (support >= minSupport) {
          frequentItemsets.push({ items: itemset, support })
        }
      }
    }

    // Generate 3-itemsets
    for (let i = 0; i < frequentItemsets.length; i++) {
      for (let j = 0; j < frequentItems.length; j++) {
        const item = frequentItems[j]
        if (!frequentItemsets[i].items.includes(item)) {
          const itemset = [...frequentItemsets[i].items, item]
          const support = this.calculateSupport(itemset, transactions)
          
          if (support >= minSupport) {
            frequentItemsets.push({ items: itemset, support })
          }
        }
      }
    }

    return frequentItemsets
  }

  private calculateSupport(itemset: string[], transactions: Transaction[]): number {
    const supportCount = transactions.filter(transaction =>
      itemset.every(item => transaction.items.includes(item))
    ).length
    
    return supportCount / transactions.length
  }

  private generateAssociationRules(
    frequentItemsets: Array<{ items: string[], support: number }>,
    totalTransactions: number,
    minConfidence: number
  ) {
    const rules: Array<{
      antecedent: string[]
      consequent: string[]
      confidence: number
      support: number
      lift: number
    }> = []

    frequentItemsets
      .filter(itemset => itemset.items.length >= 2)
      .forEach(itemset => {
        // Generate all possible antecedent-consequent pairs
        for (let i = 1; i < itemset.items.length; i++) {
          const antecedent = itemset.items.slice(0, i)
          const consequent = itemset.items.slice(i)
          
          const antecedentSupport = this.getItemsetSupport(antecedent, frequentItemsets)
          const confidence = itemset.support / antecedentSupport
          const consequentSupport = this.getItemsetSupport(consequent, frequentItemsets)
          const lift = confidence / consequentSupport
          
          if (confidence >= minConfidence) {
            rules.push({
              antecedent,
              consequent,
              confidence,
              support: itemset.support,
              lift
            })
          }
        }
      })

    return rules.sort((a, b) => b.confidence - a.confidence)
  }

  private getItemsetSupport(items: string[], frequentItemsets: Array<{ items: string[], support: number }>): number {
    const itemset = frequentItemsets.find(fs => 
      fs.items.length === items.length && 
      items.every(item => fs.items.includes(item))
    )
    return itemset?.support || 0
  }

  private buildCustomerProductMatrix(customers: string[], products: any[], transactions: Transaction[]): Matrix {
    const matrix = new Matrix(customers.length, products.length)
    
    customers.forEach((customerId, customerIndex) => {
      products.forEach((product, productIndex) => {
        const customerTransactions = transactions.filter(t => t.customerId === customerId)
        const purchaseCount = customerTransactions.reduce((count, transaction) => {
          return count + (transaction.items.includes(product.id) ? 1 : 0)
        }, 0)
        
        matrix.set(customerIndex, productIndex, purchaseCount)
      })
    })
    
    return matrix
  }

  private svdDecomposition(matrix: Matrix, k: number) {
    // Simplified SVD - in production, use a proper SVD library
    const svd = matrix.svd()
    return {
      U: svd.leftSingularVectors.subMatrix(0, matrix.rows - 1, 0, k - 1),
      s: svd.diagonalMatrix.subMatrix(0, k - 1, 0, k - 1),
      V: svd.rightSingularVectors.subMatrix(0, matrix.columns - 1, 0, k - 1)
    }
  }

  private extractCollaborativeRecommendations(U: Matrix, s: Matrix, V: Matrix, products: any[], context: RecommendationContext) {
    // Simplified collaborative filtering extraction
    const recommendations: Array<{ products: string[], similarity: number }> = []
    
    // Generate product pairs based on latent factor similarity
    for (let i = 0; i < products.length; i++) {
      for (let j = i + 1; j < products.length; j++) {
        const similarity = this.calculateLatentSimilarity(i, j, V)
        if (similarity > 0.5) {
          recommendations.push({
            products: [products[i].id, products[j].id],
            similarity
          })
        }
      }
    }
    
    return recommendations.sort((a, b) => b.similarity - a.similarity).slice(0, 10)
  }

  private calculateLatentSimilarity(productIndex1: number, productIndex2: number, V: Matrix): number {
    // Calculate cosine similarity between product vectors
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    for (let k = 0; k < V.columns; k++) {
      const val1 = V.get(productIndex1, k)
      const val2 = V.get(productIndex2, k)
      
      dotProduct += val1 * val2
      norm1 += val1 * val1
      norm2 += val2 * val2
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  private calculateContentSimilarity(product1: any, product2: any): number {
    let similarity = 0
    let factors = 0
    
    // Category similarity
    if (product1.categoryId && product2.categoryId) {
      similarity += product1.categoryId === product2.categoryId ? 1 : 0
      factors++
    }
    
    // Price range similarity
    const priceDiff = Math.abs(product1.price - product2.price)
    const priceRange = Math.max(product1.price, product2.price)
    const priceSimilarity = Math.max(0, 1 - (priceDiff / priceRange))
    similarity += priceSimilarity
    factors++
    
    // Tag similarity (Jaccard coefficient)
    if (product1.tags && product2.tags) {
      const tags1 = new Set(product1.tags)
      const tags2 = new Set(product2.tags)
      const intersection = new Set([...tags1].filter(tag => tags2.has(tag)))
      const union = new Set([...tags1, ...tags2])
      
      const jaccard = union.size > 0 ? intersection.size / union.size : 0
      similarity += jaccard
      factors++
    }
    
    return factors > 0 ? similarity / factors : 0
  }

  private extractProductCombinations(transactions: Transaction[], minSize: number, maxSize: number) {
    const combinations = new Map<string, number>()
    
    transactions.forEach(transaction => {
      if (transaction.items.length >= minSize) {
        // Generate all combinations of size 2 to maxSize
        for (let size = minSize; size <= Math.min(maxSize, transaction.items.length); size++) {
          this.generateCombinations(transaction.items, size).forEach(combo => {
            const key = combo.sort().join("-")
            combinations.set(key, (combinations.get(key) || 0) + 1)
          })
        }
      }
    })
    
    return Array.from(combinations.entries()).map(([key, frequency]) => ({
      products: key.split("-"),
      frequency
    }))
  }

  private generateCombinations<T>(array: T[], size: number): T[][] {
    if (size === 1) return array.map(el => [el])
    if (size === array.length) return [array]
    
    const combinations: T[][] = []
    
    for (let i = 0; i <= array.length - size; i++) {
      const smallerCombinations = this.generateCombinations(array.slice(i + 1), size - 1)
      smallerCombinations.forEach(combo => {
        combinations.push([array[i], ...combo])
      })
    }
    
    return combinations
  }

  private async estimateRevenue(productIds: string[]): Promise<number> {
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        storeId: this.storeId
      }
    })
    
    const totalPrice = products.reduce((sum, product) => sum + product.price, 0)
    // Apply typical bundle discount of 10-20%
    return totalPrice * 0.85
  }
}

// Types
interface Transaction {
  id: string
  customerId: string | null
  date: Date
  items: string[]
  total: number
}