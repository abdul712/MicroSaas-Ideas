import { Decimal } from '@prisma/client/runtime/library'
import type { Recipe, RecipeIngredient, CostCalculation, CostBreakdown, CostSettings } from '@/types'
import { convertUnits, roundToDecimals } from '@/lib/utils'

export class CostCalculatorService {
  private costSettings: CostSettings

  constructor(costSettings: CostSettings) {
    this.costSettings = costSettings
  }

  /**
   * Calculate the total cost of a recipe including ingredients, labor, and overhead
   */
  calculateRecipeCost(
    recipe: Recipe & { recipeIngredients: (RecipeIngredient & { ingredient: any })[] }
  ): CostCalculation {
    const ingredientCost = this.calculateIngredientCost(recipe.recipeIngredients)
    const laborCost = this.calculateLaborCost(recipe.prepTime || 0, recipe.cookTime || 0)
    const overheadCost = this.calculateOverheadCost(ingredientCost + laborCost)
    const totalCost = ingredientCost + laborCost + overheadCost
    const costPerServing = totalCost / recipe.servings
    
    // Apply waste percentage
    const adjustedTotalCost = totalCost * (1 + this.costSettings.wastePercentage / 100)
    const adjustedCostPerServing = adjustedTotalCost / recipe.servings
    
    const suggestedPrice = this.calculateSuggestedPrice(adjustedCostPerServing)
    const profitMargin = this.calculateProfitMargin(suggestedPrice, adjustedCostPerServing)

    const breakdown = this.createCostBreakdown(ingredientCost, laborCost, overheadCost)

    return {
      ingredientCost: roundToDecimals(ingredientCost, 4),
      laborCost: roundToDecimals(laborCost, 4),
      overheadCost: roundToDecimals(overheadCost, 4),
      totalCost: roundToDecimals(adjustedTotalCost, 4),
      costPerServing: roundToDecimals(adjustedCostPerServing, 4),
      suggestedPrice: roundToDecimals(suggestedPrice, 2),
      profitMargin: roundToDecimals(profitMargin, 2),
      breakdown
    }
  }

  /**
   * Calculate the cost of all ingredients in a recipe
   */
  private calculateIngredientCost(recipeIngredients: (RecipeIngredient & { ingredient: any })[]): number {
    return recipeIngredients.reduce((total, recipeIngredient) => {
      const { quantity, unit, ingredient, costOverride } = recipeIngredient

      // Use cost override if provided
      if (costOverride) {
        return total + Number(costOverride)
      }

      // Calculate unit cost
      const unitCost = this.calculateIngredientUnitCost(ingredient, unit, quantity)
      return total + unitCost
    }, 0)
  }

  /**
   * Calculate the unit cost for a specific ingredient
   */
  private calculateIngredientUnitCost(ingredient: any, unit: string, quantity: number): number {
    if (!ingredient.currentPrice || !ingredient.priceUnit) {
      return 0
    }

    const pricePerUnit = Number(ingredient.currentPrice)
    const priceUnit = ingredient.priceUnit

    // Convert quantity to the same unit as the price
    let convertedQuantity = quantity
    if (unit !== priceUnit) {
      convertedQuantity = convertUnits(quantity, unit, priceUnit)
    }

    return convertedQuantity * pricePerUnit
  }

  /**
   * Calculate labor cost based on prep and cook time
   */
  private calculateLaborCost(prepTime: number, cookTime: number): number {
    const totalMinutes = prepTime + cookTime
    const totalHours = totalMinutes / 60
    return totalHours * Number(this.costSettings.laborCostPerHour)
  }

  /**
   * Calculate overhead cost as a percentage of ingredient + labor cost
   */
  private calculateOverheadCost(baseCost: number): number {
    return baseCost * (Number(this.costSettings.overheadPercentage) / 100)
  }

  /**
   * Calculate suggested selling price based on target profit margin
   */
  private calculateSuggestedPrice(costPerServing: number): number {
    const targetMargin = Number(this.costSettings.targetProfitMargin) / 100
    return costPerServing / (1 - targetMargin)
  }

  /**
   * Calculate profit margin percentage
   */
  private calculateProfitMargin(sellingPrice: number, cost: number): number {
    if (sellingPrice === 0) return 0
    return ((sellingPrice - cost) / sellingPrice) * 100
  }

