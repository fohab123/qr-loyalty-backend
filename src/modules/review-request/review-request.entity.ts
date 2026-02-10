import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Product } from '../product/product.entity';
import { User } from '../user/user.entity';

export enum ReviewRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('review_requests')
export class ReviewRequest extends BaseEntity {
  @ManyToOne(() => Product, (product) => product.reviewRequests)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => User, (user) => user.reviewRequests)
  @JoinColumn({ name: 'submitted_by_id' })
  submittedBy: User;

  @Column({ name: 'submitted_by_id' })
  submittedById: string;

  @Column({
    type: 'enum',
    enum: ReviewRequestStatus,
    default: ReviewRequestStatus.PENDING,
  })
  status: ReviewRequestStatus;

  @Column({ nullable: true })
  comment: string;
}
