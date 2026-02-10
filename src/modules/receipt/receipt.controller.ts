import { Controller, Post, Body } from '@nestjs/common';
import { ReceiptService } from './receipt.service';
import { ScanReceiptDto } from './dto/scan-receipt.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('points')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post('add')
  scanReceipt(
    @CurrentUser('id') userId: string,
    @Body() dto: ScanReceiptDto,
  ) {
    return this.receiptService.scanReceipt(userId, dto);
  }
}
