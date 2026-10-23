import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/@common/guards/jwt.guard';
import { CurrentUser } from 'src/@common/decorators/current-user.decorator';
import type { AuthUserDto } from 'src/@common/dtos/auth-user.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response-dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('/register')
  @UseGuards(JwtGuard)
  // Precisa colcoar para checar role também - Decorators
  @UseInterceptors(ClassSerializerInterceptor)
  // Funciona com o class-transformer, define o dto de saída através de decorators
  async register(
    @Body() createUserDto: UserRegisterDto,
  ): Promise<UserResponseDto> {
    const userEntity = await this.userService.registerUser(createUserDto);

    return plainToInstance(UserResponseDto, userEntity, {
      excludeExtraneousValues: true,
    });
  }

  @Get('/me')
  @UseGuards(JwtGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async getInfo(@CurrentUser() user: AuthUserDto) {
    const userEntity = await this.userService.getUser(user.email as string);

    return plainToInstance(UserResponseDto, userEntity, {
      excludeExtraneousValues: true,
    });
  }
}
