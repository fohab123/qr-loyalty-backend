import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Store } from '../store/store.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role', 'pointsBalance', 'createdAt', 'updatedAt'],
    });
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async addFavoriteStore(userId: string, storeId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteStores'],
    });
    if (!user) throw new NotFoundException('User not found');

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) throw new NotFoundException('Store not found');

    const alreadyFavorite = user.favoriteStores.some((s) => s.id === storeId);
    if (!alreadyFavorite) {
      user.favoriteStores.push(store);
      await this.userRepository.save(user);
    }

    return user;
  }

  async removeFavoriteStore(userId: string, storeId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteStores'],
    });
    if (!user) throw new NotFoundException('User not found');

    user.favoriteStores = user.favoriteStores.filter((s) => s.id !== storeId);
    await this.userRepository.save(user);

    return user;
  }

  async getFavoriteStores(userId: string): Promise<Store[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['favoriteStores'],
    });
    if (!user) throw new NotFoundException('User not found');

    return user.favoriteStores;
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.userRepository.update(userId, { pushToken });
  }

  async getTransactions(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: [
        'transactions',
        'transactions.store',
        'transactions.items',
        'transactions.items.product',
      ],
    });
    if (!user) throw new NotFoundException('User not found');

    return user.transactions;
  }
}
