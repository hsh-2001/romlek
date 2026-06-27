import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  SwaggerModule,
  DocumentBuilder,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Range',
    exposedHeaders: 'Content-Length, Content-Range, Accept-Ranges',
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  const config = new DocumentBuilder()
    .setTitle('Romlek API')
    .setDescription('The Romlek API description')
    .setVersion('1.0')
    .addTag('Romlek')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  const options: SwaggerCustomOptions = {
    ui: true, // Swagger UI is enabled
    raw: ['json'], // JSON API definition is still accessible (YAML is disabled)
  };
  SwaggerModule.setup('api', app, documentFactory, options);
  await app.listen(process.env.PORT ?? 4000);
}
void bootstrap();
