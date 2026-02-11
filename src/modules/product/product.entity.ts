import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { TransactionItem } from '../transaction/transaction-item.entity';
import { ReviewRequest } from '../review-request/review-request.entity';

export enum ProductStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity('products')
export class Product extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  identifier: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number | null;

  @Column({ type: 'int', default: 0 })
  pointsValue: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.PENDING,
  })
  status: ProductStatus;

  @OneToMany(() => TransactionItem, (item) => item.product)
  transactionItems: TransactionItem[];

  @OneToMany(() => ReviewRequest, (request) => request.product)
  reviewRequests: ReviewRequest[];
}
