import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BulkService } from './bulk.service';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Roles as RoleEnum } from '@catalog/shared/constants';
import type { Response } from 'express';

@ApiTags('Bulk Actions CMS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.SUPER_ADMIN, RoleEnum.PRODUCT_MANAGER)
@Controller('products/bulk')
export class BulkController {
  constructor(private readonly bulkService: BulkService) {}

  @Post('import')
  @ApiOperation({ summary: 'Import products via CSV upload' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    return this.bulkService.importProductsFromCsv(file.buffer);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export catalog to CSV file' })
  async exportCsv(@Res() res: Response) {
    const csvContent = await this.bulkService.exportProductsToCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=catalog_export.csv');
    res.status(200).send(csvContent);
  }
}
