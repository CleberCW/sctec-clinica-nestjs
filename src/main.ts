import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DomainError, ERROR_CODE } from './@common/errors/domain.error';
import { extractValidationMessages } from './@common/tools/extract-validation-messages';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = extractValidationMessages(errors);

        return new DomainError(messages, ERROR_CODE.DADOS_INVALIDOS);
      },
    }),
  );

  app.enableCors();

  await app.listen(configService.get<number>('PORT', 3000));
}

bootstrap().catch(console.error);
