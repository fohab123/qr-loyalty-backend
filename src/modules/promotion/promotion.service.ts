import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Promotion, PromotionStatus } from './promotion.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { StoreService } from '../store/store.service';
import { UserService } from '../user/user.service';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
    private readonly storeService: StoreService,
    private readonly userService: UserService,
  ) {}

  async create(dto: CreatePromotionDto): Promise<Promotion> {
    // Verify store exists
    await this.storeService.findOne(dto.storeId);

    const promotion = this.promotionRepository.create({
      title: dto.title,
      description: dto.description,
      discountPercentage: dto.discountPercentage,
      storeId: dto.storeId,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: dto.status,
      minPointsRequired: dto.minPointsRequired,
    });
    return this.promotionRepository.save(promotion);
  }

  async findAll(): Promise<Promotion[]> {
    return this.promotionRepository.find({ relations: ['store'] });
  }

  async findActive(): Promise<Promotion[]> {
    const now = new Date();
    return this.promotionRepository.find({
      where: {
        status: PromotionStatus.ACTIVE,
        startDate: LessThanOrEqual(now),
        endDate: MoreThanOrEqual(now),
      },
      relations: ['store'],
    });
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepository.findOne({
      where: { id },
      relations: ['store'],
    });
    if (!promotion) throw new NotFoundException('Promotion not found');
    return promotion;
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<Promotion> {
    const promotion = await this.findOne(id);
    const { startDate, endDate, ...rest } = dto;
    // Only assign defined fields to avoid overwriting with undefined
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        (promotion as any)[key] = value;
      }
    }
    if (startDate) promotion.startDate = new Date(startDate);
    if (endDate) promotion.endDate = new Date(endDate);
    return this.promotionRepository.save(promotion);
  }

  async remove(id: string): Promise<void> {
    const promotion = await this.findOne(id);
    await this.promotionRepository.remove(promotion);
  }

  async findForUser(
    userId: string,
  ): Promise<{ favoriteStorePromotions: Promotion[]; otherPromotions: Promotion[] }> {
    const favoriteStores = await this.userService.getFavoriteStores(userId);
    const favoriteStoreIds = new Set(favoriteStores.map((s) => s.id));

    const activePromotions = await this.findActive();

    const favoriteStorePromotions: Promotion[] = [];
    const otherPromotions: Promotion[] = [];

    for (const promo of activePromotions) {
      if (favoriteStoreIds.has(promo.storeId)) {
        favoriteStorePromotions.push(promo);
      } else {
        otherPromotions.push(promo);
      }
    }

    return { favoriteStorePromotions, otherPromotions };
  }
}
