import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/users/user.module';
import { AuthService } from './auth.service';
import { JwtService } from './jwt.service';

@Module({
  imports: [UserModule],

  controllers: [AuthController],

  providers: [AuthService, JwtService],
})
export class AuthModule {}
