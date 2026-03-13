import { useMemo } from 'react'
import { useSelector } from 'react-redux'

export function usePermissions() {
  const user = useSelector((s) => s.auth.user)

  return useMemo(() => {
    const roles = user?.roles ?? []
    const hasRole = (role) => roles.includes(role)
    return { roles, hasRole }
  }, [user])
}

