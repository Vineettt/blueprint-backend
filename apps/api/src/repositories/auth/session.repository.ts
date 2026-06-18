import { authDb } from '@blueprint/db';
import { sql } from 'drizzle-orm';
import { DeviceDetectorWrapper, getDeviceDisplayName } from '@utils/device/device-detector-wrapper';
import { DeviceInfo } from '@interfaces/domain';
import { SessionWithDevice } from '@interfaces/repositories';

export const createSessionWithActivityUpdate = async (
  userId: string,
  ipAddress: string,
  userAgent?: string
): Promise<string> => {
  let deviceInfo: DeviceInfo | null = null;

  if (userAgent) {
    deviceInfo = DeviceDetectorWrapper.detect(userAgent);
  }

  const result = await authDb.execute(sql`
    INSERT INTO user_sessions (
      user_fk_id, ip_address, user_agent, device_info, login_time, is_active, last_activity
    ) VALUES (
      ${userId}, 
      ${ipAddress}, 
      ${userAgent || null}, 
      ${deviceInfo ? sql`${deviceInfo}` : null}, 
      NOW(), 
      true, 
      NOW()
    )
    RETURNING id
  `);

  return String((result.rows[0] as { id: string }).id);
};

export const getUserSessionsWithDevice = async (userId: string): Promise<SessionWithDevice[]> => {
  const result = await authDb.execute(sql`
    SELECT 
      id, 
      user_fk_id, 
      ip_address, 
      user_agent, 
      device_info, 
      login_time, 
      logout_time, 
      is_active, 
      failed_attempts, 
      last_activity
    FROM user_sessions 
    WHERE user_fk_id = ${userId}
    ORDER BY login_time DESC
  `);

  return result.rows.map(row => {
    const rawDeviceInfo = row.device_info;
    const deviceInfo: DeviceInfo | null =
      typeof rawDeviceInfo === 'string' ? JSON.parse(rawDeviceInfo) : rawDeviceInfo;
    const safeDeviceInfo = deviceInfo || {
      deviceType: 'unknown',
      brand: 'Unknown',
      model: 'Unknown',
      operatingSystem: 'Unknown',
      browser: 'Unknown',
    };
    return {
      id: String(row.id),
      userFkId: String(row.user_fk_id),
      ipAddress: row.ip_address ? String(row.ip_address) : null,
      userAgent: row.user_agent ? String(row.user_agent) : null,
      deviceType: safeDeviceInfo.deviceType || null,
      deviceBrand: safeDeviceInfo.brand || null,
      deviceModel: safeDeviceInfo.model || null,
      operatingSystem: safeDeviceInfo.operatingSystem || null,
      browser: safeDeviceInfo.browser || null,
      loginTime: new Date(row.login_time as string),
      logoutTime: row.logout_time ? new Date(row.logout_time as string) : null,
      isActive: Boolean(row.is_active),
      failedAttempts: Number(row.failed_attempts),
      lastActivity: new Date(row.last_activity as string),
      deviceDisplayName: getDeviceDisplayName(safeDeviceInfo),
    };
  });
};

export const updateSessionLastActivity = (sessionId: string): void => {
  authDb
    .execute(
      sql`
    UPDATE user_sessions 
    SET last_activity = NOW()
    WHERE id = ${sessionId} AND is_active = true
  `
    )
    .catch(() => {});
};

export const getUserIdBySessionId = async (sessionId: string): Promise<string | null> => {
  const result = await authDb.execute(sql`
    SELECT user_fk_id 
    FROM user_sessions 
    WHERE id = ${sessionId} AND is_active = true
  `);

  return result.rows[0] ? String(result.rows[0].user_fk_id) : null;
};
