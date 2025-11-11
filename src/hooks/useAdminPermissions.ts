/**
 * useAdminPermissions Hook
 * 
 * Role-Based Access Control (RBAC) foundation:
 * - Define user roles (admin, staff, read-only)
 * - Permission checks voor destructive actions
 * - Foundation voor toekomstige uitbreiding
 * 
 * Roles:
 * - admin: Full access, kan alles
 * - staff: Kan reserveringen beheren, geen events/settings
 * - read-only: Alleen lezen, geen wijzigingen
 */

import { useState, useEffect } from 'react';

export type AdminRole = 'admin' | 'staff' | 'read-only';

export interface Permission {
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canConfirmReservations: boolean;
  canCancelReservations: boolean;
  canEditCustomers: boolean;
  canAccessSettings: boolean;
  canAccessFinancial: boolean;
  canExportData: boolean;
  canManageVouchers: boolean;
  canSendEmails: boolean;
}

const ROLE_PERMISSIONS: Record<AdminRole, Permission> = {
  admin: {
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canConfirmReservations: true,
    canCancelReservations: true,
    canEditCustomers: true,
    canAccessSettings: true,
    canAccessFinancial: true,
    canExportData: true,
    canManageVouchers: true,
    canSendEmails: true
  },
  staff: {
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canConfirmReservations: true,
    canCancelReservations: true,
    canEditCustomers: true,
    canAccessSettings: false,
    canAccessFinancial: false,
    canExportData: true,
    canManageVouchers: false,
    canSendEmails: true
  },
  'read-only': {
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canConfirmReservations: false,
    canCancelReservations: false,
    canEditCustomers: false,
    canAccessSettings: false,
    canAccessFinancial: false,
    canExportData: true,
    canManageVouchers: false,
    canSendEmails: false
  }
};

interface UseAdminPermissionsReturn {
  role: AdminRole;
  permissions: Permission;
  setRole: (role: AdminRole) => void;
  can: (permission: keyof Permission) => boolean;
  requirePermission: (permission: keyof Permission, errorMessage?: string) => boolean;
}

export function useAdminPermissions(): UseAdminPermissionsReturn {
  // In production, role zou uit auth/user context komen
  // Voor nu: localStorage met default 'admin'
  const [role, setRoleState] = useState<AdminRole>(() => {
    try {
      const stored = localStorage.getItem('adminRole');
      return (stored as AdminRole) || 'admin';
    } catch {
      return 'admin';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('adminRole', role);
    } catch (error) {
      console.error('Failed to save admin role:', error);
    }
  }, [role]);

  const permissions = ROLE_PERMISSIONS[role];

  const can = (permission: keyof Permission): boolean => {
    return permissions[permission];
  };

  const requirePermission = (
    permission: keyof Permission,
    errorMessage: string = `Je hebt geen toestemming voor deze actie (vereist: ${permission})`
  ): boolean => {
    const hasPermission = can(permission);
    if (!hasPermission) {
      console.warn(errorMessage);
      // In production: show toast notification
    }
    return hasPermission;
  };

  const setRole = (newRole: AdminRole) => {
    setRoleState(newRole);
    console.log(`Admin role changed to: ${newRole}`);
  };

  return {
    role,
    permissions,
    setRole,
    can,
    requirePermission
  };
}


