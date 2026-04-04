// src/__tests__/rbac.test.ts

import { canManageWorkspace, canEditDocuments, WorkspaceRole } from '../utils/rbac';

describe('Role-Based Access Control (RBAC)', () => {
  
  describe('canManageWorkspace', () => {
    it('should allow OWNER to manage workspace', () => {
      expect(canManageWorkspace("OWNER")).toBe(true);
    });

    it('should allow ADMIN to manage workspace', () => {
      expect(canManageWorkspace("ADMIN")).toBe(true);
    });

    it('should deny MEMBER from managing workspace', () => {
      expect(canManageWorkspace("MEMBER")).toBe(false);
    });

    it('should deny GUEST from managing workspace', () => {
      expect(canManageWorkspace("GUEST")).toBe(false);
    });
  });

  describe('canEditDocuments', () => {
    it('should allow MEMBER to edit documents', () => {
      expect(canEditDocuments("MEMBER")).toBe(true);
    });

    it('should deny GUEST from editing documents', () => {
      expect(canEditDocuments("GUEST")).toBe(false);
    });
  });

});