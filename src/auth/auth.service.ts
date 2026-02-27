import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { UserDocument, UserRole } from '../users/schemas/user.schema';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  // ───────── SIGNUP ─────────
  async signup(signupDto: SignupDto) {
    const { email, phoneNumber, password, firstName, lastName, referralCode } =
      signupDto;

    // Must provide at least email or phone
    if (!email && !phoneNumber) {
      throw new BadRequestException(
        'Either email or phone number is required',
      );
    }

    // Check for duplicate
    const existingUser = await this.usersService.findByEmailOrPhone(
      email,
      phoneNumber,
    );
    if (existingUser) {
      throw new ConflictException(
        'A user with this email or phone number already exists',
      );
    }

    // Validate referral code (simple simulation)
    if (referralCode) {
      this.logger.log(`Referral code provided: ${referralCode}`);
      // In production, validate against a referral codes collection
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP (6-digit)
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Create user
    const user = await this.usersService.create({
      firstName,
      lastName,
      email: email?.toLowerCase(),
      phoneNumber,
      password: hashedPassword,
      role: UserRole.CUSTOMER,
      isVerified: false,
      referralCode: this.generateReferralCode(),
      referredBy: referralCode || undefined,
      otp,
      otpExpiresAt,
    });

    // In production, send OTP via email/SMS
    this.logger.log(`[SIMULATED] OTP for ${email || phoneNumber}: ${otp}`);

    return {
      message: 'Registration successful. Please verify your account with the OTP sent.',
      data: {
        userId: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        otp, // Returned for simulation/testing only
      },
    };
  }

  // ───────── VERIFY OTP ─────────
  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, phoneNumber, otp } = verifyOtpDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException(
        'Either email or phone number is required',
      );
    }

    const user = await this.usersService.findByEmailOrPhone(
      email,
      phoneNumber,
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    if (!user.otp || user.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new BadRequestException(
        'OTP has expired. Please request a new one.',
      );
    }

    await this.usersService.updateById(String(user._id), {
      isVerified: true,
      otp: undefined,
      otpExpiresAt: undefined,
    });

    const token = this.generateToken(user);

    return {
      message: 'Account verified successfully',
      data: {
        accessToken: token,
        user: this.sanitizeUser(user),
      },
    };
  }

  // ───────── RESEND OTP ─────────
  async resendOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account is already verified');
    }

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.updateById(String(user._id), {
      otp,
      otpExpiresAt,
    });

    this.logger.log(`[SIMULATED] Resent OTP for ${email}: ${otp}`);

    return {
      message: 'OTP resent successfully',
      data: { otp }, // For simulation only
    };
  }

  // ───────── LOGIN ─────────
  async login(loginDto: LoginDto) {
    const { email, phoneNumber, password } = loginDto;

    if (!email && !phoneNumber) {
      throw new BadRequestException(
        'Either email or phone number is required',
      );
    }

    const user = await this.usersService.findByEmailOrPhone(
      email,
      phoneNumber,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new ForbiddenException(
        'Account not verified. Please verify your OTP first.',
      );
    }

    if (!user.password) {
      throw new UnauthorizedException(
        'This account uses social login. Please sign in with Google or Facebook.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user);

    return {
      message: 'Login successful',
      data: {
        accessToken: token,
        user: this.sanitizeUser(user),
      },
    };
  }

  // ───────── GOOGLE AUTH (Direct Integration) ─────────
  async googleAuth(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { sub: googleId, email, given_name, family_name, picture } = payload;

      // Check if user exists by Google ID
      let user = await this.usersService.findByGoogleId(googleId as string);

      if (!user && email) {
        // Check if user exists by email
        user = await this.usersService.findByEmail(email);
        if (user) {
          // Link Google account to existing user
          await this.usersService.updateById(String(user._id), {
            googleId: googleId as string,
            isVerified: true,
            profileImage: picture || user.profileImage,
          });
        }
      }

      if (!user) {
        // Create new user
        user = await this.usersService.create({
          googleId: googleId as string,
          email: email?.toLowerCase(),
          firstName: given_name || '',
          lastName: family_name || '',
          profileImage: picture,
          isVerified: true,
          role: UserRole.CUSTOMER,
          referralCode: this.generateReferralCode(),
        });
      }

      const token = this.generateToken(user);

      return {
        message: 'Google authentication successful',
        data: {
          accessToken: token,
          user: this.sanitizeUser(user),
        },
      };
    } catch (error) {
      this.logger.error('Google authentication error', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  // ───────── FACEBOOK AUTH (via Passport) ─────────
  async validateFacebookUser(profile: {
    facebookId: string;
    email?: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  }) {
    const { facebookId, email, firstName, lastName, profileImage } = profile;

    // Check if user exists by Facebook ID
    let user = await this.usersService.findByFacebookId(facebookId);

    if (!user && email) {
      user = await this.usersService.findByEmail(email);
      if (user) {
        await this.usersService.updateById(String(user._id), {
          facebookId,
          isVerified: true,
          profileImage: profileImage || user.profileImage,
        });
      }
    }

    if (!user) {
      user = await this.usersService.create({
        facebookId,
        email: email?.toLowerCase(),
        firstName,
        lastName,
        profileImage,
        isVerified: true,
        role: UserRole.CUSTOMER,
        referralCode: this.generateReferralCode(),
      });
    }

    const token = this.generateToken(user);
    return {
      accessToken: token,
      user: this.sanitizeUser(user),
    };
  }

  // ───────── HELPERS ─────────
  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateReferralCode(): string {
    return 'CK-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private sanitizeUser(user: UserDocument) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      profileImage: user.profileImage,
      referralCode: user.referralCode,
    };
  }
}
