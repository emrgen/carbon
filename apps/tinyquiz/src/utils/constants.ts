export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_TIME_FORMAT = 'YYYY-MM-DD hh:mm:ss A';

export enum DiscountType {
  PERCENTAGE = '%',
  AMOUNT = '₹',
}

export enum StockStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum PurchaseStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}


export enum OrderStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'delivered',
  CANCELLED = 'cancelled',
}

export const FLOAT_REGEX = /^(([0-9]*\.[0-9]{0,2})|([1-9][0-9]*)|0)$/;
export const INT_REGEX = /^(([1-9][0-9]*)|0)$/;

export const PurchaseStatusColors = {
  [PurchaseStatus.DRAFT]: 'gray',
  [PurchaseStatus.PENDING]: 'orange',
  [PurchaseStatus.DELIVERED]: 'green',
  [PurchaseStatus.CANCELLED]: 'red',
};

export const PriorityColors = {
  low: 'gray',
  medium: 'orange',
  high: 'red',
};