import { Module } from '@nestjs/common';
import { AdminSeedService } from './admin-seed.service';
import { UserModule } from 'src/users/user.module';

@Module({
  imports: [UserModule],
  providers: [AdminSeedService],
})
export class AdminSeedModule {}
