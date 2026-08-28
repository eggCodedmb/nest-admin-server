import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as express from 'express';
import * as path from 'path';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  // 信任反向代理（Nginx 等），使 req.ip 能正确读取 X-Forwarded-For / X-Real-IP
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  // 安全请求头配置 (放行 Knife4j & Swagger 资源)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // 静态资源访问 (文件上传目录)
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // 全局参数校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 初始化 Swagger / Knife4j 双 UI 文档
  setupSwagger(app);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);

  logger.log(`======================================================`);
  logger.log(`🚀 应用启动成功: http://localhost:${port}`);
  logger.log(`📑 Swagger 原生文档: http://localhost:${port}/api-docs`);
  logger.log(`📖 Knife4j 增强文档: http://localhost:${port}/doc.html`);
  logger.log(`======================================================`);
}

bootstrap();
