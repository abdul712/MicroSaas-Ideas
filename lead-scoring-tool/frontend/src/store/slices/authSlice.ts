import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  organizationId: string
  organizationName: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Login failed')
      }

      const data = await response.json()
      
      // Store tokens in localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      
      return data
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    organizationName: string
  }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        return rejectWithValue(error.message || 'Registration failed')
      }

      const data = await response.json()
      
      // Store tokens in localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('refreshToken', data.refreshToken)
      
      return data
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const refreshToken = state.auth.refreshToken || localStorage.getItem('refreshToken')
      
      if (!refreshToken) {
        return rejectWithValue('No refresh token available')
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        return rejectWithValue('Token refresh failed')
      }

      const data = await response.json()
      
      // Update tokens in localStorage
      localStorage.setItem('token', data.token)
      
      return data
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState }
      const token = state.auth.token || localStorage.getItem('token')
      
      if (!token) {
        return rejectWithValue('No token available')
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return rejectWithValue('Failed to get user data')
      }

      const data = await response.json()
      return data
    } catch (error) {
      return rejectWithValue('Network error')
    }
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState }
    const token = state.auth.token || localStorage.getItem('token')
    
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
      }
    } catch (error) {
      // Continue with logout even if server request fails
    }
    
    // Clear tokens from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token
      state.refreshToken = action.payload.refreshToken
      state.isAuthenticated = true
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token')
      const refreshToken = localStorage.getItem('refreshToken')
      
      if (token && refreshToken) {
        state.token = token
        state.refreshToken = refreshToken
        state.isAuthenticated = true
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
        state.isAuthenticated = false
      })

    // Refresh Token
    builder
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.token = action.payload.token
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.user = null
      })

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.user = null
      })

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
      })
  },
})

export const { clearError, setTokens, initializeAuth } = authSlice.actions
export default authSlice.reducer