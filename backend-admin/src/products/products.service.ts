import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateVariantDto, UpdateVariantDto } from './dto/variant.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // CATEGORIES
  // ==========================================

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Category slug already exists');
    }

    return this.prisma.category.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        iconUrl: dto.iconUrl,
        bannerUrl: dto.bannerUrl,
        parentId: dto.parentId,
      },
    });
  }

  async getCategories() {
    // Return hierarchical categories
    const categories = await this.prisma.category.findMany({
      include: { children: true },
    });
    // Filter root categories
    return categories.filter((cat) => !cat.parentId);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException('Category slug already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return this.prisma.category.delete({ where: { id } });
  }

  // ==========================================
  // BRANDS
  // ==========================================

  async createBrand(dto: CreateBrandDto) {
    const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Brand slug already exists');
    }
    return this.prisma.brand.create({ data: dto });
  }

  async getBrands() {
    return this.prisma.brand.findMany();
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    if (dto.slug && dto.slug !== brand.slug) {
      const existing = await this.prisma.brand.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException('Brand slug already exists');
      }
    }

    return this.prisma.brand.update({
      where: { id },
      data: dto,
    });
  }

  async deleteBrand(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return this.prisma.brand.delete({ where: { id } });
  }

  // ==========================================
  // PRODUCTS
  // ==========================================

  async createProduct(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Product slug already in use');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        summary: dto.summary,
        categoryId: dto.categoryId,
        brandId: dto.brandId,
        basePrice: dto.basePrice,
        status: dto.status,
        tags: dto.tags,
        metadata: dto.metadata || {},
      },
    });
  }

  async getProducts(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          brand: true,
          variants: {
            include: {
              images: true,
              inventory: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            images: true,
            inventory: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new ConflictException('Product slug already in use');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        metadata: dto.metadata !== undefined ? dto.metadata : undefined,
      },
    });
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return this.prisma.product.delete({ where: { id } });
  }

  // ==========================================
  // VARIANTS
  // ==========================================

  async createVariant(productId: string, dto: CreateVariantDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existingSku = await this.prisma.productVariant.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) {
      throw new ConflictException(`SKU ${dto.sku} already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          productId,
          sku: dto.sku,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice,
          costPrice: dto.costPrice,
          color: dto.color,
          size: dto.size,
          weight: dto.weight,
          dimensions: dto.dimensions,
        },
      });

      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((url, idx) => ({
            variantId: variant.id,
            url,
            sortOrder: idx,
          })),
        });
      }

      return tx.productVariant.findUnique({
        where: { id: variant.id },
        include: { images: true },
      });
    });
  }

  async updateVariant(id: string, dto: UpdateVariantDto) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    if (dto.sku && dto.sku !== variant.sku) {
      const existingSku = await this.prisma.productVariant.findUnique({ where: { sku: dto.sku } });
      if (existingSku) {
        throw new ConflictException(`SKU ${dto.sku} already exists`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedVariant = await tx.productVariant.update({
        where: { id },
        data: {
          sku: dto.sku,
          price: dto.price,
          compareAtPrice: dto.compareAtPrice,
          costPrice: dto.costPrice,
          color: dto.color,
          size: dto.size,
          weight: dto.weight,
          dimensions: dto.dimensions,
          isActive: dto.isActive,
        },
      });

      if (dto.images !== undefined) {
        // Delete old images and add new ones
        await tx.productImage.deleteMany({ where: { variantId: id } });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((url, idx) => ({
              variantId: id,
              url,
              sortOrder: idx,
            })),
          });
        }
      }

      return tx.productVariant.findUnique({
        where: { id },
        include: { images: true },
      });
    });
  }

  async deleteVariant(id: string) {
    const variant = await this.prisma.productVariant.findUnique({ where: { id } });
    if (!variant) {
      throw new NotFoundException('Variant not found');
    }
    return this.prisma.productVariant.delete({ where: { id } });
  }
}
