import { injectable, inject } from 'tsyringe';
import { RoleService } from './role.service';
import { RouteService } from './route.service';
import { RoleRouteMappingService } from './role-route-mapping.service';
import { UserRoleMappingService } from './user-role-mapping.service';

@injectable()
export class PbacService {
  constructor(
    @inject(RoleService) private roleService: RoleService,
    @inject(RouteService) private routeService: RouteService,
    @inject(RoleRouteMappingService) private roleRouteMappingService: RoleRouteMappingService,
    @inject(UserRoleMappingService) private userRoleMappingService: UserRoleMappingService
  ) {}

  async createRoles(rolesData: { name: string; description?: string }[]) {
    return this.roleService.createRoles(rolesData);
  }

  async getAllRoles() {
    return this.roleService.getAllRoles();
  }

  async deleteRoles(roleIds: string[]) {
    return this.roleService.deleteRoles(roleIds);
  }

  async updateRoles(roleUpdates: { id: string; name: string }[]) {
    return this.roleService.updateRoles(roleUpdates);
  }

  async searchRoles(search: string, limit: number, offset: number) {
    return this.roleService.searchRoles(search, limit, offset);
  }

  async searchRoutes(search: string, limit: number, offset: number) {
    return this.routeService.searchRoutes(search, limit, offset);
  }

  async updateRoutes(routeUpdates: { id: string; status: number }[]) {
    return this.routeService.updateRoutes(routeUpdates);
  }

  async getRoutesByRole(roleId: string, status: number[], unassignedOnly: boolean) {
    return this.routeService.getRoutesByRole(roleId, status, unassignedOnly);
  }

  async createRoleRouteMappings(mappings: { roleId: string; routeId: string }[]) {
    return this.roleRouteMappingService.createRoleRouteMappings(mappings);
  }

  async deleteRoleRouteMappings(mappingIds: string[]) {
    return this.roleRouteMappingService.deleteRoleRouteMappings(mappingIds);
  }

  async getRoleRouteMappings(
    search: string,
    role: string,
    limit: number,
    offset: number,
    status: number[]
  ) {
    return this.roleRouteMappingService.getRoleRouteMappings(search, role, limit, offset, status);
  }

  async updateUserRoleMappings(mappings: { userFkId: string; roleFkId: string }[]) {
    return this.userRoleMappingService.insertUserRoleMappings(mappings);
  }

  async updateUserRoleMappingsWithValidation(
    mapping: { user_fk_id: string; role_fk_id: string }[]
  ) {
    return this.userRoleMappingService.syncUserRoleMappings(mapping);
  }

  async getUserRoleMappings(search: string, limit: number, offset: number) {
    return this.userRoleMappingService.getUserRoleMappings(search, limit, offset);
  }
}
