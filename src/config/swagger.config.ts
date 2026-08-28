import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { knife4jSetup } from 'nestjs-knife4j';
import basicAuth from 'express-basic-auth';

export function setupSwagger(app: INestApplication) {
  const config = app.get(ConfigService);
  if (!config.get<boolean>('SWAGGER_ENABLE', true)) return;

  const path = config.get<string>('SWAGGER_PATH', 'api-docs');
  const user = config.get<string>('SWAGGER_AUTH_USER');
  const pass = config.get<string>('SWAGGER_AUTH_PASS');

  if (user && pass) {
    app.use([`/${path}`, `/${path}-json`, '/doc.html'], basicAuth({
      challenge: true,
      users: { [user]: pass },
    }));
  }

  const options = new DocumentBuilder()
    .setTitle('NestJS 管理系统 API 接口规范')
    .setDescription('基于 NestJS + TypeORM + MySQL 的企业级后台接口体系')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer-token')
    .build();

  const document = SwaggerModule.createDocument(app, options);

  // 原生 Swagger
  SwaggerModule.setup(path, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // Knife4j UI (访问地址: /doc.html)
  knife4jSetup(app, {
    urls: [
      {
        name: '1.0版本',
        url: `/${path}-json`,
        swaggerVersion: '3.0',
        location: `/${path}-json`,
      },
    ],
  });
}
