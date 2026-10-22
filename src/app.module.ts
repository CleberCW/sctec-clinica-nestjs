import { Module } from '@nestjs/common';

import { APP_FILTER } from '@nestjs/core';
import { BadRequestExceptionFilter } from './@common/filters/bad-request-exception.filter';
import { HttpExceptionFilter } from './@common/filters/http-exception.filter';
import { DatabaseModule } from './@common/database/database.modules';
import { UserModule } from './users/user.module';
import { AppController } from './app.controller';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [AppController],
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
