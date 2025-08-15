// Core application types

export interface User {
  id: string
  name?: string | null
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface Restaurant {
  id: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  country: string
  currency: string
  timezone: string
  settings?: any
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Recipe {
  id: string
  name: string
  description?: string | null
  servings: number
  prepTime?: number | null
  cookTime?: number | null
  totalTime?: number | null
  instructions?: string | null
  imageUrl?: string | null
  category?: string | null
  cuisine?: string | null
  difficulty?: Difficulty | null
  isPublic: boolean
  tags: string[]
  totalCost?: number | null
  costPerServing?: number | null
  laborCost?: number | null
  overheadCost?: number | null
  profitMargin?: number | null
  sellingPrice?: number | null
  lastCostUpdate?: Date | null
  userId: string
  restaurantId: string
  createdAt: Date
  updatedAt: Date
  recipeIngredients?: RecipeIngredient[]
}

export interface Ingredient {
  id: string
  name: string
  description?: string | null
  category?: string | null
  defaultUnit: string
  density?: number | null
  allergens: string[]
  nutritionalData?: any
  supplierSku?: string | null
  barcode?: string | null
  currentPrice?: number | null
  priceUnit?: string | null
  lastPriceUpdate?: Date | null
  restaurantId: string
  createdAt: Date
  updatedAt: Date
}

export interface RecipeIngredient {
  id: string
  quantity: number
  unit: string
  notes?: string | null
  isOptional: boolean
  costOverride?: number | null
  unitCost?: number | null
  totalCost?: number | null
  recipeId: string
  ingredientId: string
  createdAt: Date
  updatedAt: Date
  ingredient?: Ingredient
}

export interface Supplier {
  id: string
  name: string
  contactName?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  website?: string | null
  apiEndpoint?: string | null
  apiKey?: string | null
  updateFrequency?: string | null
  isActive: boolean
  restaurantId: string
  createdAt: Date
  updatedAt: Date
}

export interface SupplierPrice {
  id: string
  price: number
  unit: string
  packaging?: string | null
  minimumOrder?: number | null
  isAvailable: boolean
  supplierId: string
  ingredientId: string
  createdAt: Date
  updatedAt: Date
  supplier?: Supplier
  ingredient?: Ingredient
}

export interface PriceHistory {
  id: string
  price: number
  unit: string
  source: string
  ingredientId: string
  timestamp: Date
  ingredient?: Ingredient
}

export interface Menu {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  validFrom?: Date | null
  validTo?: Date | null
  restaurantId: string
  createdAt: Date
  updatedAt: Date
  categories?: MenuCategory[]
  items?: MenuItem[]
}

export interface MenuCategory {
  id: string
  name: string
  description?: string | null
  sortOrder: number
  menuId: string
  createdAt: Date
  updatedAt: Date
  items?: MenuItem[]
}

export interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  isAvailable: boolean
  sortOrder: number
  costPercentage?: number | null
  profitMargin?: number | null
  menuId: string
  categoryId?: string | null
  recipeId?: string | null
  createdAt: Date
  updatedAt: Date
  category?: MenuCategory | null
  recipe?: Recipe | null
}

export interface InventoryItem {
  id: string
  currentStock: number
  unit: string
  minimumStock?: number | null
  maximumStock?: number | null
  reorderPoint?: number | null
  lastStockUpdate: Date
  averageCost?: number | null
  totalValue?: number | null
  ingredientId: string
  restaurantId: string
  createdAt: Date
  updatedAt: Date
  ingredient?: Ingredient
  movements?: InventoryMovement[]
}

export interface InventoryMovement {
  id: string
  type: InventoryMovementType
  quantity: number
  unit: string
  unitCost?: number | null
  totalCost?: number | null
  reference?: string | null
  notes?: string | null
  inventoryItemId: string
  timestamp: Date
  inventoryItem?: InventoryItem
}

export interface CostSettings {
  id: string
  laborCostPerHour: number
  overheadPercentage: number
  targetProfitMargin: number
  wastePercentage: number
  salesTaxRate: number
  autoUpdateCosts: boolean
  autoUpdateFrequency: string
  restaurantId: string
  createdAt: Date
  updatedAt: Date
}

export interface UserRestaurantRole {
  id: string
  userId: string
  restaurantId: string
  role: RestaurantRole
  permissions?: any
  createdAt: Date
  updatedAt: Date
  user?: User
  restaurant?: Restaurant
}

// Enums
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export enum RestaurantRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CHEF = 'CHEF',
  STAFF = 'STAFF',
  VIEWER = 'VIEWER'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum InventoryMovementType {
  PURCHASE = 'PURCHASE',
  SALE = 'SALE',
  WASTE = 'WASTE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  PRODUCTION = 'PRODUCTION'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form Types
export interface RecipeFormData {
  name: string
  description?: string
  servings: number
  prepTime?: number
  cookTime?: number
  instructions?: string
  category?: string
  cuisine?: string
  difficulty?: Difficulty
  tags: string[]
  ingredients: {
    ingredientId: string
    quantity: number
    unit: string
    notes?: string
    isOptional: boolean
  }[]
}

export interface IngredientFormData {
  name: string
  description?: string
  category?: string
  defaultUnit: string
  density?: number
  allergens: string[]
  currentPrice?: number
  priceUnit?: string
  supplierSku?: string
  barcode?: string
}

export interface RestaurantFormData {
  name: string
  address?: string
  city?: string
  state?: string
  country: string
  currency: string
  timezone: string
}

// Cost Calculation Types
export interface CostCalculation {
  ingredientCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
  costPerServing: number
  suggestedPrice: number
  profitMargin: number
  breakdown: CostBreakdown[]
}

export interface CostBreakdown {
  name: string
  cost: number
  percentage: number
  type: 'ingredient' | 'labor' | 'overhead'
}

// Analytics Types
export interface CostTrend {
  date: string
  cost: number
  change: number
  changePercentage: number
}

export interface ProfitAnalysis {
  totalRevenue: number
  totalCost: number
  grossProfit: number
  profitMargin: number
  topProfitableItems: MenuItem[]
  costTrends: CostTrend[]
}

// Integration Types
export interface PosIntegration {
  id: string
  name: string
  type: 'toast' | 'square' | 'clover' | 'lightspeed'
  isActive: boolean
  settings: any
  lastSync?: Date
}

export interface SupplierIntegration {
  id: string
  name: string
  type: 'sysco' | 'us_foods' | 'custom'
  isActive: boolean
  apiKey?: string
  settings: any
  lastSync?: Date
}

// Unit conversion types
export interface UnitConversion {
  from: string
  to: string
  factor: number
  category: 'weight' | 'volume' | 'count'
}

// Search and filter types
export interface SearchFilters {
  query?: string
  category?: string
  tags?: string[]
  difficulty?: Difficulty
  prepTime?: {
    min?: number
    max?: number
  }
  cost?: {
    min?: number
    max?: number
  }
  sortBy?: 'name' | 'cost' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}