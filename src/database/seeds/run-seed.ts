import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Store } from '../../modules/store/store.entity';
import { Product, ProductStatus } from '../../modules/product/product.entity';

dotenv.config();

async function runSeed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'qrcode_loyalty',
    entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected for seeding.');

  // Seed stores
  const storeRepository = dataSource.getRepository(Store);
  const stores = [
    { name: 'Maxi', location: 'Belgrade' },
    { name: 'Idea', location: 'Novi Sad' },
    { name: 'Roda', location: 'Niš' },
    { name: 'Lidl', location: 'Belgrade' },
    { name: 'Univerexport', location: 'Novi Sad' },
  ];

  for (const storeData of stores) {
    const existing = await storeRepository.findOne({
      where: { name: storeData.name },
    });
    if (!existing) {
      await storeRepository.save(storeRepository.create(storeData));
      console.log(`Created store: ${storeData.name}`);
    } else {
      console.log(`Store already exists: ${storeData.name}`);
    }
  }

  // Seed products (approved with points values)
  const productRepository = dataSource.getRepository(Product);
  const products = [
    { name: 'Coca-Cola 0.5L', pointsValue: 5, status: ProductStatus.APPROVED },
    { name: 'Jaffa Cakes', pointsValue: 10, status: ProductStatus.APPROVED },
    { name: 'Plazma keks', pointsValue: 8, status: ProductStatus.APPROVED },
    { name: 'Grand kafa 200g', pointsValue: 15, status: ProductStatus.APPROVED },
    { name: 'Knjaz Miloš 1.5L', pointsValue: 3, status: ProductStatus.APPROVED },
    { name: 'Chipsy čips', pointsValue: 7, status: ProductStatus.APPROVED },
    { name: 'Smoki 50g', pointsValue: 6, status: ProductStatus.APPROVED },
    { name: 'Domaćica keks', pointsValue: 9, status: ProductStatus.APPROVED },
    { name: 'Nektar sok 1L', pointsValue: 4, status: ProductStatus.APPROVED },
    { name: 'Štark čokolada', pointsValue: 12, status: ProductStatus.APPROVED },
  ];

  for (const productData of products) {
    const existing = await productRepository.findOne({
      where: { name: productData.name },
    });
    if (!existing) {
      await productRepository.save(productRepository.create(productData));
      console.log(
        `Created product: ${productData.name} (${productData.pointsValue} pts)`,
      );
    } else {
      console.log(`Product already exists: ${productData.name}`);
    }
  }

  console.log('Seeding complete!');
  await dataSource.destroy();
}

runSeed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
