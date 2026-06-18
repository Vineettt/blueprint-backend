import { injectable } from 'tsyringe';
import { authDb } from '@blueprint/db';
import { sql } from 'drizzle-orm';
import { getDeviceDisplayName } from '@utils/device/device-detector-wrapper';
import { SessionWithDevice } from '@interfaces/repositories';

interface SessionRow {
  id: string | number;
  user_fk_id: string | number;
  ip_address: string | null;
  user_agent: string | null;
  device_info: string | null;
  login_time: string;
  logout_time: string | null;
  is_active: boolean | number;
  failed_attempts: number;
  last_activity: string;
}

@injectable()
export class SessionService {
  async deactivateSession(userId: string): Promise<void> {
    await authDb.execute(sql`
      UPDATE user_sessions
      SET is_active = false, logout_time = NOW()
      WHERE user_fk_id = ${userId} AND is_active = true`);
  }

  async getUserSessions(userId: string): Promise<SessionWithDevice[]> {
    const result = await authDb.execute(sql`
      SELECT 
        id, user_fk_id, ip_address, user_agent, device_info, login_time, logout_time, is_active, failed_attempts, last_activity
      FROM user_sessions 
      WHERE user_fk_id = ${userId}
      ORDER BY last_activity DESC
    `);

    return this.mapSessions(result.rows);
  }

  async getActiveSessions(userId: string): Promise<SessionWithDevice[]> {
    const result = await authDb.execute(sql`
      SELECT 
        id, user_fk_id, ip_address, user_agent, device_info, login_time, logout_time, is_active, failed_attempts, last_activity
      FROM user_sessions 
      WHERE user_fk_id = ${userId} AND is_active = true
      ORDER BY last_activity DESC
    `);

    return this.mapSessions(result.rows);
  }

  async deactivateSessionById(sessionId: string): Promise<void> {
    await authDb.execute(sql`
      UPDATE user_sessions 
      SET is_active = false, logout_time = NOW()
      WHERE id = ${sessionId}
    `);
  }

  private mapSessions(rows: unknown[]): SessionWithDevice[] {
    return rows.map(session => {
      const sessionRow = session as SessionRow;
      const deviceInfo = sessionRow.device_info ? JSON.parse(sessionRow.device_info) : null;
      return {
        id: String(sessionRow.id),
        userFkId: String(sessionRow.user_fk_id),
        ipAddress: sessionRow.ip_address,
        userAgent: sessionRow.user_agent,
        deviceType: deviceInfo?.deviceType,
        deviceBrand: deviceInfo?.brand,
        deviceModel: deviceInfo?.model,
        operatingSystem: deviceInfo?.operatingSystem,
        browser: deviceInfo?.browser,
        loginTime: new Date(sessionRow.login_time),
        logoutTime: sessionRow.logout_time ? new Date(sessionRow.logout_time) : null,
        isActive: Boolean(sessionRow.is_active),
        failedAttempts: sessionRow.failed_attempts,
        lastActivity: new Date(sessionRow.last_activity),
        deviceDisplayName: deviceInfo ? getDeviceDisplayName(deviceInfo) : 'Unknown Device',
      };
    });
  }
}
