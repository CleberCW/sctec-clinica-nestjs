import { Controller, Post, Body } from '@nestjs/common';
import { LoginDto } from 'src/auth/dtos/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  handleLogin(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
