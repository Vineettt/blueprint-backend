const UUIDV7_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUUIDv7 = (value: string) => {
  if (typeof value !== 'string') {
    return false;
  }
  return UUIDV7_REGEX.test(value);
};
