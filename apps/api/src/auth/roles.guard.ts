import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // If route requires roles but user has no roles, deny
    if (!user || !user.roles || !Array.isArray(user.roles)) {
        throw new ForbiddenException('Access denied. Insufficient roles.');
    }

    const hasRole = () => user.roles.some((role: string) => requiredRoles.includes(role));

    if (hasRole()) {
        return true;
    }

    throw new ForbiddenException('Access denied. Insufficient roles.');
  }
}
