import { api } from '../../services/axios.js'

export async function login(payload) {
  // Map 'email' field to 'phone/email' as expected by the API
  const apiPayload = {
    'phone/email': payload.email,
    password: payload.password,
  }
  const { data } = await api.post('/auth/login', apiPayload)
  return data
}

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload)
  return data
}

export async function me() {
  const { data } = await api.get('/auth/me')
  return data
}

