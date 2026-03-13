import axios from 'axios'
import Cookies from 'js-cookie'
import { STORAGE_KEYS } from '../utils/constants.js'

let accessTokenGetter = () => Cookies.get(STORAGE_KEYS.auth + '.token')

export function setAccessTokenGetter(getter) {
  accessTokenGetter = typeof getter === 'function' ? getter : () => Cookies.get(STORAGE_KEYS.auth + '.token')
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = accessTokenGetter?.()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

