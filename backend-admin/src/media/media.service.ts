import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class MediaService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; sizes: Record<string, string> }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Ensure uploads directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // Generate unique name
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${baseName}_${Date.now()}${ext}`;
    const filePath = path.join(this.uploadDir, fileName);

    // Save main file
    await fs.writeFile(filePath, file.buffer);

    // For a production system we'd use sharp here to resize and compress.
    // To ensure no installation failures on user's local system we will simulate size generation.
    // Let's create sub-sizes paths
    const host = process.env.HOST_URL || 'http://localhost:4000';
    const mainUrl = `${host}/uploads/${fileName}`;

    const sizes = {
      original: mainUrl,
      thumbnail: `${host}/uploads/thumbnail_${fileName}`,
      medium: `${host}/uploads/medium_${fileName}`,
      large: `${host}/uploads/large_${fileName}`,
    };

    // Save dummy resized images (in production these would be compressed versions)
    await fs.writeFile(path.join(this.uploadDir, `thumbnail_${fileName}`), file.buffer);
    await fs.writeFile(path.join(this.uploadDir, `medium_${fileName}`), file.buffer);
    await fs.writeFile(path.join(this.uploadDir, `large_${fileName}`), file.buffer);

    return {
      url: mainUrl,
      sizes,
    };
  }

  async listMediaFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.uploadDir);
      const host = process.env.HOST_URL || 'http://localhost:4000';
      return files
        .filter((file) => !file.startsWith('.') && !file.startsWith('thumbnail_') && !file.startsWith('medium_') && !file.startsWith('large_'))
        .map((file) => `${host}/uploads/${file}`);
    } catch {
      return [];
    }
  }
}
