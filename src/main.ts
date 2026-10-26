import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DomainError, ERROR_CODE } from './@common/errors/domain.error';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );

        return new DomainError(messages, ERROR_CODE.DADOS_INVALIDOS);
      },
    }),
  );

  app.enableCors();

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Isso coloca automaticamente o "/v1" no início de TODAS as rotas
  });

  // Precisa fazer validação da env
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch(console.error);
