import { z } from 'zod';

interface PasswordValidationResult {
  isValid: boolean;
  error?: string;
  message?: string;
}

interface PasswordStrengthResult {
  score: number;
  feedback: string[];
  level: 'weak' | 'moderate' | 'strong';
}

export class PasswordValidator {
  static readonly schema = z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

  static validate(
    password: string,
    schema: z.ZodString = PasswordValidator.schema
  ): PasswordValidationResult {
    const result = schema.safeParse(password);

    if (!result.success) {
      return {
        isValid: false,
        error: result.error.issues[0].code,
        message: result.error.issues[0].message,
      };
    }

    return { isValid: true };
  }

  static getStrength(password: string): PasswordStrengthResult {
    const feedback = [];
    let score = 0;

    if (password.length >= 12) score += 30;
    else if (password.length >= 8) score += 20;
    else if (password.length >= 6) score += 10;
    else feedback.push('Use at least 6 characters (8+ recommended)');

    if (/[A-Z]/.test(password)) score += 20;
    else feedback.push('Add uppercase letters');

    if (/[a-z]/.test(password)) score += 20;
    else feedback.push('Add lowercase letters');

    if (/[0-9]/.test(password)) score += 20;
    else feedback.push('Add numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 10;
    else feedback.push('Add special characters');

    let level: 'weak' | 'moderate' | 'strong' = 'weak';
    if (score >= 80) level = 'strong';
    else if (score >= 60) level = 'moderate';
    else if (score >= 40) level = 'weak';

    return { score, feedback, level };
  }
}

export const passwordSchema = PasswordValidator.schema;
