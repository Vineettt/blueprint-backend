export function extractPaginationParams(params: {
  limit?: number;
  offset?: number;
  search?: string;
}): { limit: number; offset: number; search: string } {
  return {
    limit: params.limit || 10,
    offset: params.offset || 0,
    search: params.search || '',
  };
}
