export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  password?: string;
  accountLockedUntil?: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  deletedAt: Date | null;
  status: number | null;
  roles?: string[];
  permissions?: string[];
}

export interface UserUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  status?: number;
  isDeleted?: number;
  accountLockedUntil?: Date | null;
  updatedAt?: Date;
}

export interface UserWithCount extends User {
  total_count: number;
}

export interface UserPartial {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface UserRoleMapping {
  user_fk_id: string;
  role_fk_id: string;
}

export interface AuthProfilePayload {
  user: User;
  nowDb: Date;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findByToken(tokenHash: string): Promise<User | null>;
  findByResetToken(tokenHash: string): Promise<User | null>;
  findById(id: string): Promise<UserPartial | null>;
  findDetailsByToken(tokenHash: string): Promise<UserPartial | null>;
  updateStatus(userId: string, status: number): Promise<boolean>;
  update(userId: string, updates: UserUpdateData): Promise<void>;
  updatePassword(email: string, password: string): Promise<boolean>;
  create(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User>;
  findByEmailSearchWithCount(search: string, limit: number, offset: number): Promise<unknown[]>;
}
