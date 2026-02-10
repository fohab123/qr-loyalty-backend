import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../user/user.entity';
import { Store } from '../store/store.entity';
import { Receipt } from '../receipt/receipt.entity';
import { TransactionItem } from './transaction-item.entity';

@Entity('transactions')
export class Transaction extends BaseEntity {
  @ManyToOne(() => User, (user) => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Store, (store) => store.transactions)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: string;

  @OneToOne(() => Receipt)
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;

  @Column({ name: 'receipt_id', unique: true })
  receiptId: string;

  @Column({ type: 'timestamp' })
  date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'int', default: 0 })
  pointsEarned: number;

  @OneToMany(() => TransactionItem, (item) => item.transaction, {
    cascade: true,
  })
  items: TransactionItem[];
}
