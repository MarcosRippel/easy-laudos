export interface Equipment {
  id: string;
  name: string;
  model: string;
  certificateNumber: string;
  calibrationDate: Date;
  expirationDate: Date;
  equipmentType: 'DECIBELIMETRO' | 'RUIDO' | 'CALIBRADOR' | 'PAQUIMETRO' | 'OUTROS';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EquipmentNotification {
  id: string;
  name: string;
  model: string;
  certificateNumber: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  severity: 'warning' | 'critical' | 'expired';
}

export interface CreateEquipmentData {
  name: string;
  model: string;
  certificateNumber: string;
  calibrationDate: string;
  expirationDate: string;
  equipmentType: 'DECIBELIMETRO' | 'RUIDO' | 'CALIBRADOR' | 'PAQUIMETRO' | 'OUTROS';
  isActive?: boolean;
}

export interface UpdateEquipmentData extends Partial<CreateEquipmentData> {
  id: string;
}