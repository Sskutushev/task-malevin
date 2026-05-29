export interface WorkType {
  id: string;
  groupName: string;
  name: string;
  unit: string;
  quantityHint: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkTypeDto {
  groupName: string;
  name: string;
  unit: string;
  quantityHint: string;
}
