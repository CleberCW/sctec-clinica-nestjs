import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/@common/guards/jwt.guard';
import { RegisterUserDto } from './dto/register-user-controller.dto';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from 'src/@common/decorators/current-user.decorator';
import type { AuthUserDto } from 'src/@common/dtos/auth-user.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  @UseGuards(JwtGuard)
  handleRegister(@Body() dto: RegisterUserDto) {
    return this.userService.registerUser(dto);
  }

  @Post('/login')
  handleLogin(@Body() dto: LoginDto) {
    return this.userService.loginUser(dto);
  }

  @Get('/me')
  @UseGuards(JwtGuard)
  getInfo(@CurrentUser() user: AuthUserDto) {
    console.log('ENTROU');
    console.log(user);
    return this.userService.getUser(user.email as string);
  }
}
