/**
 * RequirePermission Component
 * 
 * Conditional rendering gebaseerd op permissions
 */


import { useAdminPermissions, type Permission } from '../../hooks/useAdminPermissions';

interface RequirePermissionProps {
  permission: keyof Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RequirePermission: React.FC<RequirePermissionProps> = ({ 
  permission, 
  fallback = null, 
  children 
}) => {
  const { can } = useAdminPermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
};
