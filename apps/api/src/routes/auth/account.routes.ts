import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import { activateAccountSchema, getAccountDetailsSchema } from '@schemas/auth/auth.schema';
import { successDataResponseSchema } from '@schemas/response.schema';
import { errorResponseSchema } from '@schemas/common.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { ErrorHandler } from '@utils/error-handler';
import type { AccountService } from '@services/auth/account.service';
import type { AppContext } from '@di/context-types';
import { getService } from '@middleware/di/service-injection.middleware';
import { z } from 'zod';

const accountRoutes = createOpenAPIRouter();
type ActivateAccountDTO = z.infer<typeof activateAccountSchema>;
type GetAccountDetailsDTO = z.infer<typeof getAccountDetailsSchema>;

const activateAccountRoute = createTrackedRoute({
  method: 'post',
  path: '/activate',
  tags: ['Account'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: activateAccountSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Account activated successfully',
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

const activateAccountHandler = async (c: AppContext) => {
  const { token } = c.get('validatedBody') as ActivateAccountDTO;

  try {
    const accountService = getService<AccountService>(c, 'accountService');
    const result = await accountService.activateAccount(token);

    return ResponseBuilder.success(c, 'Account activated successfully', result);
  } catch (error: unknown) {
    const accountErrorMappings = {
      'Token is required': { message: 'Token is required', status: 400 },
      'Invalid or expired activation token': {
        message: 'Invalid or expired activation token',
        status: 400,
      },
      'Account is already activated or invalid status': {
        message: 'Account is already activated or invalid status',
        status: 400,
      },
      'Invalid activation token': { message: 'Invalid activation token', status: 400 },
    };
    return ErrorHandler.handleWithMappings(
      c,
      error,
      accountErrorMappings,
      'Account activation failed',
      'ACTIVATION_FAILED'
    );
  }
};

accountRoutes.openapi(activateAccountRoute, activateAccountHandler);

const getAccountDetailsRoute = createTrackedRoute({
  method: 'post',
  path: '/details',
  tags: ['Account'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: getAccountDetailsSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Account details retrieved successfully',
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

const getAccountDetailsHandler = async (c: AppContext) => {
  const { token } = c.get('validatedBody') as GetAccountDetailsDTO;

  try {
    const accountService = getService<AccountService>(c, 'accountService');
    const userDetails = await accountService.getAccountDetails(token);

    return ResponseBuilder.success(c, 'Account details retrieved successfully', {
      user: userDetails,
    });
  } catch (error: unknown) {
    const accountErrorMappings = {
      'Token is required': { message: 'Token is required', status: 400 },
      'Invalid or expired token': { message: 'Invalid or expired token', status: 400 },
    };
    return ErrorHandler.handleWithMappings(
      c,
      error,
      accountErrorMappings,
      'Failed to retrieve account details',
      'DETAILS_FAILED'
    );
  }
};

accountRoutes.openapi(getAccountDetailsRoute, getAccountDetailsHandler);

export default accountRoutes;
