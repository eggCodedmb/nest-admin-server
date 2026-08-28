import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('上传文件不能为空');
    }

    const ext = path.extname(file.originalname);
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    return {
      fileName: file.originalname,
      newFileName: fileName,
      url: `/uploads/${fileName}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
