import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Receipt, ReceiptStatus } from './receipt.entity';
import { ReceiptFetcherService } from './receipt-fetcher.service';
import { UserService } from '../user/user.service';
import { StoreService } from '../store/store.service';
import { ProductService } from '../product/product.service';
import { ProductStatus } from '../product/product.entity';
import { Transaction } from '../transaction/transaction.entity';
import { TransactionItem } from '../transaction/transaction-item.entity';
import { User } from '../user/user.entity';
import { ScanReceiptDto } from './dto/scan-receipt.dto';

export interface ScanResultItem {
  productId: string;
  name: string;
  matched: boolean;
  pointsAwarded: number;
}

export interface ScanResult {
  transactionId: string;
  pointsEarned: number;
  newBalance: number;
  items: ScanResultItem[];
}

@Injectable()
export class ReceiptService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptRepository: Repository<Receipt>,
    private readonly receiptFetcherService: ReceiptFetcherService,
    private readonly userService: UserService,
    private readonly storeService: StoreService,
    private readonly productService: ProductService,
    private readonly dataSource: DataSource,
  ) {}

  async scanReceipt(userId: string, dto: ScanReceiptDto): Promise<ScanResult> {
    const { qrCodeData } = dto;

    // Step 1: Validate URL
    this.receiptFetcherService.validateUrl(qrCodeData);

    // Step 2: Check for duplicate receipt
    const receiptHash = this.receiptFetcherService.generateHash(qrCodeData);
    const existingReceipt = await this.receiptRepository.findOne({
      where: { receiptHash },
    });
    if (existingReceipt) {
      throw new ConflictException('This receipt has already been scanned');
    }

    // Step 3: Validate user exists
    const user = await this.userService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Step 4: Fetch and parse receipt data
    let parsedReceipt;
    try {
      parsedReceipt = await this.receiptFetcherService.fetchAndParse(qrCodeData);
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch receipt data: ${error.message}`,
      );
    }

    if (!parsedReceipt.items || parsedReceipt.items.length === 0) {
      throw new BadRequestException(
        'No items found on receipt. The receipt format may not be supported.',
      );
    }

    // Step 5-6: Process everything in a DB transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 6a: Find or create store
      const store = await this.storeService.findOrCreateByName(
        parsedReceipt.storeName,
      );

      // 6b: Process items and calculate points
      const resultItems: ScanResultItem[] = [];
      const transactionItems: Partial<TransactionItem>[] = [];
      let totalPointsEarned = 0;

      for (const item of parsedReceipt.items) {
        const product = await this.productService.findOrCreateByName(
          item.name,
          undefined,
          item.unitPrice,
        );

        const hasCustomPoints =
          product.status === ProductStatus.APPROVED && product.pointsValue > 0;
        const pointsAwarded = hasCustomPoints
          ? product.pointsValue * item.quantity
          : Math.floor(item.totalPrice / 10);
        totalPointsEarned += pointsAwarded;

        transactionItems.push({
          productId: product.id,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          pointsAwarded,
        });

        resultItems.push({
          productId: product.id,
          name: item.name,
          matched: hasCustomPoints,
          pointsAwarded,
        });
      }

      // 6c: Create receipt record
      const receipt = queryRunner.manager.create(Receipt, {
        receiptHash,
        receiptUrl: qrCodeData,
        rawData: JSON.stringify(parsedReceipt),
        storeId: store.id,
        receiptDate: parsedReceipt.date,
        totalAmount: parsedReceipt.totalAmount,
        scannedById: userId,
        status: ReceiptStatus.PROCESSED,
      });
      const savedReceipt = await queryRunner.manager.save(Receipt, receipt);

      // 6d: Create transaction
      const transaction = queryRunner.manager.create(Transaction, {
        userId,
        storeId: store.id,
        receiptId: savedReceipt.id,
        date: parsedReceipt.date,
        totalAmount: parsedReceipt.totalAmount,
        pointsEarned: totalPointsEarned,
      });
      const savedTransaction = await queryRunner.manager.save(
        Transaction,
        transaction,
      );

      // 6e: Create transaction items
      for (const itemData of transactionItems) {
        const txItem = queryRunner.manager.create(TransactionItem, {
          ...itemData,
          transactionId: savedTransaction.id,
        });
        await queryRunner.manager.save(TransactionItem, txItem);
      }

      // 6f: Update user points balance
      await queryRunner.manager.increment(
        User,
        { id: userId },
        'pointsBalance',
        totalPointsEarned,
      );

      await queryRunner.commitTransaction();

      return {
        transactionId: savedTransaction.id,
        pointsEarned: totalPointsEarned,
        newBalance: user.pointsBalance + totalPointsEarned,
        items: resultItems,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
