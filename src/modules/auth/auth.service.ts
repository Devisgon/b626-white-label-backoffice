import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  sendEmail,
  generateOtp,
  emailVerificationOtpEmail,
  passwordResetOtpEmail,
} from './email.util';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

// Roles that must go through MFA once they've enabled it on their account.
// Add other admin-level roles here if/when you introduce them (check
// src/auth/enums/role.enum.ts for the full Role list).
const MFA_REQUIRED_ROLES = ['OWNER_ADMIN'];

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @InjectPinoLogger(AuthService.name) private logger: PinoLogger,
  ) {}

  // ---------- Helpers ----------

  private async issueTokens(user: {
    id: string;
    tenantId: string;
    role: string;
    activeLocationId: string | null;
  }) {
    const payload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      activeLocationId: user.activeLocationId,
    };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN') || '15m',
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '30d',
    });

    // Store a hash of the refresh token (never the raw token) so it can be
    // revoked on logout — this is the "secure session regeneration" piece.
    const tokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  private async audit(
    action: string,
    userId: string | null,
    tenantId: string | null,
    metadata?: any,
  ) {
    await this.prisma.auditLog.create({
      data: { action, userId, tenantId, metadata },
    });
    this.logger.info(
      { event: 'audit', action, userId, tenantId, metadata },
      action,
    );
  }

  private async createOtp(
    userId: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  ) {
    // Invalidate any previous unused OTPs of the same purpose first,
    // so only the most recently sent code is ever valid.
    await this.prisma.otpToken.updateMany({
      where: { userId, purpose: purpose as any, used: false },
      data: { used: true },
    });

    const otp = generateOtp();
    const codeHash = await bcrypt.hash(otp, 10);

    await this.prisma.otpToken.create({
      data: {
        userId,
        purpose: purpose as any,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      },
    });

    return otp;
  }

  private async verifyOtp(
    userId: string,
    otp: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  ) {
    const record = await this.prisma.otpToken.findFirst({
      where: { userId, purpose: purpose as any, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!record)
      throw new BadRequestException(
        'No active code found — please request a new one',
      );
    if (record.expiresAt < new Date())
      throw new BadRequestException(
        'Code has expired — please request a new one',
      );
    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      throw new ForbiddenException(
        'Too many incorrect attempts — please request a new code',
      );
    }

    const isMatch = await bcrypt.compare(otp, record.codeHash);
    if (!isMatch) {
      await this.prisma.otpToken.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      this.logger.warn(
        { userId, purpose, attempts: record.attempts + 1 },
        'Incorrect OTP attempt',
      );
      throw new BadRequestException('Incorrect code');
    }

    await this.prisma.otpToken.update({
      where: { id: record.id },
      data: { used: true },
    });
    return true;
  }

  // ---------- Signup / onboarding flow ----------

  // Registering a user auto-creates their Tenant (organization) behind the
  // scenes — no tenantId is ever supplied by the client. The first user of
  // a brand new tenant is automatically the OWNER_ADMIN.
  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Wrapped in a transaction — if user creation fails, the tenant
    // creation is rolled back too, so we never end up with an orphaned
    // tenant that has no admin.
    const { user } = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: `${dto.name}'s Organization` },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.name,
          email: dto.email,
          passwordHash,
          role: 'OWNER_ADMIN', // first user of a new tenant is always the owner
          isEmailVerified: false,
          onboardingStatus: 'PENDING_EMAIL_VERIFICATION',
        },
      });

      return { tenant, user };
    });

    const otp = await this.createOtp(user.id, 'EMAIL_VERIFICATION');
    await sendEmail(
      user.email,
      'Verify your email',
      emailVerificationOtpEmail(otp),
    );

    await this.audit('USER_REGISTERED', user.id, user.tenantId);
    this.logger.info(
      {
        userId: user.id,
        tenantId: user.tenantId,
        onboardingStatus: user.onboardingStatus,
      },
      'Onboarding step: registration complete (tenant auto-created), awaiting email verification',
    );

    // No access/refresh tokens issued yet on purpose — the account can't be
    // used until the email is verified.
    return {
      message:
        'Account created. A verification code has been sent to your email.',
      userId: user.id,
      onboardingStatus: user.onboardingStatus,
    };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (user.isEmailVerified) {
      return { message: 'Email is already verified. Please log in.' };
    }

    await this.verifyOtp(user.id, otp, 'EMAIL_VERIFICATION');

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, onboardingStatus: 'EMAIL_VERIFIED' },
    });

    await this.audit('EMAIL_VERIFIED', user.id, user.tenantId);
    this.logger.info(
      {
        userId: user.id,
        tenantId: user.tenantId,
        onboardingStatus: updated.onboardingStatus,
      },
      'Onboarding step: email verified',
    );

    // Log the user straight in — this token is what lets them immediately
    // proceed to create their first location (the next onboarding step).
    const tokens = await this.issueTokens({
      id: updated.id,
      tenantId: updated.tenantId,
      role: updated.role,
      activeLocationId: updated.activeLocationId,
    });

    return { user: this.publicUser(updated), ...tokens };
  }

  async resendOtp(
    email: string,
    purpose: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET',
  ) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user)
      return { message: 'If that email exists, a new code has been sent' };

    if (purpose === 'EMAIL_VERIFICATION' && user.isEmailVerified) {
      return { message: 'Email is already verified. Please log in.' };
    }

    const otp = await this.createOtp(user.id, purpose);
    const subject =
      purpose === 'EMAIL_VERIFICATION'
        ? 'Verify your email'
        : 'Reset your password';
    const html =
      purpose === 'EMAIL_VERIFICATION'
        ? emailVerificationOtpEmail(otp)
        : passwordResetOtpEmail(otp);
    await sendEmail(user.email, subject, html);

    await this.audit('OTP_RESENT', user.id, user.tenantId, { purpose });
    return { message: 'If that email exists, a new code has been sent' };
  }

  // ---------- Onboarding: create first location ----------

  // This is the step that completes onboarding. Instead of an admin
  // manually creating a location for a new organization, the user who just
  // verified their email creates their own first location right here.
  async createOnboardingLocation(
    userId: string,
    tenantId: string,
    dto: { name: string; address?: string },
  ) {
    const { location, user } = await this.prisma.$transaction(async (tx) => {
      const location = await tx.location.create({
        data: {
          tenantId,
          name: dto.name,
          address: dto.address,
        },
      });

      // Grant the creating user access to the location they just made
      await tx.userLocation.create({
        data: { userId, locationId: location.id },
      });

      const user = await tx.user.update({
        where: { id: userId },
        data: {
          activeLocationId: location.id,
          onboardingStatus: 'ONBOARDED',
        },
      });

      return { location, user };
    });

    await this.audit('ONBOARDING_LOCATION_CREATED', userId, tenantId, {
      locationId: location.id,
    });
    this.logger.info(
      { userId, tenantId, locationId: location.id },
      'Onboarding step: first location created, onboarding complete',
    );

    // Re-issue tokens with the new activeLocationId encoded
    const tokens = await this.issueTokens({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      activeLocationId: user.activeLocationId,
    });

    return {
      message: 'Location created. Onboarding complete.',
      location,
      ...tokens,
    };
  }

  // ---------- Login / session ----------

  // Design note: "email not verified" hard-blocks login — the recovery
  // path is verify-email or resend-otp, both of which work without being
  // logged in. "Onboarding not complete" does NOT hard-block — tokens are
  // still issued, just flagged with onboardingComplete: false — otherwise,
  // if a user's post-verification token expired before they finished
  // onboarding, they'd have no way to get a new token to complete it.
  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      await this.audit(
        'LOGIN_FAILED',
        user?.id ?? null,
        user?.tenantId ?? null,
        {
          email: dto.email,
          ipAddress,
        },
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      await this.audit('LOGIN_BLOCKED_INACTIVE', user.id, user.tenantId, {
        ipAddress,
      });
      throw new ForbiddenException('This account has been deactivated');
    }

    if (!user.isEmailVerified) {
      this.logger.info(
        { userId: user.id },
        'Login blocked — email not verified yet',
      );
      throw new ForbiddenException({
        message: 'Please verify your email before logging in',
        step: 'EMAIL_VERIFICATION',
      });
    }

    // MFA check — only enforced for roles in MFA_REQUIRED_ROLES that have
    // actually enabled it on their account (see setupMfa/confirmMfaSetup).
    if (MFA_REQUIRED_ROLES.includes(user.role) && user.mfaEnabled) {
      if (!dto.mfaCode) {
        throw new ForbiddenException({
          message: 'MFA code required',
          step: 'MFA_REQUIRED',
        });
      }
      const isValidMfa = speakeasy.totp.verify({
        secret: user.mfaSecret!,
        encoding: 'base32',
        token: dto.mfaCode,
        window: 1,
      });
      if (!isValidMfa) {
        await this.audit('LOGIN_MFA_FAILED', user.id, user.tenantId, {
          ipAddress,
        });
        throw new UnauthorizedException('Invalid MFA code');
      }
    }

    const tokens = await this.issueTokens({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      activeLocationId: user.activeLocationId,
    });

    await this.audit('LOGIN_SUCCESS', user.id, user.tenantId, { ipAddress });

    const onboardingComplete = user.onboardingStatus === 'ONBOARDED';

    return {
      user: this.publicUser(user),
      ...tokens,
      onboardingComplete,
      message: onboardingComplete
        ? undefined
        : 'Please complete onboarding by creating your first location',
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
    await this.audit('LOGOUT', userId, null);
    return { message: 'Logged out successfully' };
  }

  // ---------- MFA ----------

  // Step 1: generate a secret + QR code. mfaEnabled stays false until the
  // user proves they scanned it correctly via confirmMfaSetup below.
  async setupMfa(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const secretObj = speakeasy.generateSecret({
      name: `BackofficeAPI (${user.email})`,
    });
    const secret = secretObj.base32;

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const otpauth = secretObj.otpauth_url!;
    const qrCode = await qrcode.toDataURL(otpauth);

    await this.audit('MFA_SETUP_STARTED', userId, user.tenantId);

    return {
      message:
        'Scan this QR code in your authenticator app, then confirm with a code',
      qrCode,
    };
  }

  // Step 2: confirm the first code from the authenticator app to actually
  // turn MFA on. This proves the secret was scanned correctly.
  async confirmMfaSetup(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) {
      throw new BadRequestException('MFA setup was not started');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    if (!isValid) throw new BadRequestException('Invalid code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    await this.audit('MFA_ENABLED', userId, user.tenantId);
    return { message: 'MFA has been enabled on your account' };
  }

  // Lets a user turn MFA back off — requires a valid current code, not just
  // a click, so someone can't disable it just by having a stolen session.
  async disableMfa(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaEnabled || !user.mfaSecret) {
      throw new BadRequestException('MFA is not enabled on this account');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: code,
      window: 1,
    });
    if (!isValid) throw new BadRequestException('Invalid code');

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    await this.audit('MFA_DISABLED', userId, user.tenantId);
    return { message: 'MFA has been disabled on your account' };
  }

  // ---------- Password reset (OTP-based) ----------

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });

    if (!user)
      return { message: 'If that email exists, a reset code has been sent' };

    const otp = await this.createOtp(user.id, 'PASSWORD_RESET');
    await sendEmail(
      user.email,
      'Reset your password',
      passwordResetOtpEmail(otp),
    );

    await this.audit('PASSWORD_RESET_REQUESTED', user.id, user.tenantId);

    return { message: 'If that email exists, a reset code has been sent' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({ where: { email } });
    if (!user) throw new BadRequestException('Invalid code');

    await this.verifyOtp(user.id, otp, 'PASSWORD_RESET');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      // Force re-login everywhere after a password reset
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revoked: true },
      }),
    ]);

    await this.audit('PASSWORD_RESET_COMPLETED', user.id, user.tenantId);

    return { message: 'Password has been reset. Please log in again.' };
  }

  // ---------- Profile / location context ----------

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { locationAccess: { include: { location: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.publicUser(user);
  }

  async getMyLocations(userId: string) {
    const access = await this.prisma.userLocation.findMany({
      where: { userId },
      include: { location: true },
    });
    return access.map((a) => a.location);
  }

  // Switches which location the user is currently operating in — used
  // once a user has access to MORE THAN ONE location (e.g. after an admin
  // grants them access to a second store). For the very first location,
  // createOnboardingLocation() above handles it automatically.
  async setActiveLocation(userId: string, locationId: string) {
    const access = await this.prisma.userLocation.findUnique({
      where: { userId_locationId: { userId, locationId } },
    });
    if (!access) {
      throw new ForbiddenException('You do not have access to this location');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        activeLocationId: locationId,
        onboardingStatus: 'ONBOARDED',
      },
    });

    await this.audit('ACTIVE_LOCATION_CHANGED', userId, user.tenantId, {
      locationId,
    });
    this.logger.info(
      {
        userId,
        tenantId: user.tenantId,
        onboardingStatus: user.onboardingStatus,
      },
      'Active location changed',
    );

    const tokens = await this.issueTokens({
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      activeLocationId: user.activeLocationId,
    });

    return { message: 'Active location updated', ...tokens };
  }

  // ---------- Admin-only actions ----------

  async setUserActive(
    adminTenantId: string,
    targetUserId: string,
    isActive: boolean,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target || target.tenantId !== adminTenantId) {
      throw new NotFoundException('User not found in your organization');
    }

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
    });

    await this.audit(
      isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetUserId,
      adminTenantId,
    );
    return this.publicUser(user);
  }

  async assignRole(adminTenantId: string, targetUserId: string, role: string) {
    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!target || target.tenantId !== adminTenantId) {
      throw new NotFoundException('User not found in your organization');
    }

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: role as any },
    });

    await this.audit('ROLE_CHANGED', targetUserId, adminTenantId, {
      newRole: role,
    });
    return this.publicUser(user);
  }

  // ---------- Utilities ----------

  private publicUser(user: any) {
    // Never return passwordHash or mfaSecret to the client
    const { passwordHash, mfaSecret, ...safe } = user;
    return safe;
  }
}