  /**
   * Create detailed cost breakdown
   */
  private createCostBreakdown(
    ingredientCost: number,
    laborCost: number,
    overheadCost: number
  ): CostBreakdown[] {
    const totalCost = ingredientCost + laborCost + overheadCost

    return [
      {
        name: 'Ingredients',
        cost: roundToDecimals(ingredientCost, 4),
        percentage: roundToDecimals((ingredientCost / totalCost) * 100, 2),
        type: 'ingredient'
      },
      {
        name: 'Labor',
        cost: roundToDecimals(laborCost, 4),
        percentage: roundToDecimals((laborCost / totalCost) * 100, 2),
        type: 'labor'
      },
      {
        name: 'Overhead',
        cost: roundToDecimals(overheadCost, 4),
        percentage: roundToDecimals((overheadCost / totalCost) * 100, 2),
        type: 'overhead'
      }
    ]
  }

  /**
   * Calculate recipe cost with different serving sizes
   */
  calculateScaledCost(
    recipe: Recipe & { recipeIngredients: (RecipeIngredient & { ingredient: any })[] },
    newServings: number
  ): CostCalculation {
    const scaleFactor = newServings / recipe.servings
    
    // Create scaled recipe
    const scaledRecipe = {
      ...recipe,
      servings: newServings,
      recipeIngredients: recipe.recipeIngredients.map(ri => ({
        ...ri,
        quantity: ri.quantity * scaleFactor
      }))
    }

    return this.calculateRecipeCost(scaledRecipe)
  }

  /**
   * Calculate cost variance compared to target
   */
  calculateCostVariance(actualCost: number, targetCost: number): {
    variance: number
    variancePercentage: number
    status: 'under' | 'over' | 'on-target'
  } {
    const variance = actualCost - targetCost
    const variancePercentage = targetCost > 0 ? (variance / targetCost) * 100 : 0

    let status: 'under' | 'over' | 'on-target' = 'on-target'
    if (variance < -0.01) status = 'under'
    else if (variance > 0.01) status = 'over'

    return {
      variance: roundToDecimals(variance, 4),
      variancePercentage: roundToDecimals(variancePercentage, 2),
      status
    }
  }

  /**
   * Calculate food cost percentage for menu pricing
   */
  calculateFoodCostPercentage(ingredientCost: number, sellingPrice: number): number {
    if (sellingPrice === 0) return 0
    return (ingredientCost / sellingPrice) * 100
  }

  /**
   * Calculate break-even price to achieve target profit margin
   */
  calculateBreakEvenPrice(totalCost: number, targetMarginPercentage: number): number {
    return totalCost / (1 - targetMarginPercentage / 100)
  }

  /**
   * Analyze recipe profitability
   */
  analyzeProfitability(
    recipe: Recipe & { recipeIngredients: (RecipeIngredient & { ingredient: any })[] },
    currentSellingPrice?: number
  ): {
    calculation: CostCalculation
    isProfit able: boolean
    marginStatus: 'excellent' | 'good' | 'acceptable' | 'poor'
    recommendations: string[]
  } {
    const calculation = this.calculateRecipeCost(recipe)
    const sellingPrice = currentSellingPrice || calculation.suggestedPrice
    const actualMargin = this.calculateProfitMargin(sellingPrice, calculation.costPerServing)
    
    const isProfitable = actualMargin > 0
    
    let marginStatus: 'excellent' | 'good' | 'acceptable' | 'poor'
    if (actualMargin >= 40) marginStatus = 'excellent'
    else if (actualMargin >= 30) marginStatus = 'good'
    else if (actualMargin >= 20) marginStatus = 'acceptable'
    else marginStatus = 'poor'

    const recommendations: string[] = []
    
    if (actualMargin < Number(this.costSettings.targetProfitMargin)) {
      recommendations.push('Consider increasing the selling price to meet target profit margin')
    }
    
    if (calculation.ingredientCost > calculation.totalCost * 0.7) {
      recommendations.push('Ingredient costs are high - consider finding cheaper alternatives')
    }
    
    if (calculation.laborCost > calculation.totalCost * 0.3) {
      recommendations.push('Labor costs are high - consider optimizing preparation methods')
    }

    return {
      calculation,
      isProfitable,
      marginStatus,
      recommendations
    }
  }

  /**
   * Update cost settings
   */
  updateCostSettings(newSettings: Partial<CostSettings>): void {
    this.costSettings = { ...this.costSettings, ...newSettings }
  }
}