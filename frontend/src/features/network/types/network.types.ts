export interface SugerenciaUsuario {
  id: string;
  username: string;
  nombre: string;
  avatar?: string;
  conexionesEnComun: number;
  seguidosEnComun: string[];
}
