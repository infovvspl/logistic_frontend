import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as authAPI from './authAPI.js'
import { STORAGE_KEYS } from '../../utils/constants.js'
import Cookies from 'js-cookie'

function loadAuth() {
  try {
    const token = Cookies.get(STORAGE_KEYS.auth + '.token')
    const userRaw = Cookies.get(STORAGE_KEYS.auth + '.user')
    return {
      token,
      user: userRaw ? JSON.parse(userRaw) : null,
    }
  } catch {
    return null
  }
}

function saveAuth(next) {
  try {
    if (!next?.token) {
      Cookies.remove(STORAGE_KEYS.auth + '.token', { path: '/' })
      Cookies.remove(STORAGE_KEYS.auth + '.user', { path: '/' })
    } else {
      // Set cookies with a 7-day expiration and global path
      Cookies.set(STORAGE_KEYS.auth + '.token', next.token, { expires: 7, path: '/' })
      if (next.user) {
        Cookies.set(STORAGE_KEYS.auth + '.user', JSON.stringify(next.user), { expires: 7, path: '/' })
      }
    }
  } catch {
    // ignore
  }
}

const initialFromStorage = loadAuth()

const initialState = {
  user: initialFromStorage?.user ?? null,
  token: initialFromStorage?.token ?? null,
  status: 'idle',
  error: null,
}

export const loginThunk = createAsyncThunk('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const data = await authAPI.login(payload)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Login failed')
  }
})

export const signupThunk = createAsyncThunk('auth/signup', async (payload) => {
  const data = await authAPI.signup(payload)
  return data
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.status = 'idle'
      state.error = null
      saveAuth({ token: null, user: null })
    },
    demoLogin(state, action) {
      state.user = action.payload?.user ?? { email: 'admin@example.com' }
      state.token = action.payload?.token ?? 'demo-token'
      state.status = 'succeeded'
      state.error = null
      saveAuth({ token: state.token, user: state.user })
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload?.user ?? null
        state.token = action.payload?.token ?? null
        state.error = null
        saveAuth({ token: state.token, user: state.user })
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || action.error?.message || 'Login failed'
      })
      .addCase(signupThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(signupThunk.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload?.user ?? null
        state.token = action.payload?.token ?? null
        state.error = null
        saveAuth({ token: state.token, user: state.user })
      })
      .addCase(signupThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error?.message ?? 'Signup failed'
      })
  },
})

export const { logout, demoLogin } = authSlice.actions
export default authSlice.reducer

