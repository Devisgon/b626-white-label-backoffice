// import {
//   Controller,
//   Post,
//   Get,
//   Body,
//   Req,
//   UseGuards,
// } from '@nestjs/common';
// import { Throttle } from '@nestjs/throttler';
// import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
// import { Request } from 'express';
// import { AuthService } from './auth.service';
// import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';
// import { VerifyEmailDto } from './dto/verify-email.dto';
// import { ResendOtpDto } from './dto/resend-otp.dto';
// import { ForgotPasswordDto } from './dto/forgot-password.dto';
// import { ResetPasswordDto } from './dto/reset-password.dto';
// import { ActiveLocationDto } from './dto/active-location.dto';
// import { Public } from '../common/decorators/public.decorator';
// import { CurrentUser } from '../common/decorators/current-user.decorator';
// import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

// @ApiTags('Auth')
// @Controller('api/auth')
// @UseGuards(JwtAuthGuard)
// @ApiBearerAuth('accessToken')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   @Public()
//   @Post('register')
//   @ApiOperation({ summary: 'Register a new user under a tenant — sends an email verification OTP' })
//   register(@Body() dto: RegisterDto) {
//     return this.authService.register(dto);
//   }

//   @Public()
//   @Post('verify-email')
//   @ApiOperation({ summary: 'Verify email using the OTP sent at registration — completes onboarding step 1 and logs the user in' })
//   verifyEmail(@Body() dto: VerifyEmailDto) {
//     return this.authService.verifyEmail(dto.email, dto.otp);
//   }

//   @Public()
//   @Throttle({ default: { limit: 3, ttl: 60000 } })
//   @Post('resend-otp')
//   @ApiOperation({ summary: 'Resend a verification or password-reset OTP' })
//   resendOtp(@Body() dto: ResendOtpDto) {
//     return this.authService.resendOtp(dto.email, dto.purpose as any);
//   }

//   @Public()
//   @Throttle({ default: { limit: 5, ttl: 60000 } }) // login throttling
//   @Post('login')
//   @ApiOperation({ summary: 'Log in and receive access + refresh tokens' })
//   login(@Body() dto: LoginDto, @Req() req: Request) {
//     return this.authService.login(dto, req.ip);
//   }

//   @Post('logout')
//   @ApiOperation({ summary: 'Log out and revoke active sessions' })
//   logout(@CurrentUser('id') userId: string) {
//     return this.authService.logout(userId);
//   }

//   @Public()
//   @Post('forgot-password')
//   @ApiOperation({ summary: 'Request a password reset OTP by email' })
//   forgotPassword(@Body() dto: ForgotPasswordDto) {
//     return this.authService.forgotPassword(dto.email);
//   }

//   @Public()
//   @Post('reset-password')
//   @ApiOperation({ summary: 'Reset password using the emailed OTP' })
//   resetPassword(@Body() dto: ResetPasswordDto) {
//     return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
//   }

//   @Get('me')
//   @ApiOperation({ summary: 'Get the current authenticated user profile, including onboarding status' })
//   getMe(@CurrentUser('id') userId: string) {
//     return this.authService.getMe(userId);
//   }

//   @Get('locations')
//   @ApiOperation({ summary: 'Get the locations/stores the current user can access' })
//   getMyLocations(@CurrentUser('id') userId: string) {
//     return this.authService.getMyLocations(userId);
//   }

//   @Post('active-location')
//   @ApiOperation({ summary: 'Set which location the user is currently operating in — completes onboarding' })
//   setActiveLocation(@CurrentUser('id') userId: string, @Body() dto: ActiveLocationDto) {
//     return this.authService.setActiveLocation(userId, dto.locationId);
//   }
// }
import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ActiveLocationDto } from './dto/active-location.dto';
import { CreateOnboardingLocationDto } from './dto/create-onboarding-location.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('api/auth')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('accessToken')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary:
      'Register a new user — automatically creates a new organization (tenant), and this user becomes its Owner/Admin. Sends an email verification OTP.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({
    summary:
      'Verify email using the OTP sent at registration — logs the user in immediately',
  })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.otp);
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend a verification or password-reset OTP' })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email, dto.purpose);
  }

  @Post('onboarding/location')
  @ApiOperation({
    summary:
      'Create the first location during onboarding — requires the token issued right after email verification. Completes onboarding.',
  })
  createOnboardingLocation(
    @CurrentUser('id') userId: string,
    @CurrentUser('tenantId') tenantId: string,
    @Body() dto: CreateOnboardingLocationDto,
  ) {
    return this.authService.createOnboardingLocation(userId, tenantId, dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // login throttling
  @Post('login')
  @ApiOperation({ summary: 'Log in and receive access + refresh tokens' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and revoke active sessions' })
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset OTP by email' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using the emailed OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  @Get('me')
  @ApiOperation({
    summary:
      'Get the current authenticated user profile, including onboarding status',
  })
  getMe(@CurrentUser('id') userId: string) {
    return this.authService.getMe(userId);
  }

  @Get('locations')
  @ApiOperation({
    summary: 'Get the locations/stores the current user can access',
  })
  getMyLocations(@CurrentUser('id') userId: string) {
    return this.authService.getMyLocations(userId);
  }

  @Post('active-location')
  @ApiOperation({
    summary:
      'Switch active location among locations the user already has access to',
  })
  setActiveLocation(
    @CurrentUser('id') userId: string,
    @Body() dto: ActiveLocationDto,
  ) {
    return this.authService.setActiveLocation(userId, dto.locationId);
  }
}
