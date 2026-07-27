export type Merchant = {
  id: string;
  name: string;
  address: string;
  area: string;
  category: string;
};

export type MerchantDataset = {
  merchants: Merchant[];
  areas: string[];
  categories: string[];
  updatedAt: string;
};
