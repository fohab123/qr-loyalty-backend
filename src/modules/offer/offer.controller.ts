import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OfferService } from './offer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferStatus } from './offer.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('offers')
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateOfferDto) {
    return this.offerService.create(dto);
  }

  // Static routes BEFORE :id
  @Roles(UserRole.ADMIN)
  @Post('generate/:promotionId')
  generateForPromotion(
    @Param('promotionId', ParseUUIDPipe) promotionId: string,
  ) {
    return this.offerService.createBulkForFavoriteStoreUsers(promotionId);
  }

  @Get('me')
  findMyOffers(@CurrentUser('id') userId: string) {
    return this.offerService.findOffersForUser(userId);
  }

  @Post('me/auto-generate')
  autoGenerate(@CurrentUser('id') userId: string) {
    return this.offerService.autoGenerateForUser(userId);
  }

  @Post('me/:offerId/claim')
  claimOffer(
    @CurrentUser('id') userId: string,
    @Param('offerId', ParseUUIDPipe) offerId: string,
  ) {
    return this.offerService.claimOffer(userId, offerId);
  }

  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query('status') status?: OfferStatus) {
    return this.offerService.findAll(status);
  }

  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerService.findOne(id);
  }

  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOfferDto,
  ) {
    return this.offerService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.offerService.remove(id);
  }
}
