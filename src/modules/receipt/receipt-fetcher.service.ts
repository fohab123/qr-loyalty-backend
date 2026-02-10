import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  ParsedReceipt,
  ParsedReceiptItem,
} from './interfaces/parsed-receipt.interface';

@Injectable()
export class ReceiptFetcherService {
  private readonly SUF_DOMAIN = 'suf.purs.gov.rs';

  validateUrl(url: string): void {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.endsWith(this.SUF_DOMAIN)) {
        throw new BadRequestException(
          'Invalid receipt URL: must be from suf.purs.gov.rs',
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Invalid URL format');
    }
  }

  generateHash(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex');
  }

  async fetchAndParse(url: string): Promise<ParsedReceipt> {
    try {
      // Step 1: Fetch the verification page
      const pageResponse = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });

      const html = pageResponse.data as string;
      const cookies = pageResponse.headers['set-cookie'];

      // Extract invoiceNumber and token from the Knockout.js init script
      const invoiceNumber = this.extractJsVar(html, 'InvoiceNumber');
      const token = this.extractJsVar(html, 'Token');

      // Extract metadata from the static HTML
      const storeName = this.extractStoreName(html);
      const totalAmount = this.extractTotalAmount(html);
      const date = this.extractDate(html);

      // Step 2: Fetch item specifications via the JSON API
      const items = await this.fetchSpecifications(
        invoiceNumber,
        token,
        cookies,
      );

      return { storeName, items, totalAmount, date };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // DEV fallback: return mock data when SUF service is unreachable
      if (process.env.NODE_ENV !== 'production') {
        return this.generateMockReceipt(url);
      }
      throw new BadRequestException(
        'Failed to fetch receipt from SUF service',
      );
    }
  }

  private async fetchSpecifications(
    invoiceNumber: string,
    token: string,
    cookies?: string[],
  ): Promise<ParsedReceiptItem[]> {
    const cookieHeader = cookies
      ? cookies.map((c) => c.split(';')[0]).join('; ')
      : '';

    const response = await axios.post(
      `https://${this.SUF_DOMAIN}/specifications`,
      `invoiceNumber=${encodeURIComponent(invoiceNumber)}&token=${encodeURIComponent(token)}`,
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Content-Type': 'application/x-www-form-urlencoded',
          Origin: `https://${this.SUF_DOMAIN}`,
          Referer: `https://${this.SUF_DOMAIN}/v/`,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
      },
    );

    const data = response.data;
    if (!data?.success || !data?.items?.length) {
      throw new BadRequestException(
        'Failed to fetch receipt item specifications',
      );
    }

    return data.items.map(
      (item: { name: string; quantity: number; unitPrice: number; total: number }) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.total,
      }),
    );
  }

  private extractJsVar(html: string, varName: string): string {
    // Matches: viewModel.InvoiceNumber('MXNC2ZGS-MXNC2ZGS-11571');
    const pattern = new RegExp(`${varName}\\('([^']+)'\\)`);
    const match = html.match(pattern);
    if (!match?.[1]) {
      throw new BadRequestException(
        `Could not extract ${varName} from receipt page`,
      );
    }
    return match[1];
  }

  private extractStoreName(html: string): string {
    // SUF page: <span id="shopFullNameLabel">1235237-287 - Maxi</span>
    const shopMatch = html.match(
      /id="shopFullNameLabel"[^>]*>([^<]+)/,
    );
    if (shopMatch?.[1]) {
      const fullName = shopMatch[1].trim();
      // Strip the store number prefix (e.g. "1235237-287 - Maxi" → "Maxi")
      const dashIndex = fullName.lastIndexOf(' - ');
      return dashIndex !== -1
        ? fullName.substring(dashIndex + 3).trim()
        : fullName;
    }

    return 'Unknown Store';
  }

  private extractTotalAmount(html: string): number {
    // SUF page: <span id="totalAmountLabel"> 94,99 </span>
    const match = html.match(/id="totalAmountLabel"[^>]*>\s*([^<]+)/);
    if (match?.[1]) {
      return this.parseNumber(match[1].trim());
    }
    return 0;
  }

  private extractDate(html: string): Date {
    // SUF page: <span id="sdcDateTimeLabel"> 10.2.2026. 09:37:47 </span>
    const match = html.match(/id="sdcDateTimeLabel"[^>]*>\s*([^<]+)/);
    if (match?.[1]) {
      const dateStr = match[1].trim();
      // Serbian format: D.M.YYYY. HH:mm:ss (trailing dot after year)
      const dateMatch = dateStr.match(
        /(\d{1,2})\.(\d{1,2})\.(\d{4})\.?\s+(\d{2}):(\d{2}):(\d{2})/,
      );
      if (dateMatch) {
        const [, day, month, year, hour, min, sec] = dateMatch;
        return new Date(
          `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hour}:${min}:${sec}`,
        );
      }
    }

    return new Date();
  }

  private parseNumber(value: string): number {
    if (!value) return 0;
    // Handle Serbian number format (comma as decimal separator)
    const cleaned = value.replace(/\s/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private generateMockReceipt(url: string): ParsedReceipt {
    // Use URL hash to generate deterministic but varied mock data
    const hash = this.generateHash(url);
    const seed = parseInt(hash.substring(0, 8), 16);

    const stores = ['Maxi', 'Idea', 'Roda', 'Lidl', 'Univerexport'];
    const knownProducts = [
      'Coca-Cola 0.5L',
      'Jaffa Cakes',
      'Plazma keks',
      'Grand kafa 200g',
      'Smoki 50g',
    ];
    const unknownProducts = [
      'Domaći sir 200g',
      'Hleb beli 500g',
      'Jogurt 1L',
    ];

    const storeName = stores[seed % stores.length];
    const items: ParsedReceiptItem[] = [
      {
        name: knownProducts[seed % knownProducts.length],
        quantity: 2,
        unitPrice: 150,
        totalPrice: 300,
      },
      {
        name: knownProducts[(seed + 1) % knownProducts.length],
        quantity: 1,
        unitPrice: 250,
        totalPrice: 250,
      },
      {
        name: unknownProducts[seed % unknownProducts.length],
        quantity: 1,
        unitPrice: 200,
        totalPrice: 200,
      },
    ];

    const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0);

    return {
      storeName,
      items,
      totalAmount,
      date: new Date(),
    };
  }
}
