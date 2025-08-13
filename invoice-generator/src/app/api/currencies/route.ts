import { NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_CURRENCIES, getExchangeRate, getCurrenciesByRegion, getPopularCurrencies } from '@/lib/currencies'

// GET /api/currencies - Get supported currencies and exchange rates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const region = searchParams.get('region')
    const popular = searchParams.get('popular') === 'true'
    const baseCurrency = searchParams.get('base') || 'USD'
    const includeRates = searchParams.get('rates') === 'true'

    let currencies = SUPPORTED_CURRENCIES

    // Filter by region if specified
    if (region) {
      currencies = getCurrenciesByRegion(region)
    }

    // Get only popular currencies if requested
    if (popular) {
      currencies = getPopularCurrencies()
    }

    // Add exchange rates if requested
    let currenciesWithRates = currencies
    if (includeRates) {
      currenciesWithRates = await Promise.all(
        currencies.map(async (currency) => {
          const rate = await getExchangeRate(baseCurrency, currency.code)
          return {
            ...currency,
            rate,
            baseCurrency,
          }
        })
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        currencies: currenciesWithRates,
        baseCurrency,
        total: currenciesWithRates.length,
      }
    })

  } catch (error) {
    console.error('Get currencies error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch currencies' },
      { status: 500 }
    )
  }
}

// POST /api/currencies/convert - Convert amount between currencies
export async function POST(request: NextRequest) {
  try {
    const { amount, fromCurrency, toCurrency } = await request.json()

    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      )
    }

    const rate = await getExchangeRate(fromCurrency, toCurrency)
    const convertedAmount = amount * rate

    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount,
        fromCurrency,
        toCurrency,
        exchangeRate: rate,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error('Currency conversion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to convert currency' },
      { status: 500 }
    )
  }
}