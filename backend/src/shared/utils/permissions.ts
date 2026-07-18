import { Role } from '@prisma/client';

export const PERMISSIONS = {
  OWNER: ["*"],
  ADMIN: [
    "ticket:create",
    "ticket:read",
    "ticket:update",
    "ticket:delete",
    "ticket:assign",
    "user:manage",
    "dashboard:read",
    "organization:update"
  ],
  AGENT: [
    "ticket:create",
    "ticket:read",
    "ticket:update",
    "ticket:assign",
    "comment:create",
    "internal_note:create",
    "dashboard:read"
  ],
  REQUESTER: [
    "ticket:create",
    "ticket:read:own",
    "comment:create"
  ]
};

export const hasPermission = (role: Role, permission: string): boolean => {
  const userPermissions = PERMISSIONS[role] || [];
  if (userPermissions.includes("*")) {
    return true;
  }
  return userPermissions.includes(permission);
};
