import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string; // user id
  tenantId: string;
  role: string;
  activeLocationId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      // Fail fast at startup rather than silently signing/verifying with
      // `undefined` as the secret if the env var is missing.
      throw new Error('JWT_ACCESS_SECRET is not set');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Whatever is returned here becomes `req.user`
  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      activeLocationId: payload.activeLocationId,
    };
  }
}
