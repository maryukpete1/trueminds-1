import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly logger = new Logger(FacebookStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL:
        configService.get<string>('FACEBOOK_CALLBACK_URL') ||
        'http://localhost:3000/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['id', 'emails', 'name', 'photos'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ): Promise<void> {
    try {
      const { id, name, emails, photos } = profile;
      const email = emails?.[0]?.value;
      const firstName = name?.givenName || '';
      const lastName = name?.familyName || '';
      const profileImage = photos?.[0]?.value || '';

      const result = await this.authService.validateFacebookUser({
        facebookId: id,
        email,
        firstName,
        lastName,
        profileImage,
      });

      done(null, result);
    } catch (error) {
      this.logger.error('Facebook authentication error', error);
      done(error as Error);
    }
  }
}
