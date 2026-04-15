export interface Warehouse {
  id: number;

  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;

  latitude?: number | null;
  longitude?: number | null;

  active: boolean;

  created_at: string;
  updated_at: string;
}

export interface CreateWarehousePayload {
  name: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;

  latitude?: number;
  longitude?: number;
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload> & {
  active?: boolean;
};