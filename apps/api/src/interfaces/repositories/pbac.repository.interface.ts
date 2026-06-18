export interface RoleDelete {
  role_id: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface Route {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserRoleMapping {
  id: string;
  userFkId: string;
  roleFkId: string;
  createdAt: Date | null;
}

export interface RoleRouteMapping {
  id: string;
  roleFkId: string;
  routeFkId: string;
  createdAt: Date | null;
}

export interface RouteWithCount extends Route {
  total_count: number;
}

export interface RoleRouteMappingWithCount {
  id: string;
  roleId: string;
  routeId: string;
  name: string;
  endpoint: string;
  method: string;
  total_count: number;
}

export interface UserRoleMappingWithCount {
  id: string;
  user_fk_id: string;
  email: string;
  roles: string;
}

export interface RouteWithRoles {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  role_fk_ids: string[];
}

export interface UserRolesAndPermissions {
  role_ids: string[];
  role_names: string[];
  permissions: string[];
}

export interface IPbacRepository {
  getAllRoutes(): Promise<Route[]>;
  searchRoutesWithCount(search: string, limit: number, offset: number): Promise<RouteWithCount[]>;
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
  insertUserRoleMappings(mappings: { userFkId: string; roleFkId: string }[]): Promise<boolean>;
  deleteUserRoleMappings(mappingIds: string[]): Promise<boolean>;
  getUserRoleMappings(
    search: string,
    limit: number,
    offset: number
  ): Promise<UserRoleMappingWithCount[]>;
  getUserRolesAndPermissions(userId: string): Promise<UserRolesAndPermissions>;
  findRouteWithRoles(endpoint: string, method: string): Promise<RouteWithRoles[]>;
}
