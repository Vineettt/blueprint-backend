import PgBoss from 'pg-boss';

export const createBoss = (dbUrl?: string) => {
  const url = dbUrl;
  if (!url) {
    throw new Error('database URL is required');
  }
  const boss = new PgBoss(url);
  boss.on('error', error => {
    // eslint-disable-next-line no-console
    console.error('PgBoss error:', error);
  });
  return boss;
};
