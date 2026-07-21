import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ProductStatus } from '@catalog/shared/constants';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  // Get hierarchical category list (cached for high performance)
  async getCategories() {
    const cacheKey = 'store:categories:tree';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      include: { children: true },
    });

    const rootCategories = categories.filter((cat) => !cat.parentId);
    await this.redisService.set(cacheKey, JSON.stringify(rootCategories), 3600); // 1 hour cache
    return rootCategories;
  }

  // Get brands
  async getBrands() {
    const cacheKey = 'store:brands:all';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const brands = await this.prisma.brand.findMany({
      where: { isActive: true },
    });

    await this.redisService.set(cacheKey, JSON.stringify(brands), 3600);
    return brands;
  }

  // Paginated list with filtering and sorting
  async getProducts(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    brandId?: string;
    minPrice?: number;
    maxPrice?: number;
    color?: string;
    size?: string;
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  }) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 12);
    const skip = (page - 1) * limit;

    // Build Prisma query condition
    const where: any = {
      status: ProductStatus.PUBLISHED,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.brandId) {
      where.brandId = query.brandId;
    }

    // Filter by variant price range, color, size
    const variantWhere: any = { isActive: true };
    let hasVariantFilter = false;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      hasVariantFilter = true;
      variantWhere.price = {};
      if (query.minPrice !== undefined) variantWhere.price.gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) variantWhere.price.lte = Number(query.maxPrice);
    }

    if (query.color) {
      hasVariantFilter = true;
      variantWhere.color = { equals: query.color, mode: 'insensitive' };
    }

    if (query.size) {
      hasVariantFilter = true;
      variantWhere.size = { equals: query.size, mode: 'insensitive' };
    }

    if (hasVariantFilter) {
      where.variants = {
        some: variantWhere,
      };
    }

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' };
    if (query.sortBy === 'price_asc') {
      orderBy = { basePrice: 'asc' };
    } else if (query.sortBy === 'price_desc') {
      orderBy = { basePrice: 'desc' };
    } else if (query.sortBy === 'rating') {
      orderBy = { ratingAverage: 'desc' };
    }

    // Cache key for the list
    const cacheKey = `store:products:list:${JSON.stringify(query)}`;
    const cachedList = await this.redisService.get(cacheKey);
    if (cachedList) {
      return JSON.parse(cachedList);
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
            where: { isActive: true },
            include: {
              images: true,
              inventory: {
                include: {
                  warehouse: true,
                },
              },
            },
          },
        },
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const response = { items, total, page, limit };
    await this.redisService.set(cacheKey, JSON.stringify(response), 300); // 5 min cache
    return response;
  }

  // Get product by slug
  async getProductBySlug(slug: string) {
    const cacheKey = `store:product:slug:${slug}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        variants: {
          where: { isActive: true },
          include: {
            images: true,
            inventory: true,
          },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!product || product.status !== ProductStatus.PUBLISHED) {
      throw new NotFoundException('Product not found');
    }

    await this.redisService.set(cacheKey, JSON.stringify(product), 600); // 10 min cache
    return product;
  }

  // Autocomplete suggestions
  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.PUBLISHED,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      select: { name: true },
      take: 5,
    });

    return products.map((p) => p.name);
  }
}
