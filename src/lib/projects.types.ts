export type ProjectStatus = 'EN_PROCESO' | 'FINALIZADO' | 'PAUSADO';

export interface Project {
  id: number;
  title: string;
  slug?: string;
  summary?: string;
  content?: string;
  coverUrl?: string;
  category: string;
  place: string;
  area: string;
  status?: ProjectStatus;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectQuery {
  q?: string;
  category?: string;
  status?: ProjectStatus;
  place?: string;
  area?: string;
  page?: number;      // default en back: 1
  pageSize?: number;  // default en back: 10
  published?: boolean;
}

export interface PaginatedProjects {
  data: Project[];
  page: number;
  pageSize: number;
  total?: number;
}
