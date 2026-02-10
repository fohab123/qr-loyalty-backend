export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedReceipt {
  storeName: string;
  items: ParsedReceiptItem[];
  totalAmount: number;
  date: Date;
  receiptNumber?: string;
}
