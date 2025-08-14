import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import leadsSlice from './slices/leadsSlice'
import scoringSlice from './slices/scoringSlice'
import analyticsSlice from './slices/analyticsSlice'
import integrationsSlice from './slices/integrationsSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    leads: leadsSlice,
    scoring: scoringSlice,
    analytics: analyticsSlice,
    integrations: integrationsSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch