export type FileType = "json" | "csv" | "xlsx";

export type RouteStatus =
  | "pending"
  | "processing"
  | "completed"
  | "error";

export interface Route {
  id: number;

  warehouse: number;
  delivery_count: number;
  k_opt: number;
  status: RouteStatus;

  created_at: string;
}

export interface RouteInputFile {
  file: string;
  file_type: FileType;
  uploaded_at: string;
}

export interface DeliveryPoint {
  id: number;

  address: string;
  latitude: number;
  longitude: number;
  receiver_name: string;
  package_quantity: number;
}

export interface RouteSolution {
  id: number;
  total_distance?: number | null;
  created_at: string;
}

export interface RouteSolutionDetail {
  id: number;
  order_index: number;
  delivery_point: DeliveryPoint;
}

export interface RouteDetail {
  id: number;
  status: "pending" | "processing" | "completed" | "error";
  created_at: string;
  company_name: string;
  warehouse_name: string;
  delivery_count: number;
  file_name: string | null;
  delivery_points: DeliveryPoint[];
  solution: {
    id: number;
    total_distance: number;
    details: {
      order_index: number;
      delivery_point: DeliveryPoint;
    }[];
  } | null;
}

export interface RouteTableItem {
  id: number;
  status: RouteStatus;
  created_at: string;
  company_name: string;
  warehouse_name: string;
  delivery_count: number;
  file_name: string;
}

export interface CreateRoutePayload {
  warehouse: number;
  file: File;
  file_type: FileType;
  k_opt: number;
}