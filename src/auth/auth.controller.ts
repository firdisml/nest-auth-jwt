import { Controller, Post, Get, Req, Body, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from 'src/guard/accessToken.guard';
import { RefreshTokenGuard } from 'src/guard/refreshToken';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/signup')
  userSignup(@Body() body: AuthDto) {
    return this.authService.userSignUp(body);
  }

  @Post('/signin')
  userSignin(@Body() body: AuthDto) {
    return this.authService.userSignIn(body);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/logout')
  logout(@Req() req: Request) {
    console.log(req.user['sub']);
    this.authService.logout(req.user['sub']);
  }

  @UseGuards(RefreshTokenGuard)
  @Get('/refresh')
  refreshTokens(@Req() req: Request) {
    const userId = req.user['sub'];
    const refreshToken = req.user['refreshToken'];
    console.log(userId);
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
