import { router } from '../trpc'
import { authRouter } from './auth'
import { companiesRouter } from './companies'
import { productsRouter } from './products'
import { competitorsRouter } from './competitors'
import { recommendationsRouter } from './recommendations'

export const appRouter = router({
  auth: authRouter,
  companies: companiesRouter,
  products: productsRouter,
  competitors: competitorsRouter,
  recommendations: recommendationsRouter,
})

export type AppRouter = typeof appRouter