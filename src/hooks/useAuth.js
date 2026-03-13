import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk, logout, signupThunk } from '../features/auth/authSlice.js'

export function useAuth() {
  const dispatch = useDispatch()
  const { user, token, status, error } = useSelector((s) => s.auth)

  const login = useCallback(
    (payload) => dispatch(loginThunk(payload)).unwrap(),
    [dispatch],
  )

  const signup = useCallback(
    (payload) => dispatch(signupThunk(payload)).unwrap(),
    [dispatch],
  )

  const doLogout = useCallback(() => dispatch(logout()), [dispatch])

  return {
    user,
    token,
    status,
    error,
    isAuthenticated: Boolean(token),
    login,
    signup,
    logout: doLogout,
  }
}

