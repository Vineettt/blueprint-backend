import "reflect-metadata";

import { readdirSync } from 'fs';
import { join, resolve, relative } from 'path';
import { pathToFileURL } from 'url';
import { container } from '../src/di/container';
import { DI_TOKENS } from '../src/di/tokens';
import { RouteSyncService } from "../src/services/pbac";
function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  try {
    const items = readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...findRouteFiles(fullPath));
      } else if (item.isFile() && item.name.endsWith('.routes.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not read directory ${dir}:`, error);
  }
  
  return files;
}

async function loadAllRoutes() {
  const routesDir = resolve('./src/routes');
  
  try {
    const routeFiles = findRouteFiles(routesDir);
    const relativeFiles = routeFiles.map(file => relative(routesDir, file));
    
    console.log(`📁 Found ${routeFiles.length} route files: ${relativeFiles.join(', ')}`);
    
    for (const file of routeFiles) {
      console.log(`🔄 Loading ${relative(routesDir, file)}...`);
      const moduleUrl = pathToFileURL(file).href;
      await import(moduleUrl);
    }
    
    console.log(`✅ Loaded ${routeFiles.length} route modules`);
  } catch (error) {
    console.error('❌ Failed to load routes:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔄 Auto-discovering routes and syncing to database...');
    
    await loadAllRoutes();
    
    const routeSyncService = container.resolve<RouteSyncService>(DI_TOKENS.IRouteSyncService);

    const result = await routeSyncService.autoSyncRoutes();
    
    if (result.errors.length > 0) {
      console.warn('Route sync errors:', result.errors);
    }
    
    const status = await routeSyncService.getSyncStatus();
    console.log('Route sync status:', status);
    
    console.log('✅ Route sync completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Route sync failed:', error);
    process.exit(1);
  }
}

main();
