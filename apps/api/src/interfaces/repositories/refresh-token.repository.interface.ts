export interface RefreshTokenValidationResult {
  userId: string;
  valid: boolean;
}

export interface IRefreshTokenRepository {
  validateRefreshTokenOptimized(
    token: string,
    expectedSessionId?: string
  ): Promise<RefreshTokenValidationResult | null>;
}
