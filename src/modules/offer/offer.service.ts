import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { Offer, OfferStatus } from './offer.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { PromotionService } from '../promotion/promotion.service';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.entity';

@Injectable()
export class OfferService {
  private readonly logger = new Logger(OfferService.name);

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly promotionService: PromotionService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateOfferDto): Promise<Offer> {
    // Verify user and store exist
    await this.userService.findOne(dto.userId);

    const offer = this.offerRepository.create({
      title: dto.title,
      description: dto.description,
      discountPercentage: dto.discountPercentage,
      userId: dto.userId,
      storeId: dto.storeId,
      promotionId: dto.promotionId,
      expiresAt: new Date(dto.expiresAt),
      status: dto.status,
    });
    return this.offerRepository.save(offer);
  }

  async findAll(status?: OfferStatus): Promise<Offer[]> {
    const where = status ? { status } : {};
    return this.offerRepository.find({
      where,
      relations: ['user', 'store', 'promotion'],
    });
  }

  async findOne(id: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['user', 'store', 'promotion'],
    });
    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async update(id: string, dto: UpdateOfferDto): Promise<Offer> {
    const offer = await this.findOne(id);
    const { expiresAt, ...rest } = dto;
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) {
        (offer as any)[key] = value;
      }
    }
    if (expiresAt) offer.expiresAt = new Date(expiresAt);
    return this.offerRepository.save(offer);
  }

  async remove(id: string): Promise<void> {
    const offer = await this.findOne(id);
    await this.offerRepository.remove(offer);
  }

  async findOffersForUser(userId: string): Promise<Offer[]> {
    const favoriteStores = await this.userService.getFavoriteStores(userId);
    const favoriteStoreIds = new Set(favoriteStores.map((s) => s.id));

    const offers = await this.offerRepository.find({
      where: [
        {
          userId,
          status: OfferStatus.ACTIVE,
          expiresAt: MoreThanOrEqual(new Date()),
        },
        {
          userId,
          status: OfferStatus.CLAIMED,
        },
      ],
      relations: ['store', 'promotion'],
      order: { expiresAt: 'ASC' },
    });

    // Only show offers from favorite stores
    if (favoriteStoreIds.size === 0) return [];
    return offers.filter((o) => favoriteStoreIds.has(o.storeId));
  }

  async claimOffer(userId: string, offerId: string): Promise<Offer> {
    const offer = await this.offerRepository.findOne({
      where: { id: offerId },
      relations: ['store', 'promotion'],
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (offer.userId !== userId) {
      throw new BadRequestException('This offer does not belong to you');
    }

    if (offer.status !== OfferStatus.ACTIVE) {
      throw new BadRequestException(`Offer is already ${offer.status}`);
    }

    if (offer.expiresAt < new Date()) {
      throw new BadRequestException('Offer has expired');
    }

    // Deduct points if the promotion has a cost
    const pointsCost = offer.promotion?.minPointsRequired ?? 0;
    if (pointsCost > 0) {
      const user = await this.userService.findOne(userId);
      if (user.pointsBalance < pointsCost) {
        throw new BadRequestException(
          `Insufficient points. You need ${pointsCost} points but have ${user.pointsBalance}.`,
        );
      }
      user.pointsBalance -= pointsCost;
      await this.offerRepository.manager.save(user);

      if (user.pushToken) {
        this.notificationService.sendPushNotification(
          user.pushToken,
          'Offer Claimed',
          `${pointsCost} points deducted for offer: ${offer.title}`,
        );
      }
    }

    offer.status = OfferStatus.CLAIMED;
    offer.claimedAt = new Date();
    return this.offerRepository.save(offer);
  }

  async autoGenerateForUser(userId: string): Promise<{ generated: number }> {
    const favoriteStores = await this.userService.getFavoriteStores(userId);

    if (favoriteStores.length === 0) {
      return { generated: 0 };
    }

    const favoriteStoreIds = new Set(favoriteStores.map((s) => s.id));

    const user = await this.userService.findOne(userId);
    const activePromotions = await this.promotionService.findActive();

    // Skip promotions where user already has an active or claimed offer
    const existingOfferRows: { promotion_id: string }[] = await this.offerRepository.manager
      .createQueryBuilder()
      .select('o.promotion_id', 'promotion_id')
      .from('offers', 'o')
      .where('o.user_id = :userId', { userId })
      .andWhere('o.status IN (:...statuses)', { statuses: [OfferStatus.ACTIVE, OfferStatus.CLAIMED] })
      .andWhere('o.promotion_id IS NOT NULL')
      .getRawMany();
    const activePromotionIds = new Set(existingOfferRows.map((r) => r.promotion_id));

    let generated = 0;
    for (const promotion of activePromotions) {
      if (activePromotionIds.has(promotion.id)) continue;
      if (!favoriteStoreIds.has(promotion.storeId)) continue;
      if (
        promotion.minPointsRequired != null &&
        promotion.minPointsRequired > user.pointsBalance
      )
        continue;

      const offer = this.offerRepository.create({
        title: promotion.title,
        description: promotion.description,
        discountPercentage: promotion.discountPercentage,
        userId,
        storeId: promotion.storeId,
        promotionId: promotion.id,
        expiresAt: promotion.endDate,
      });

      try {
        await this.offerRepository.save(offer);
        generated++;
      } catch (err: any) {
        // PostgreSQL unique_violation = 23505
        if (err?.code === '23505') {
          this.logger.warn(
            `Duplicate offer skipped: user=${userId} promotion=${promotion.id}`,
          );
          continue;
        }
        throw err;
      }
    }

    return { generated };
  }

  async createBulkForFavoriteStoreUsers(promotionId: string): Promise<{ generated: number }> {
    const promotion = await this.promotionService.findOne(promotionId);

    // Find all users who favorited the promotion's store
    const users = await this.offerRepository.manager
      .createQueryBuilder()
      .select('ufs."usersId"', 'userId')
      .from('user_favorite_stores', 'ufs')
      .where('ufs."storesId" = :storeId', { storeId: promotion.storeId })
      .getRawMany();

    // Find users who already have an active or claimed offer for this promotion
    const existingOfferRows: { user_id: string }[] = await this.offerRepository.manager
      .createQueryBuilder()
      .select('o.user_id', 'user_id')
      .from('offers', 'o')
      .where('o.promotion_id = :promotionId', { promotionId })
      .andWhere('o.status IN (:...statuses)', { statuses: [OfferStatus.ACTIVE, OfferStatus.CLAIMED] })
      .getRawMany();
    const usersWithOffer = new Set(existingOfferRows.map((r) => r.user_id));

    const notifiedUserIds: string[] = [];
    let generated = 0;
    for (const { userId } of users) {
      if (usersWithOffer.has(userId)) continue;

      const offer = this.offerRepository.create({
        title: promotion.title,
        description: promotion.description,
        discountPercentage: promotion.discountPercentage,
        userId,
        storeId: promotion.storeId,
        promotionId: promotion.id,
        expiresAt: promotion.endDate,
      });

      try {
        await this.offerRepository.save(offer);
        generated++;
        notifiedUserIds.push(userId);
      } catch (err: any) {
        // PostgreSQL unique_violation = 23505
        if (err?.code === '23505') {
          this.logger.warn(
            `Duplicate offer skipped: user=${userId} promotion=${promotionId}`,
          );
          continue;
        }
        throw err;
      }
    }

    // Send bulk notifications to users who received offers
    if (notifiedUserIds.length > 0) {
      const usersWithTokens: Pick<User, 'id' | 'pushToken'>[] =
        await this.offerRepository.manager
          .createQueryBuilder()
          .select(['u.id', 'u."pushToken"'])
          .from('users', 'u')
          .where('u.id IN (:...ids)', { ids: notifiedUserIds })
          .andWhere('u."pushToken" IS NOT NULL')
          .getRawMany()
          .then((rows) =>
            rows.map((r) => ({ id: r.u_id ?? r.id, pushToken: r.pushToken ?? r.u_pushToken })),
          );

      const discountText = promotion.discountPercentage
        ? `${promotion.discountPercentage}% off`
        : 'Check it out';

      this.notificationService.sendBulkNotifications(
        usersWithTokens.map((u) => ({
          pushToken: u.pushToken,
          title: 'New Offer Available!',
          body: `New offer from ${promotion.title}! ${discountText}`,
        })),
      );
    }

    return { generated };
  }
}
