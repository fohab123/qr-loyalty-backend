import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product, ProductStatus } from './product.entity';
import { TransactionItem } from '../transaction/transaction-item.entity';
import { Transaction } from '../transaction/transaction.entity';
import { User } from '../user/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async findByName(name: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { name } });
  }

  async findOrCreateByName(
    name: string,
    identifier?: string,
    price?: number,
  ): Promise<Product> {
    let product = await this.productRepository.findOne({ where: { name } });
    if (!product) {
      product = this.productRepository.create({
        name,
        identifier: identifier || undefined,
        price: price ?? undefined,
        status: ProductStatus.PENDING,
        pointsValue: 0,
      });
      product = await this.productRepository.save(product);
    } else if (price != null && product.price == null) {
      product.price = price;
      product = await this.productRepository.save(product);
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const oldPointsValue = product.pointsValue;
    Object.assign(product, dto);
    const savedProduct = await this.productRepository.save(product);

    // Retroactively adjust points if pointsValue changed
    const newPointsValue = savedProduct.pointsValue;
    if (dto.pointsValue !== undefined && newPointsValue !== oldPointsValue) {
      await this.recalculatePointsForProduct(savedProduct);
    }

    return savedProduct;
  }

  private async recalculatePointsForProduct(product: Product): Promise<void> {
    // Find all transaction items for this product, with their transactions
    const items = await this.transactionItemRepository.find({
      where: { productId: product.id },
      relations: ['transaction'],
    });

    if (items.length === 0) return;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Group items by transaction to track per-transaction deltas
      // and by user to track per-user balance deltas
      const transactionDeltas = new Map<string, number>();
      const userDeltas = new Map<string, number>();

      for (const item of items) {
        const oldAwarded = Number(item.pointsAwarded);
        const newAwarded = product.pointsValue > 0
          ? product.pointsValue * item.quantity
          : Math.floor(Number(item.totalPrice) / 10);
        const delta = newAwarded - oldAwarded;

        if (delta === 0) continue;

        // Update the transaction item
        await queryRunner.manager.update(TransactionItem, item.id, {
          pointsAwarded: newAwarded,
        });

        // Accumulate transaction delta
        const txId = item.transactionId;
        transactionDeltas.set(txId, (transactionDeltas.get(txId) ?? 0) + delta);

        // Accumulate user delta
        const userId = item.transaction.userId;
        userDeltas.set(userId, (userDeltas.get(userId) ?? 0) + delta);
      }

      // Update each affected transaction's pointsEarned
      for (const [txId, delta] of transactionDeltas) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(Transaction)
          .set({ pointsEarned: () => `"pointsEarned" + ${delta}` })
          .where('id = :id', { id: txId })
          .execute();
      }

      // Update each affected user's pointsBalance
      for (const [userId, delta] of userDeltas) {
        await queryRunner.manager
          .createQueryBuilder()
          .update(User)
          .set({ pointsBalance: () => `"pointsBalance" + ${delta}` })
          .where('id = :id', { id: userId })
          .execute();
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }
}
