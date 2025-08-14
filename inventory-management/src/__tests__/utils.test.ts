import {
  formatCurrency,
  formatNumber,
  calculateStockStatus,
  getStockStatusColor,
  generateSKU,
  calculateInventoryValue,
  calculateTurnoverRate
} from '@/lib/utils'

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(999999.99)).toBe('$999,999.99')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('calculateStockStatus', () => {
    it('should return correct stock status', () => {
      expect(calculateStockStatus(0, 10)).toBe('out-of-stock')
      expect(calculateStockStatus(5, 10)).toBe('low-stock')
      expect(calculateStockStatus(15, 10)).toBe('in-stock')
    })
  })

  describe('getStockStatusColor', () => {
    it('should return correct color classes', () => {
      expect(getStockStatusColor('out-of-stock')).toBe('text-red-600 bg-red-50')
      expect(getStockStatusColor('low-stock')).toBe('text-yellow-600 bg-yellow-50')
      expect(getStockStatusColor('in-stock')).toBe('text-green-600 bg-green-50')
      expect(getStockStatusColor('unknown')).toBe('text-gray-600 bg-gray-50')
    })
  })

  describe('generateSKU', () => {
    it('should generate a valid SKU', () => {
      const sku = generateSKU()
      expect(sku).toMatch(/^SKU-[A-Z0-9]+-[A-Z0-9]{3}$/)
    })

    it('should use custom prefix', () => {
      const sku = generateSKU('PROD')
      expect(sku).toMatch(/^PROD-[A-Z0-9]+-[A-Z0-9]{3}$/)
    })
  })

  describe('calculateInventoryValue', () => {
    it('should calculate total inventory value', () => {
      const inventory = [
        { quantity: 10, cost: 50.00 },
        { quantity: 5, cost: 100.00 },
        { quantity: 20, cost: 25.00 }
      ]
      expect(calculateInventoryValue(inventory)).toBe(1500.00)
    })

    it('should handle empty inventory', () => {
      expect(calculateInventoryValue([])).toBe(0)
    })
  })

  describe('calculateTurnoverRate', () => {
    it('should calculate turnover rate correctly', () => {
      expect(calculateTurnoverRate(100, 25)).toBe(4)
      expect(calculateTurnoverRate(50, 10)).toBe(5)
    })

    it('should handle zero average inventory', () => {
      expect(calculateTurnoverRate(100, 0)).toBe(0)
    })
  })
})