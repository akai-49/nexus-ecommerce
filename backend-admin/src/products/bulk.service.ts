import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Readable } from 'stream';
import csv from 'csv-parser';

interface CsvRow {
  productName: string;
  productSlug: string;
  productDescription: string;
  categoryName: string;
  brandName: string;
  basePrice: string;
  variantSku: string;
  variantPrice?: string;
  variantColor?: string;
  variantSize?: string;
  stockQuantity?: string;
  warehouseCode?: string;
}

@Injectable()
export class BulkService {
  constructor(private readonly prisma: PrismaService) {}

  async importProductsFromCsv(buffer: Buffer): Promise<{ importedCount: number; errors: string[] }> {
    const rows: CsvRow[] = [];
    const errors: string[] = [];

    // Parse CSV from buffer stream
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(buffer);
      stream
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    if (rows.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    let importedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const lineNum = i + 2; // header is line 1

      // Basic validations
      if (!row.productName || !row.productSlug || !row.categoryName || !row.brandName || !row.basePrice || !row.variantSku) {
        errors.push(`Row ${lineNum}: Missing required fields.`);
        continue;
      }

      const basePriceNum = parseFloat(row.basePrice);
      if (isNaN(basePriceNum)) {
        errors.push(`Row ${lineNum}: Invalid basePrice.`);
        continue;
      }

      try {
        await this.prisma.$transaction(async (tx) => {
          // 1. Resolve or create category
          let category = await tx.category.findUnique({
            where: { name: row.categoryName },
          });
          if (!category) {
            const catSlug = row.categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            category = await tx.category.create({
              data: { name: row.categoryName, slug: catSlug },
            });
          }

          // 2. Resolve or create brand
          let brand = await tx.brand.findUnique({
            where: { name: row.brandName },
          });
          if (!brand) {
            const brandSlug = row.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            brand = await tx.brand.create({
              data: { name: row.brandName, slug: brandSlug },
            });
          }

          // 3. Create or resolve base product
          let product = await tx.product.findUnique({
            where: { slug: row.productSlug },
          });
          if (!product) {
            product = await tx.product.create({
              data: {
                name: row.productName,
                slug: row.productSlug,
                description: row.productDescription || row.productName,
                categoryId: category.id,
                brandId: brand.id,
                basePrice: basePriceNum,
                status: 'PUBLISHED',
              },
            });
          }

          // 4. Create or update variant
          const varPrice = row.variantPrice ? parseFloat(row.variantPrice) : null;
          let variant = await tx.productVariant.findUnique({
            where: { sku: row.variantSku },
          });

          if (!variant) {
            variant = await tx.productVariant.create({
              data: {
                productId: product.id,
                sku: row.variantSku,
                price: varPrice,
                color: row.variantColor || null,
                size: row.variantSize || null,
              },
            });
          } else {
            variant = await tx.productVariant.update({
              where: { sku: row.variantSku },
              data: {
                price: varPrice,
                color: row.variantColor || variant.color,
                size: row.variantSize || variant.size,
              },
            });
          }

          // 5. Update stock levels if warehouse is specified
          if (row.warehouseCode && row.stockQuantity) {
            const qty = parseInt(row.stockQuantity);
            if (!isNaN(qty)) {
              let warehouse = await tx.warehouse.findUnique({
                where: { code: row.warehouseCode },
              });
              if (!warehouse) {
                warehouse = await tx.warehouse.create({
                  data: {
                    code: row.warehouseCode,
                    name: `Warehouse ${row.warehouseCode}`,
                  },
                });
              }

              await tx.inventory.upsert({
                where: {
                  variantId_warehouseId: {
                    variantId: variant.id,
                    warehouseId: warehouse.id,
                  },
                },
                update: {
                  quantity: qty,
                },
                create: {
                  variantId: variant.id,
                  warehouseId: warehouse.id,
                  quantity: qty,
                },
              });
            }
          }
        });

        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${lineNum}: ${err.message || 'Transaction failed.'}`);
      }
    }

    return { importedCount, errors };
  }

  // Export current catalog to CSV string
  async exportProductsToCsv(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            inventory: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    const headers = [
      'productName',
      'productSlug',
      'productDescription',
      'categoryName',
      'brandName',
      'basePrice',
      'variantSku',
      'variantPrice',
      'variantColor',
      'variantSize',
      'stockQuantity',
      'warehouseCode',
    ];

    let csvContent = headers.join(',') + '\n';

    for (const prod of products) {
      for (const variant of prod.variants) {
        const inv = variant.inventory[0];
        const stockQty = inv ? inv.quantity.toString() : '0';
        const whCode = inv ? inv.warehouse.code : '';

        const row = [
          `"${prod.name.replace(/"/g, '""')}"`,
          prod.slug,
          `"${(prod.description || '').replace(/"/g, '""')}"`,
          prod.category.name,
          prod.brand.name,
          prod.basePrice.toString(),
          variant.sku,
          variant.price ? variant.price.toString() : '',
          variant.color || '',
          variant.size || '',
          stockQty,
          whCode,
        ];

        csvContent += row.join(',') + '\n';
      }
    }

    return csvContent;
  }
}
