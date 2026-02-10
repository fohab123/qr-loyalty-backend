import { IsString } from 'class-validator';

export class ScanReceiptDto {
  @IsString()
  qrCodeData: string;
}
