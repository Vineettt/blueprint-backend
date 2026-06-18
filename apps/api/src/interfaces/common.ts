export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
}

export interface FormattedValidationError {
  field: string;
  message: string;
}

export interface MappingDelete {
  mapping_id: string;
}

export interface RoleRouteMapping {
  role_id: string;
  route_id: string;
}
