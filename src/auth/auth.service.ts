import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from 'src/users/services/users/users.service';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from 'src/users/dto/users.dtos';
import { User } from 'src/typeorm/user/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async userSignUp(authDto: AuthDto) {
    const users = await this.usersService.findUsers(authDto.email);
    if (users.length) {
      throw new BadRequestException('User email already exists!');
    }

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(authDto.password, salt);

    const object: CreateUserDto = {
      email: authDto.email,
      username: authDto.username,
      password: hash,
      refreshToken: '',
    };

    const newUser: User = await this.usersService.createUser(object);

    const tokens = await this.getTokens(newUser.id, newUser.username);

    await this.updateRefreshToken(newUser.id, tokens.refreshToken);

    return tokens;
  }

  async userSignIn(authDto: Partial<AuthDto>) {
    const [users]: User[] = await this.usersService.findUsers(authDto.email);

    if (!users) {
      throw new BadRequestException('User email not found!');
    }

    const compare = await bcrypt.compare(authDto.password, users.password);

    if (!compare) {
      throw new BadRequestException('Password is incorrect!');
    }

    const tokens = await this.getTokens(users.id, users.username);

    await this.updateRefreshToken(users.id, tokens.refreshToken);

    return tokens;
  }

  async hashData(data: string) {
    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(data, salt);
    return hash;
  }

  async updateRefreshToken(id: number, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersService.update(id, {
      refreshToken: hashedRefreshToken,
    });
  }

  async logout(id: number) {
    return this.usersService.update(id, { refreshToken: null });
  }

  async getTokens(id: number, username: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: id,
          username,
        },
        {
          secret: 'topSecret51',
          expiresIn: '15m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: id,
          username,
        },
        {
          secret: 'topSecret51',
          expiresIn: '7d',
        },
      ),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: number, refreshToken: string) {
    console.log(userId);
    console.log(refreshToken);
    const user = await this.usersService.findUsersById(userId);
    if (!user || !user.refreshToken) {
      throw new ForbiddenException('Access Denied1');
    }

    console.log(user);

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    console.log(refreshTokenMatches);
    if (!refreshTokenMatches) {
      throw new ForbiddenException('Access Denied2');
    }

    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
}
