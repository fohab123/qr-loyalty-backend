import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Store } from '../store/store.entity';
import { User } from '../user/user.entity';

export enum ReceiptStatus {
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Entity('receipts')
export class Receipt extends BaseEntity {
  @Column({ name: 'receipt_hash', type: 'varchar', length: 64, unique: true })
  receiptHash: string;

  @Column({ name: 'receipt_url', type: 'text' })
  receiptUrl: string;

  @Column({ name: 'raw_data', type: 'text', nullable: true })
  rawData: string;

  @ManyToOne(() => Store, (store) => store.receipts)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'store_id' })
  storeId: string;

  @Column({ name: 'receipt_date', type: 'timestamp' })
  receiptDate: Date;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @ManyToOne(() => User, (user) => user.receipts)
  @JoinColumn({ name: 'scanned_by_id' })
  scannedBy: User;

  @Column({ name: 'scanned_by_id' })
  scannedById: string;

  @Column({
    type: 'enum',
    enum: ReceiptStatus,
    default: ReceiptStatus.PROCESSED,
  })
  status: ReceiptStatus;
}
