import { createOpenAPIRouter } from '@utils/routing/openapi-factory';
import { createRoute as createTrackedRoute } from '@utils/routing/route-introspection';
import { registerUserSchema, updateUserSchema, searchUsersSchema } from '@schemas/user.schema';
import { successDataResponseSchema, paginationDataResponseSchema } from '@schemas/response.schema';
import { errorResponseSchema } from '@schemas/common.schema';
import { ResponseBuilder } from '@utils/response-builder';
import { ErrorHandler } from '@utils/error-handler';
import { getService } from '@middleware/di/service-injection.middleware';
import type { UserService } from '@services/user/user.service';
import type { AppContext } from '@di/context-types';
import { extractPaginationParams } from '@utils/pagination-helper';
import { z } from 'zod';
import { logger } from '@blueprint/logger';

type RegisterUserDTO = z.infer<typeof registerUserSchema>;
type UpdateUserDTO = z.infer<typeof updateUserSchema>;
type SearchUsersDTO = z.infer<typeof searchUsersSchema>;

const userRoutes = createOpenAPIRouter();

const registerUserRoute = createTrackedRoute({
  method: 'post',
  path: '/user',
  tags: ['Users'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
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

const registerUserHandler = async (c: AppContext) => {
  const { email, password, first_name, last_name } = c.get('validatedBody') as RegisterUserDTO;

  try {
    const userService = getService<UserService>(c, 'userService');
    const result = await userService.registerUser({
      email,
      password,
      firstName: first_name,
      lastName: last_name,
    });

    if (result && 'success' in result && result.success === false) {
      return ResponseBuilder.error(c, result.message, result.error);
    }

    const userResult = result as { id: string; email: string };
    return ResponseBuilder.created(c, 'User registered successfully', {
      userId: userResult.id,
      email: userResult.email,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'User registration');
  }
};

userRoutes.openapi(registerUserRoute, registerUserHandler);

const getUserDetailsRoute = createTrackedRoute({
  method: 'get',
  path: '/user',
  tags: ['Users'],
  responses: {
    200: {
      description: 'User details retrieved successfully',
      content: {
        'application/json': {
          schema: successDataResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
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

const getUserDetailsHandler = async (c: AppContext) => {
  const decoded = c.get('user') as { key: string; roles: string[] } | null;
  const userId = decoded?.key;

  if (!userId) {
    return ResponseBuilder.error(c, 'User ID is required', 'USER_ID_REQUIRED');
  }

  try {
    const userService = getService<UserService>(c, 'userService');
    const userDetails = await userService.getUserDetails(userId);

    return ResponseBuilder.success(c, 'User details retrieved successfully', {
      user: {
        id: userDetails.id,
        email: userDetails.email,
        first_name: userDetails.firstName,
        last_name: userDetails.lastName,
        roles: userDetails.roles,
        permissions: userDetails.permissions,
      },
    });
  } catch (error: unknown) {
    const userErrorMappings = {
      USER_NOT_FOUND: { message: 'User not found', status: 404 },
      USER_NOT_ACTIVE: { message: 'User account is not active', status: 403 },
    };
    return ErrorHandler.handleWithMappings(
      c,
      error,
      userErrorMappings,
      'Failed to retrieve user details',
      'GET_USER_DETAILS_FAILED'
    );
  }
};

userRoutes.openapi(getUserDetailsRoute, getUserDetailsHandler);

const updateUserRoute = createTrackedRoute({
  method: 'put',
  path: '/user',
  tags: ['Users'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Users updated successfully',
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

const updateUserHandler = async (c: AppContext) => {
  const { user } = c.get('validatedBody') as UpdateUserDTO;

  try {
    const userService = getService<UserService>(c, 'userService');

    const mappedUsers = user.map(u => ({
      id: u.id,
      firstName: u.first_name ?? '',
      lastName: u.last_name ?? '',
      status: u.status,
    }));

    const result = await userService.updateUsers(mappedUsers);

    return ResponseBuilder.success(c, 'Users updated successfully', {
      updatedCount: result.updatedCount,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Update users');
  }
};

userRoutes.openapi(updateUserRoute, updateUserHandler);

const searchUsersRoute = createTrackedRoute({
  method: 'post',
  path: '/users',
  tags: ['Users'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: searchUsersSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Users retrieved successfully',
      content: {
        'application/json': {
          schema: paginationDataResponseSchema,
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

const searchUsersHandler = async (c: AppContext) => {
  const { limit, offset, search } = c.get('validatedBody') as SearchUsersDTO;

  const {
    limit: searchLimit,
    offset: searchOffset,
    search: searchTerm,
  } = extractPaginationParams({ limit, offset, search });

  try {
    const userService = getService<UserService>(c, 'userService');
    const { users, total } = await userService.searchUsers(searchTerm, searchLimit, searchOffset);

    logger.info('Users searched', { count: users.length, total });

    return ResponseBuilder.success(c, 'Users retrieved successfully', {
      payload: users,
      total,
    });
  } catch (error: unknown) {
    return ErrorHandler.handleGenericError(c, error, 'Search users');
  }
};

userRoutes.openapi(searchUsersRoute, searchUsersHandler);

export default userRoutes;
