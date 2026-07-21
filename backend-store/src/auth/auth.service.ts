import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Roles } from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      });

      // Find or create customer role
      let role = await tx.role.findUnique({
        where: { name: Roles.CUSTOMER },
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            name: Roles.CUSTOMER,
            description: 'Standard Store Customer',
          },
        });
      }

      await tx.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: role.id,
        },
      });

      // Initialize wishlist for user
      await tx.wishlist.create({
        data: {
          userId: createdUser.id,
        },
      });

      // Initialize cart for user
      await tx.cart.create({
        data: {
          userId: createdUser.id,
        },
      });

      return createdUser;
    });

    return this.generateTokens(user.id, user.email, [Roles.CUSTOMER]);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!dto.password) {
      throw new BadRequestException('Password required for standard login');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roles = user.roles.map((r) => r.role.name);
    return this.generateTokens(user.id, user.email, roles);
  }

  // OTP Login step 1: Request OTP
  async requestOtp(email: string) {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store in Redis with 5-minute (300 seconds) expiry
    const redisKey = `otp:${email}`;
    await this.redisService.set(redisKey, otp, 300);

    // Mock send OTP (in production this would call SMS or Email dispatch)
    console.log(`[MOCK OTP DISPATCH] Sent OTP ${otp} to ${email}`);

    return { message: 'OTP sent successfully', email };
  }

  // OTP Login step 2: Verify OTP
  async verifyOtp(email: string, otp: string) {
    const redisKey = `otp:${email}`;
    const cachedOtp = await this.redisService.get(redisKey);

    if (!cachedOtp || cachedOtp !== otp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Delete OTP from Redis
    await this.redisService.del(redisKey);

    // Get or create user
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      // Auto-register customer if they don't exist
      const createdUser = await this.prisma.$transaction(async (tx) => {
        const createdUserInner = await tx.user.create({
          data: {
            email,
            isEmailVerified: true,
          },
        });

        let role = await tx.role.findUnique({
          where: { name: Roles.CUSTOMER },
        });

        if (!role) {
          role = await tx.role.create({
            data: {
              name: Roles.CUSTOMER,
              description: 'Standard Store Customer',
            },
          });
        }

        await tx.userRole.create({
          data: {
            userId: createdUserInner.id,
            roleId: role.id,
          },
        });

        await tx.wishlist.create({
          data: {
            userId: createdUserInner.id,
          },
        });

        await tx.cart.create({
          data: {
            userId: createdUserInner.id,
          },
        });

        return createdUserInner;
      });

      // Refetch with roles
      user = await this.prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }) as any;
    }

    const roles = user!.roles.map((r) => r.role.name);
    return this.generateTokens(user!.id, user!.email, roles);
  }

  // Google OAuth Login
  async googleLogin(googleId: string, email: string, firstName?: string, lastName?: string) {
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (user) {
      // If user exists but googleId is not linked, link it
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId },
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        });
      }
    } else {
      // Create user
      const createdUser = await this.prisma.$transaction(async (tx) => {
        const createdUserInner = await tx.user.create({
          data: {
            email,
            googleId,
            firstName,
            lastName,
            isEmailVerified: true,
          },
        });

        let role = await tx.role.findUnique({
          where: { name: Roles.CUSTOMER },
        });

        if (!role) {
          role = await tx.role.create({
            data: {
              name: Roles.CUSTOMER,
              description: 'Standard Store Customer',
            },
          });
        }

        await tx.userRole.create({
          data: {
            userId: createdUserInner.id,
            roleId: role.id,
          },
        });

        await tx.wishlist.create({
          data: {
            userId: createdUserInner.id,
          },
        });

        await tx.cart.create({
          data: {
            userId: createdUserInner.id,
          },
        });

        return createdUserInner;
      });

      // Refetch
      user = await this.prisma.user.findUnique({
        where: { id: createdUser.id },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      }) as any;
    }

    const roles = user!.roles.map((r) => r.role.name);
    return this.generateTokens(user!.id, user!.email, roles);
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'supersecretcustomerjwtrefreshsecret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const roles = user.roles.map((r) => r.role.name);
      return this.generateTokens(user.id, user.email, roles);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateTokens(userId: string, email: string, roles: string[]) {
    const payload = { sub: userId, email, roles };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET') || 'supersecretcustomerjwtsecret',
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'supersecretcustomerjwtrefreshsecret',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        roles,
      },
    };
  }
}
