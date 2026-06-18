import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import {
  resetPasswordSchema,
  forgotPasswordSchema,
  resetPasswordWithRepeatSchema,
} from '@schemas/auth/auth.schema';
import { successDataResponseSchema } from '@schemas/response.schema';
import { errorResponseSchema } from '@schemas/common.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { ErrorHandler } from '@utils/error-handler';
import { getService } from '@middleware/di/service-injection.middleware';
import type { PasswordService } from '@services/auth/password.service';
import type { EmailService } from '@services/email/email.service';
import type { AppContext } from '@di/context-types';
import z from 'zod';

const passwordRoutes = createOpenAPIRouter();
type ResetPasswordDTO = z.infer<typeof resetPasswordWithRepeatSchema>;
type ForgetPasswordDTO = z.infer<typeof forgotPasswordSchema>;

const resetPasswordRoute = createTrackedRoute({
  method: 'post',
  path: '/reset',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: resetPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successful',
      content: {
        'application/json': {
          schema: successDataResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const resetPasswordHandler = async (c: AppContext) => {
  const { password, repeat_password, token } = c.get('validatedBody') as ResetPasswordDTO;
  try {
    const passwordService = getService<PasswordService>(c, 'passwordService');
    const email = await passwordService.resetPassword(password, repeat_password, token);

    return ResponseBuilder.success(c, 'Password updated successfully', { email });
  } catch (error: unknown) {
    return ErrorHandler.handleAuthError(c, error);
  }
};

passwordRoutes.openapi(resetPasswordRoute, resetPasswordHandler);

const forgotPasswordRoute = createTrackedRoute({
  method: 'put',
  path: '/forgot',
  tags: ['Authentication'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: forgotPasswordSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset token generated',
      content: {
        'application/json': {
          schema: successDataResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

const forgotPasswordHandler = async (c: AppContext) => {
  const { email } = c.get('validatedBody') as ForgetPasswordDTO;

  try {
    const passwordService = getService<PasswordService>(c, 'passwordService');
    const resetToken = await passwordService.forgotPassword(email);

    const emailService = getService<EmailService>(c, 'emailService');
    await emailService.sendPasswordResetEmail(email, resetToken.token);

    return ResponseBuilder.success(c, 'Password reset email sent successfully', { email });
  } catch (error: unknown) {
    return ErrorHandler.handleAuthError(c, error);
  }
};

passwordRoutes.openapi(forgotPasswordRoute, forgotPasswordHandler);

export default passwordRoutes;
