export interface Currency {
  code: string
  name: string
  symbol: string
  decimals: number
  symbolFirst: boolean
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  // Major currencies
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, symbolFirst: true },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, symbolFirst: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, symbolFirst: true },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimals: 0, symbolFirst: true },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimals: 2, symbolFirst: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimals: 2, symbolFirst: true },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimals: 2, symbolFirst: true },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimals: 2, symbolFirst: true },
  
  // Asian currencies
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimals: 2, symbolFirst: true },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimals: 2, symbolFirst: true },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimals: 2, symbolFirst: true },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimals: 0, symbolFirst: true },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimals: 2, symbolFirst: true },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', decimals: 2, symbolFirst: true },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimals: 2, symbolFirst: true },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', decimals: 0, symbolFirst: true },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', decimals: 2, symbolFirst: true },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', decimals: 0, symbolFirst: false },
  
  // European currencies
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimals: 2, symbolFirst: false },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimals: 2, symbolFirst: false },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimals: 2, symbolFirst: false },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimals: 2, symbolFirst: false },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', decimals: 2, symbolFirst: false },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', decimals: 0, symbolFirst: false },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei', decimals: 2, symbolFirst: false },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', decimals: 2, symbolFirst: false },
  
  // Middle Eastern & African currencies
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimals: 2, symbolFirst: true },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimals: 2, symbolFirst: true },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', decimals: 2, symbolFirst: true },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', decimals: 3, symbolFirst: true },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', decimals: 3, symbolFirst: true },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼', decimals: 3, symbolFirst: true },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', decimals: 2, symbolFirst: true },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', decimals: 2, symbolFirst: true },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£', decimals: 2, symbolFirst: true },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2, symbolFirst: true },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2, symbolFirst: true },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2, symbolFirst: true },
  
  // Latin American currencies
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimals: 2, symbolFirst: true },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimals: 2, symbolFirst: true },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', decimals: 2, symbolFirst: true },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', decimals: 0, symbolFirst: true },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', decimals: 2, symbolFirst: true },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', decimals: 2, symbolFirst: true },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U', decimals: 2, symbolFirst: true },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs', decimals: 2, symbolFirst: true },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲', decimals: 0, symbolFirst: true },
  
  // Other currencies
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽', decimals: 2, symbolFirst: false },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', decimals: 2, symbolFirst: false },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', decimals: 2, symbolFirst: false },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', decimals: 2, symbolFirst: false },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'soʻm', decimals: 2, symbolFirst: false },
]

export const ZERO_DECIMAL_CURRENCIES = [
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 
  'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF', 'HUF', 'IDR'
]

export function getCurrency(code: string): Currency | undefined {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code)
}

export function formatCurrencyWithSymbol(
  amount: number, 
  currencyCode: string,
  showSymbol: boolean = true
): string {
  const currency = getCurrency(currencyCode)
  
  if (!currency) {
    // Fallback to basic formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  }

  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  }).format(amount)

  if (!showSymbol) {
    return formattedAmount
  }

  return currency.symbolFirst 
    ? `${currency.symbol}${formattedAmount}`
    : `${formattedAmount} ${currency.symbol}`
}

export async function getExchangeRate(
  fromCurrency: string, 
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1
  }

  try {
    // In production, you would use a real exchange rate API
    // For now, return a mock rate
    const mockRates: Record<string, number> = {
      'EUR/USD': 1.08,
      'GBP/USD': 1.25,
      'JPY/USD': 0.0067,
      'CAD/USD': 0.74,
      'AUD/USD': 0.65,
      'CHF/USD': 1.10,
      // Add more mock rates as needed
    }

    const rateKey = `${fromCurrency}/${toCurrency}`
    const reverseRateKey = `${toCurrency}/${fromCurrency}`

    if (mockRates[rateKey]) {
      return mockRates[rateKey]
    } else if (mockRates[reverseRateKey]) {
      return 1 / mockRates[reverseRateKey]
    }

    // If no rate found, return 1 (no conversion)
    return 1
  } catch (error) {
    console.error('Error fetching exchange rate:', error)
    return 1
  }
}

export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  const rate = await getExchangeRate(fromCurrency, toCurrency)
  return amount * rate
}

export function isZeroDecimalCurrency(currencyCode: string): boolean {
  return ZERO_DECIMAL_CURRENCIES.includes(currencyCode.toUpperCase())
}

export function getPopularCurrencies(): Currency[] {
  const popularCodes = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL']
  return SUPPORTED_CURRENCIES.filter(currency => popularCodes.includes(currency.code))
}

export function getCurrenciesByRegion(region: string): Currency[] {
  const regions: Record<string, string[]> = {
    'North America': ['USD', 'CAD', 'MXN'],
    'Europe': ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN'],
    'Asia Pacific': ['JPY', 'CNY', 'HKD', 'SGD', 'KRW', 'INR', 'AUD', 'NZD', 'THB', 'MYR', 'IDR', 'PHP', 'VND'],
    'Middle East & Africa': ['AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR', 'ILS', 'TRY', 'EGP', 'ZAR', 'NGN', 'KES'],
    'Latin America': ['BRL', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'BOB', 'PYG'],
  }

  const currencyCodes = regions[region] || []
  return SUPPORTED_CURRENCIES.filter(currency => currencyCodes.includes(currency.code))
}