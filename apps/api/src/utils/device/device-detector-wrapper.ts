import { UAParser } from 'ua-parser-js';
import { DeviceInfo } from '@interfaces/domain';

export const getDeviceDisplayName = (deviceInfo: DeviceInfo): string => {
  const parts: string[] = [];

  if (deviceInfo.brand && deviceInfo.brand !== 'Unknown') parts.push(deviceInfo.brand);
  if (deviceInfo.model && deviceInfo.model !== 'Unknown') parts.push(deviceInfo.model);
  if (deviceInfo.browser && deviceInfo.browser !== 'Unknown') parts.push(deviceInfo.browser);

  return parts.length > 0 ? parts.join(' ') : 'Unknown Device';
};

export class DeviceDetectorWrapper {
  private static parser = new UAParser();

  static detect(userAgent: string): DeviceInfo {
    const result = this.parser.setUA(userAgent).getResult();

    return {
      deviceType: this.mapDeviceType(result.device?.type || 'unknown'),
      brand: result.device?.vendor || 'Unknown',
      model: result.device?.model || 'Unknown',
      operatingSystem: `${result.os?.name || 'Unknown'}${result.os?.version ? ` ${result.os.version}` : ''}`,
      browser: `${result.browser?.name || 'Unknown'}${result.browser?.version ? ` ${result.browser.version}` : ''}`,
    };
  }

  static getDisplayName(device: DeviceInfo): string {
    return getDeviceDisplayName(device);
  }

  private static mapDeviceType(type: string): string {
    const typeMap: { [key: string]: string } = {
      mobile: 'Mobile',
      tablet: 'Tablet',
      desktop: 'Desktop',
      smarttv: 'TV',
      bot: 'Bot',
      wearable: 'Wearable',
      console: 'Console',
    };

    return typeMap[type.toLowerCase()] || 'Unknown';
  }
}
