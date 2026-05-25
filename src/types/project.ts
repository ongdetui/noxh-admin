export type City = 'HANOI' | 'HO_CHI_MINH'
export type ProjectStatus = 'UPCOMING' | 'OPEN' | 'CLOSED' | 'UNKNOWN'

export interface Project {
  id: number
  slug: string
  name: string
  city: City
  district: string | null
  ward: string | null
  address: string | null
  developer: string | null
  developerPhone: string | null
  legalStatus: string | null
  permitNumber: string | null
  status: ProjectStatus
  applicationOpenDate: string | null
  applicationCloseDate: string | null
  projectType: string | null
  landArea: string | null
  buildingScale: string | null
  constructionDensity: string | null
  unitArea: string | null
  totalUnits: number | null
  noxhUnits: number | null
  priceMin: string | null
  priceMax: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  contentSections: ContentSection[] | null
  amenities: string[]
  risks: string[]
  thumbnailUrl: string | null
  images: string[]
  isActive: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
  _count: { sources: number; news: number }
}

export interface ProjectListResponse {
  items: Project[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProjectFilter {
  page: number
  limit: number
  search?: string
  city?: City
  status?: ProjectStatus
  isActive?: boolean
  isVerified?: boolean
}

export interface ContentSection {
  heading: string
  body: string
  images?: string[]
}

export interface UpdateProjectDto {
  name?: string
  address?: string
  district?: string
  ward?: string
  developer?: string
  developerPhone?: string
  legalStatus?: string
  permitNumber?: string
  status?: ProjectStatus
  applicationOpenDate?: string
  applicationCloseDate?: string
  projectType?: string
  landArea?: string
  buildingScale?: string
  constructionDensity?: string
  unitArea?: string
  totalUnits?: number
  noxhUnits?: number
  priceMin?: string
  priceMax?: string
  latitude?: number
  longitude?: number
  description?: string
  contentSections?: ContentSection[]
  amenities?: string[]
  risks?: string[]
  thumbnailUrl?: string
  images?: string[]
  isActive?: boolean
  isVerified?: boolean
}
