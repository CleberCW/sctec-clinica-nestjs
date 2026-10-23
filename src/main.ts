import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
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
