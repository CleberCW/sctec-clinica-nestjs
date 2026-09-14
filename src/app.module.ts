import { Module } from '@nestjs/common';

import { APP_FILTER } from '@nestjs/core';
import { BadRequestExceptionFilter } from './@common/filters/bad-request-exception.filter';
import { HttpExceptionFilter } from './@common/filters/http-exception.filter';
import { DatabaseModule } from './@common/database/database.modules';
import { UserModule } from './users/user.module';

@Module({
  imports: [DatabaseModule, UserModule],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: BadRequestExceptionFilter,
    },
  ],
})
export class AppModule {}
