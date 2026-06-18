import { Hono } from 'hono';
import app from '../../src/app';

export interface TestServer {
  app: any;
  request: (path: string, options?: RequestInit) => Promise<Response>;
}

export function createTestServer(): TestServer {
  const testApp = app;

  const request = async (path: string, options: RequestInit = {}) => {
    const url = `http://localhost${path}`;
    const defaultOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    return testApp.request(url, defaultOptions);
  };

  return {
    app: testApp,
    request,
  };
}

export async function createAuthenticatedRequest(server: TestServer, token?: string) {
  return {
    get: (path: string, options?: RequestInit) => 
      server.request(path, {
        ...options,
        headers: {
          ...options?.headers,
          'Authorization': token ? `Bearer ${token}` : 'Bearer test-token',
        },
      }),
    
    post: (path: string, body?: any, options?: RequestInit) =>
      server.request(path, {
        method: 'POST',
        body: JSON.stringify(body),
        ...options,
        headers: {
          ...options?.headers,
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'Bearer test-token',
        },
      }),
    
    put: (path: string, body?: any, options?: RequestInit) =>
      server.request(path, {
        method: 'PUT',
        body: JSON.stringify(body),
        ...options,
        headers: {
          ...options?.headers,
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : 'Bearer test-token',
        },
      }),
    
    delete: (path: string, options?: RequestInit) =>
      server.request(path, {
        method: 'DELETE',
        ...options,
        headers: {
          ...options?.headers,
          'Authorization': token ? `Bearer ${token}` : 'Bearer test-token',
        },
      }),
  };
}
