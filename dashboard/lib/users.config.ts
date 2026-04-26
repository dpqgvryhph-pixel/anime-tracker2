// =============================================================
// FELHASZNÁLÓK ÉS JOGKÖRÖK KONFIGURÁCIÓJA
// =============================================================
// Ide vedd fel az összes felhasználót.
// Role-ok:
//   'superadmin' - teljes hozzáférés, nem törölhető
//   'admin'      - felhasználók kezelése, stats megtekintése
//   'viewer'     - csak olvasás, nincs admin panel
// =============================================================

export type UserRole = 'superadmin' | 'admin' | 'viewer';

export interface DashboardUser {
  username: string;
  password: string;          // Ide írd a jelszót - egyszerű szöveg
  role: UserRole;
  displayName?: string;      // Megjelenítendő név (opcionális)
}

// ✏️  ITT VÁLTOZTASD MEG A FELHASZNÁLÓKAT ÉS JELSZAVAKAT
export const DASHBOARD_USERS: DashboardUser[] = [
  {
    username: 'admin',
    password: 'admin',         // ← Jelszó módosítása itt
    role: 'superadmin',
    displayName: 'Adminisztrátor',
  },
  // Több felhasználó hozzáadása:
  // {
  //   username: 'nezi',
  //   password: 'jelszo123',
  //   role: 'viewer',
  //   displayName: 'Néző Felhasználó',
  // },
];

// Jogkör engedélyek definíciói
export const ROLE_PERMISSIONS: Record<UserRole, {
  canViewDashboard: boolean;
  canViewAdmin: boolean;
  canManageUsers: boolean;
  canViewStats: boolean;
  canManageTokens: boolean;
  canDelete: boolean;
}> = {
  superadmin: {
    canViewDashboard: true,
    canViewAdmin: true,
    canManageUsers: true,
    canViewStats: true,
    canManageTokens: true,
    canDelete: true,
  },
  admin: {
    canViewDashboard: true,
    canViewAdmin: true,
    canManageUsers: false,     // Admin nem tud felhasználókat kezelni
    canViewStats: true,
    canManageTokens: true,
    canDelete: false,
  },
  viewer: {
    canViewDashboard: true,
    canViewAdmin: false,
    canManageUsers: false,
    canViewStats: false,
    canManageTokens: false,
    canDelete: false,
  },
};

// Segédfüggvények
export function findUser(username: string, password: string): DashboardUser | null {
  return DASHBOARD_USERS.find(
    u => u.username === username && u.password === password
  ) ?? null;
}

export function getUserByUsername(username: string): DashboardUser | null {
  return DASHBOARD_USERS.find(u => u.username === username) ?? null;
}

export function hasPermission(role: UserRole, permission: keyof typeof ROLE_PERMISSIONS[UserRole]): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function isProtectedRole(role: UserRole): boolean {
  return role === 'superadmin';
}
