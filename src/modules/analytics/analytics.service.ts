import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../transaction/transaction.entity';
import { TransactionItem } from '../transaction/transaction-item.entity';
import { Product, ProductStatus } from '../product/product.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async getProductsByStore(topOnly = false) {
    const rows = await this.transactionItemRepo
      .createQueryBuilder('ti')
      .innerJoin('ti.transaction', 'tx')
      .innerJoin('tx.store', 's')
      .innerJoin('ti.product', 'p')
      .select('s.id', 'storeId')
      .addSelect('s.name', 'storeName')
      .addSelect('p.id', 'productId')
      .addSelect('p.name', 'productName')
      .addSelect('COUNT(ti.id)', 'scanCount')
      .addSelect('COALESCE(SUM(ti.pointsAwarded), 0)', 'totalPointsAwarded')
      .groupBy('s.id')
      .addGroupBy('s.name')
      .addGroupBy('p.id')
      .addGroupBy('p.name')
      .orderBy('s.name', 'ASC')
      .addOrderBy('"scanCount"', 'DESC')
      .getRawMany();

    const mapped = rows.map((r) => ({
      storeId: r.storeId,
      storeName: r.storeName,
      productId: r.productId,
      productName: r.productName,
      scanCount: Number(r.scanCount),
      totalPointsAwarded: Number(r.totalPointsAwarded),
    }));

    if (topOnly) {
      const seen = new Set<string>();
      return mapped.filter((r) => {
        if (seen.has(r.storeId)) return false;
        seen.add(r.storeId);
        return true;
      });
    }

    return mapped;
  }

  async getTopStores() {
    const rows = await this.transactionRepo
      .createQueryBuilder('tx')
      .innerJoin('tx.store', 's')
      .select('s.id', 'storeId')
      .addSelect('s.name', 'storeName')
      .addSelect('COUNT(tx.id)', 'scanCount')
      .addSelect('SUM(tx.pointsEarned)', 'totalPointsEarned')
      .addSelect('SUM(tx.totalAmount)', 'totalAmount')
      .groupBy('s.id')
      .addGroupBy('s.name')
      .orderBy('"scanCount"', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      storeId: r.storeId,
      storeName: r.storeName,
      scanCount: Number(r.scanCount),
      totalPointsEarned: Number(r.totalPointsEarned),
      totalAmount: Number(r.totalAmount),
    }));
  }

  async getUserActivity(period: 'daily' | 'weekly' | 'monthly') {
    const trunc = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const rows = await this.transactionRepo
      .createQueryBuilder('tx')
      .select(`DATE_TRUNC('${trunc}', tx.createdAt)`, 'period')
      .addSelect('COUNT(tx.id)', 'scanCount')
      .addSelect('COUNT(DISTINCT tx.userId)', 'uniqueUsers')
      .addSelect('SUM(tx.pointsEarned)', 'totalPointsEarned')
      .groupBy('period')
      .orderBy('period', 'DESC')
      .limit(30)
      .getRawMany();

    return rows.map((r) => ({
      period: r.period,
      scanCount: Number(r.scanCount),
      uniqueUsers: Number(r.uniqueUsers),
      totalPointsEarned: Number(r.totalPointsEarned),
    }));
  }

  async getNewProducts(period: 'daily' | 'weekly' | 'monthly') {
    const trunc = period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month';

    const trendRows = await this.productRepo
      .createQueryBuilder('p')
      .select(`DATE_TRUNC('${trunc}', p.createdAt)`, 'period')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.status = :status', { status: ProductStatus.PENDING })
      .groupBy('period')
      .orderBy('period', 'DESC')
      .limit(30)
      .getRawMany();

    const recentPending = await this.productRepo.find({
      where: { status: ProductStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      trend: trendRows.map((r) => ({
        period: r.period,
        count: Number(r.count),
      })),
      recentPending,
    };
  }
}
