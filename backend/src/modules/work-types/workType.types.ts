export interface WorkType {
  id: string;
  name: string;
  unit: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkTypeDto {
  name: string;
  unit: string;
}
