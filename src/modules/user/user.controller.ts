import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Patch,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.userService.findOne(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(userId, dto);
  }

  @Put('me/push-token')
  updatePushToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.userService.updatePushToken(userId, dto.pushToken);
  }

  @Get('me/transactions')
  getMyTransactions(@CurrentUser('id') userId: string) {
    return this.userService.getTransactions(userId);
  }

  @Post('me/favorite-stores/:storeId')
  addMyFavoriteStore(
    @CurrentUser('id') userId: string,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.userService.addFavoriteStore(userId, storeId);
  }

  @Delete('me/favorite-stores/:storeId')
  removeMyFavoriteStore(
    @CurrentUser('id') userId: string,
    @Param('storeId', ParseUUIDPipe) storeId: string,
  ) {
    return this.userService.removeFavoriteStore(userId, storeId);
  }

  @Get('me/favorite-stores')
  getMyFavoriteStores(@CurrentUser('id') userId: string) {
    return this.userService.getFavoriteStores(userId);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.remove(id);
  }
}
