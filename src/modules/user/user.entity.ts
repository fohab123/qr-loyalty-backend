import {
  Entity,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Transaction } from '../transaction/transaction.entity';
import { ReviewRequest } from '../review-request/review-request.entity';
import { Receipt } from '../receipt/receipt.entity';
import { Store } from '../store/store.entity';
import { Offer } from '../offer/offer.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'int', default: 0 })
  pointsBalance: number;

  @Column({ nullable: true })
  pushToken: string;

  @ManyToMany(() => Store)
  @JoinTable({ name: 'user_favorite_stores' })
  favoriteStores: Store[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Receipt, (receipt) => receipt.scannedBy)
  receipts: Receipt[];

  @OneToMany(() => ReviewRequest, (request) => request.submittedBy)
  reviewRequests: ReviewRequest[];

  @OneToMany(() => Offer, (offer) => offer.user)
  offers: Offer[];
}
