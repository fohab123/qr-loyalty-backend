import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewRequest, ReviewRequestStatus } from './review-request.entity';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { ReviewDecisionDto } from './dto/review-decision.dto';
import { ProductService } from '../product/product.service';
import { ProductStatus } from '../product/product.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class ReviewRequestService {
  constructor(
    @InjectRepository(ReviewRequest)
    private readonly reviewRequestRepository: Repository<ReviewRequest>,
    private readonly productService: ProductService,
    private readonly userService: UserService,
  ) {}

  async create(userId: string, dto: CreateReviewRequestDto): Promise<ReviewRequest> {
    // Validate product and user exist
    await this.productService.findOne(dto.productId);
    await this.userService.findOne(userId);

    const request = this.reviewRequestRepository.create({
      productId: dto.productId,
      submittedById: userId,
      comment: dto.comment,
      status: ReviewRequestStatus.PENDING,
    });

    return this.reviewRequestRepository.save(request);
  }

  async findAll(status?: ReviewRequestStatus): Promise<ReviewRequest[]> {
    const where = status ? { status } : {};
    return this.reviewRequestRepository.find({
      where,
      relations: ['product', 'submittedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ReviewRequest> {
    const request = await this.reviewRequestRepository.findOne({
      where: { id },
      relations: ['product', 'submittedBy'],
    });
    if (!request) throw new NotFoundException('Review request not found');
    return request;
  }

  async decide(
    id: string,
    dto: ReviewDecisionDto,
  ): Promise<ReviewRequest> {
    const request = await this.findOne(id);

    if (request.status !== ReviewRequestStatus.PENDING) {
      throw new BadRequestException('Review request has already been decided');
    }

    if (
      dto.status === ReviewRequestStatus.APPROVED &&
      (dto.pointsValue === undefined || dto.pointsValue === null)
    ) {
      throw new BadRequestException(
        'pointsValue is required when approving a review request',
      );
    }

    // Update review request status
    request.status = dto.status;
    if (dto.comment) {
      request.comment = dto.comment;
    }

    // If approved, update the product status and pointsValue
    if (dto.status === ReviewRequestStatus.APPROVED) {
      await this.productService.update(request.productId, {
        status: ProductStatus.APPROVED,
        pointsValue: dto.pointsValue,
      });
    } else if (dto.status === ReviewRequestStatus.REJECTED) {
      await this.productService.update(request.productId, {
        status: ProductStatus.REJECTED,
      });
    }

    return this.reviewRequestRepository.save(request);
  }
}
