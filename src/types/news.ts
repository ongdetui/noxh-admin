import type { City } from './project'

export type ScraperSource =
  | 'SOX_HANOI'
  | 'SOX_HCM'
  | 'MOC'
  | 'BATDONGSAN'
  | 'CAFELAND'
  | 'NHAOXAHOI_HN'
  | 'ANNHOME_HCM'
  | 'GOOGLE_NEWS'
  | 'MANUAL'

export interface NewsItem {
  id: number
  title: string
  source: ScraperSource
  sourceUrl: string | null
  city: City
  publishedAt: string | null
  thumbnailUrl: string | null
  summary: string | null
  tags: string[]
  isActive: boolean
  projectId: number | null
  autoProjectId: number | null
  project: { id: number; name: string } | null
  autoProject: { id: number; name: string } | null
  createdAt: string
}

export interface NewsDetail extends NewsItem {
  externalId: string
  content: string | null
  contentSections: unknown
  imageUrls: string[]
  updatedAt: string
}

export interface NewsListResponse {
  items: NewsItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface NewsFilter {
  page: number
  limit: number
  search?: string
  city?: City
  source?: ScraperSource
  isActive?: boolean
  unlinked?: boolean
}

export interface UpdateNewsDto {
  title?: string
  projectId?: number | null
  tags?: string[]
  isActive?: boolean
}
