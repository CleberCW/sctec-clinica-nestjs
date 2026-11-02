import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from 'src/@common/guards/jwt.guard';
import { CurrentUser } from 'src/@common/decorators/current-user.decorator';
import type { AuthUserDto } from 'src/users/dto/auth-user.dto';
import { UserRegisterDto } from './dto/user-register.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from './dto/user-response-dto';
import { RequireRole } from 'src/@common/decorators/roles.decorator';
import { ROLES } from 'src/@common/entities/role.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(JwtGuard)
  @RequireRole([ROLES.ADMIN])
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
  async getInfo(@CurrentUser() user: AuthUserDto) {
    const userEntity = await this.userService.getUser(user.email as string);

    return plainToInstance(UserResponseDto, userEntity, {
      excludeExtraneousValues: true,
    });
  }
}
