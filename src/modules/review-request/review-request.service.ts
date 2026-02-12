import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewRequest, ReviewRequestStatus } from './review-request.entity';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { ProductService } from '../product/product.service';
import { ProductStatus } from '../product/product.entity';
import { UserService } from '../user/user.service';
import { TransactionItem } from '../transaction/transaction-item.entity';

@Injectable()
export class ReviewRequestService {
  constructor(
    @InjectRepository(ReviewRequest)
    private readonly reviewRequestRepository: Repository<ReviewRequest>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
    private readonly productService: ProductService,
    private readonly userService: UserService,
  ) {}

  async create(userId: string, dto: CreateReviewRequestDto): Promise<ReviewRequest> {
    // Validate product and user exist
    const product = await this.productService.findOne(dto.productId);
    await this.userService.findOne(userId);

    // Block review requests for already-rejected products
    if (product.status === ProductStatus.REJECTED) {
      throw new BadRequestException('This product has been reviewed and rejected.');
    }

    // Check for existing pending request for same user + product
    const existing = await this.reviewRequestRepository.findOne({
      where: {
        productId: dto.productId,
        submittedById: userId,
        status: ReviewRequestStatus.PENDING,
      },
    });
    if (existing) {
      throw new ConflictException('You already have a pending review request for this product');
    }

    const request = this.reviewRequestRepository.create({
      productId: dto.productId,
      submittedById: userId,
      comment: dto.comment,
      status: ReviewRequestStatus.PENDING,
    });

    return this.reviewRequestRepository.save(request);
  }

  async findAllGrouped(status?: ReviewRequestStatus): Promise<any[]> {
    const where = status ? { status } : {};
    const requests = await this.reviewRequestRepository.find({
      where,
      relations: ['product', 'submittedBy'],
      order: { createdAt: 'ASC' },
    });

    if (requests.length === 0) return [];

    // Enrich with price from transaction items when product.price is null
    const productIds = [...new Set(requests.map(r => r.productId))];
    const priceMap = new Map<string, number>();

    if (productIds.length > 0) {
      const priceRows = await this.transactionItemRepository
        .createQueryBuilder('ti')
        .select('ti.product_id', 'productId')
        .addSelect('ti.unitPrice', 'unitPrice')
        .where('ti.product_id IN (:...productIds)', { productIds })
        .orderBy('ti.createdAt', 'DESC')
        .getRawMany();

      for (const row of priceRows) {
        if (!priceMap.has(row.productId)) {
          priceMap.set(row.productId, Number(row.unitPrice));
        }
      }
    }

    // Group by productId
    const groupMap = new Map<string, {
      productId: string;
      product: any;
      status: ReviewRequestStatus;
      requestCount: number;
      requesters: any[];
      earliestRequestDate: string;
    }>();

    for (const r of requests) {
      let group = groupMap.get(r.productId);
      if (!group) {
        let product = { ...r.product };
        if (product.price == null && priceMap.has(r.productId)) {
          product = { ...product, price: priceMap.get(r.productId)! };
        }

        group = {
          productId: r.productId,
          product,
          status: r.status,
          requestCount: 0,
          requesters: [],
          earliestRequestDate: r.createdAt.toISOString(),
        };
        groupMap.set(r.productId, group);
      }

      group.requestCount++;
      group.requesters.push({
        requestId: r.id,
        userId: r.submittedById,
        name: r.submittedBy?.name ?? 'Unknown',
        email: r.submittedBy?.email ?? '',
        comment: r.comment || undefined,
        createdAt: r.createdAt.toISOString(),
      });
    }

    // Sort by earliest request date (oldest first)
    return Array.from(groupMap.values()).sort(
      (a, b) => new Date(a.earliestRequestDate).getTime() - new Date(b.earliestRequestDate).getTime(),
    );
  }

  async findOne(id: string): Promise<ReviewRequest> {
    const request = await this.reviewRequestRepository.findOne({
      where: { id },
      relations: ['product', 'submittedBy'],
    });
    if (!request) throw new NotFoundException('Review request not found');
    return request;
  }

  async getTransactionsForProduct(productId: string) {
    // Find all users who have review requests for this product
    const requests = await this.reviewRequestRepository.find({
      where: { productId },
      relations: ['submittedBy'],
    });

    if (requests.length === 0) {
      throw new NotFoundException('No review requests found for this product');
    }

    // Deduplicate users
    const userMap = new Map<string, string>();
    for (const r of requests) {
      if (!userMap.has(r.submittedById)) {
        userMap.set(r.submittedById, r.submittedBy?.name ?? 'Unknown');
      }
    }

    // Query transactions for all users, grouped by user
    const users: any[] = [];

    for (const [userId, userName] of userMap) {
      const items = await this.transactionItemRepository
        .createQueryBuilder('ti')
        .innerJoinAndSelect('ti.transaction', 'tx')
        .innerJoinAndSelect('tx.store', 's')
        .where('ti.product_id = :productId', { productId })
        .andWhere('tx.user_id = :userId', { userId })
        .orderBy('tx.date', 'DESC')
        .getMany();

      users.push({
        userId,
        userName,
        transactions: items.map(ti => ({
          transactionId: ti.transactionId,
          date: ti.transaction.date,
          storeName: ti.transaction.store.name,
          quantity: ti.quantity,
          unitPrice: Number(ti.unitPrice),
          totalPrice: Number(ti.totalPrice),
          pointsAwarded: ti.pointsAwarded,
        })),
      });
    }

    return { productId, users };
  }

  async decideByProduct(
    productId: string,
    dto: ReviewDecisionDto,
  ) {
    // Find ALL pending requests for this product
    const requests = await this.reviewRequestRepository.find({
      where: { productId, status: ReviewRequestStatus.PENDING },
    });

    if (requests.length === 0) {
      throw new NotFoundException('No pending review requests found for this product');
    }

    if (
      dto.status === ReviewRequestStatus.APPROVED &&
      (dto.pointsValue === undefined || dto.pointsValue === null)
    ) {
      throw new BadRequestException(
        'pointsValue is required when approving a review request',
      );
    }

    // Update all pending requests for this product
    for (const request of requests) {
      request.status = dto.status;
      if (dto.comment) {
        request.comment = dto.comment;
      }
    }

    // If approved, update the product status and pointsValue
    if (dto.status === ReviewRequestStatus.APPROVED) {
      await this.productService.update(productId, {
        status: ProductStatus.APPROVED,
        pointsValue: dto.pointsValue,
      });
    } else if (dto.status === ReviewRequestStatus.REJECTED) {
      await this.productService.update(productId, {
        status: ProductStatus.REJECTED,
      });
    }

    await this.reviewRequestRepository.save(requests);

    return { productId, updatedCount: requests.length };
  }
}
