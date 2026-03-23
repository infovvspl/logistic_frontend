import { useMemo } from 'react'
import { useSelector } from 'react-redux'

export function usePermissions() {
  const user = useSelector((s) => s.auth.user)

  return useMemo(() => {
    // Support role as a string field or nested roles array
    const roleStr = (
      user?.role ??
      user?.designation ??
      user?.roles?.[0] ??
      ''
    ).toLowerCase().replace(/[\s-]/g, '_')

    const isSuperAdmin = roleStr === 'super_admin' || roleStr === 'superadmin'
    const isAdmin = isSuperAdmin || roleStr === 'admin'

    const roles = user?.roles ?? (roleStr ? [roleStr] : [])
    const hasRole = (role) => roles.includes(role)

    return { roles, hasRole, isSuperAdmin, isAdmin }
  }, [user])
}

