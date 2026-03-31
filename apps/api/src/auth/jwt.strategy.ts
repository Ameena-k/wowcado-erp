import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction && !process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is missing for production deployment.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret-for-dev',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (user) {
        return { ...user, roles: user.userRoles?.map((ur: any) => ur.role.name) || [] };
    }
    return user;
  }
}
