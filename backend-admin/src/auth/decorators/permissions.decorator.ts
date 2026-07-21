import { SetMetadata } from '@nestjs/common';
import { Permissions as PermEnum } from '../../common/constants';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: PermEnum[]) => SetMetadata(PERMISSIONS_KEY, permissions);
