import { SessionWithDevice } from '../repositories';

export interface ISessionRepository {
  createSessionWithActivityUpdate(
    userId: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<string>;
  getUserSessionsWithDevice(userId: string): Promise<SessionWithDevice[]>;
  updateSessionLastActivity(sessionId: string): void;
}
