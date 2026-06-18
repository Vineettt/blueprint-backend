import {
  Role,
  Route,
  RoleRouteMappingWithCount,
  UserRoleMappingWithCount,
} from '../repositories/pbac.repository.interface';

export interface IPbacService {
  createRoles(rolesData: { name: string }[]): Promise<Role[]>;
  getAllRoles(): Promise<Role[]>;
  deleteRoles(roleIds: string[]): Promise<boolean>;
  updateRoles(roleUpdates: { id: string; name: string }[]): Promise<boolean>;
  searchRoles(
    search: string,
    limit: number,
    offset: number
  ): Promise<{ roles: Role[]; total: number }>;
  searchRoutes(
    search: string,
    limit: number,
    offset: number
  ): Promise<{ routes: Route[]; total: number }>;
  updateRoutes(routeUpdates: { id: string; method: string }[]): Promise<boolean>;
  getRoutesByRole(roleId: string): Promise<Route[]>;
  createRoleRouteMappings(mappings: { roleId: string; routeId: string }[]): Promise<boolean>;
  deleteRoleRouteMappings(mappingIds: string[]): Promise<boolean>;
  getRoleRouteMappings(
    search: string,
    role: string,
    limit: number,
    offset: number
  ): Promise<RoleRouteMappingWithCount[]>;
  updateUserRoleMappings(mappings: { userFkId: string; roleFkId: string }[]): Promise<boolean>;
  updateUserRoleMappingsWithValidation(
    mapping: { user_fk_id: string; role_fk_id: string }[]
  ): Promise<boolean>;
  getUserRoleMappings(
    search: string,
    limit: number,
    offset: number
  ): Promise<UserRoleMappingWithCount[]>;
}
