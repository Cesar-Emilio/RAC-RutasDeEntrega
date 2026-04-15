export type FileType = "json" | "csv";

export type RouteStatus =
  | "pending"
  | "processing"
  | "completed"
  | "error";

export interface Route {
  id: number;

  warehouse: number;
  delivery_count: number;
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

  sequence_order?: number | null;
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

export interface RouteDetail extends Route {
  input_file?: RouteInputFile;

  delivery_points?: DeliveryPoint[];

  solutions?: (RouteSolution & {
    details: RouteSolutionDetail[];
  })[];
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
}