import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BunnerAdapter } from '../../src/adapter';
import { NestBunnerApplication } from '../../src/interfaces';
import { AppModule } from "./app.module";

async function bootstrap() {
  let port = 3030;
  const app = await NestFactory.create(AppModule);
  const app1 = await NestFactory.create<NestBunnerApplication>(AppModule, new BunnerAdapter());
  const apps = [app, app1];

  app1.test();

  for (const a of apps) {
    a.enableCors({
      origin: `http://localhost:${port}`,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
    a.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }));

    const config = new DocumentBuilder()
      .setTitle('Bunner Adapter Test API')
      .setDescription('Bunner Adapter Test API description')
      .setVersion('1.0')
      .build();

    console.log(config);

    const document = SwaggerModule.createDocument(a, config);

    console.log(document);

    SwaggerModule.setup('/docs', a, document);

    await a.listen(port, '0.0.0.0');

    console.log('Server is running on port', port);

    port++;
  }
}

bootstrap();