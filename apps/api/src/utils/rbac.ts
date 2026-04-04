// src/utils/rbac.ts

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "GUEST";

/**
 * Determines if a user can edit workspace settings or billing.
 */
export const canManageWorkspace = (role: WorkspaceRole): boolean => {
  return role === "OWNER" || role === "ADMIN";
};

/**
 * Determines if a user can create or edit documents.
 */
export const canEditDocuments = (role: WorkspaceRole): boolean => {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
};