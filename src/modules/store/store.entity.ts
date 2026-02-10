import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Transaction } from '../transaction/transaction.entity';
import { Receipt } from '../receipt/receipt.entity';

@Entity('stores')
export class Store extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  @OneToMany(() => Transaction, (transaction) => transaction.store)
  transactions: Transaction[];

  @OneToMany(() => Receipt, (receipt) => receipt.store)
  receipts: Receipt[];
}
