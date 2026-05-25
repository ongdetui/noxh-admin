import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Plus, Trash2 } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { adminProjectsApi } from '@/lib/api'
import type { Project } from '@/types/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const optStr = z.string().optional()
const optNum = z.number().min(0).optional()

const schema = z.object({
  // Cơ bản
  name: z.string().min(1, 'Bắt buộc'),
  status: z.enum(['UPCOMING', 'OPEN', 'CLOSED', 'UNKNOWN']),
  description: optStr,
  // Thời gian
  applicationOpenDate: optStr,
  applicationCloseDate: optStr,
  // Địa chỉ
  address: optStr,
  district: optStr,
  ward: optStr,
  // Chủ đầu tư
  developer: optStr,
  developerPhone: optStr,
  // Pháp lý
  legalStatus: optStr,
  permitNumber: optStr,
  // Loại hình
  projectType: optStr,
  landArea: optStr,
  buildingScale: optStr,
  constructionDensity: optStr,
  // Căn hộ
  totalUnits: optNum,
  noxhUnits: optNum,
  unitArea: optStr,
  // Giá
  priceMin: optStr,
  priceMax: optStr,
  // Vị trí
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  // Nội dung
  contentSections: z
    .array(z.object({ heading: z.string(), body: z.string(), images: z.array(z.string()).optional() }))
    .optional(),
  amenitiesRaw: optStr,
  risksRaw: optStr,
  // Ảnh
  thumbnailUrl: optStr,
  imagesRaw: optStr,
  // Trạng thái
  isActive: z.boolean(),
  isVerified: z.boolean(),
})

type FormData = z.infer<typeof schema>

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

const textareaCls =
  'flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-3 pb-1 border-t border-border first:border-t-0 first:pt-0">
      {children}
    </p>
  )
}

const toDate = (iso: string | null | undefined) => (iso ? iso.split('T')[0] : '')

function toFormValues(p: Project): FormData {
  return {
    name: p.name ?? '',
    status: p.status,
    description: p.description ?? '',
    applicationOpenDate: toDate(p.applicationOpenDate),
    applicationCloseDate: toDate(p.applicationCloseDate),
    address: p.address ?? '',
    district: p.district ?? '',
    ward: p.ward ?? '',
    developer: p.developer ?? '',
    developerPhone: p.developerPhone ?? '',
    legalStatus: p.legalStatus ?? '',
    permitNumber: p.permitNumber ?? '',
    projectType: p.projectType ?? '',
    landArea: p.landArea ?? '',
    buildingScale: p.buildingScale ?? '',
    constructionDensity: p.constructionDensity ?? '',
    totalUnits: p.totalUnits ?? undefined,
    noxhUnits: p.noxhUnits ?? undefined,
    unitArea: p.unitArea ?? '',
    priceMin: p.priceMin ?? '',
    priceMax: p.priceMax ?? '',
    latitude: p.latitude ?? undefined,
    longitude: p.longitude ?? undefined,
    contentSections: p.contentSections?.map((s) => ({ heading: s.heading, body: s.body, images: s.images ?? [] })) ?? [],
    amenitiesRaw: p.amenities?.join('\n') ?? '',
    risksRaw: p.risks?.join('\n') ?? '',
    thumbnailUrl: p.thumbnailUrl ?? '',
    imagesRaw: p.images?.join('\n') ?? '',
    isActive: p.isActive,
    isVerified: p.isVerified,
  }
}

const numOpts = { setValueAs: (v: string) => (v === '' ? undefined : Number(v)) }

interface Props {
  project: Project
  onClose: () => void
  onSuccess: () => void
}

export default function EditProjectModal({ project, onClose, onSuccess }: Props) {
  const { data: fullProject, isLoading } = useQuery({
    queryKey: ['admin-project', project.id],
    queryFn: () => adminProjectsApi.getOne(project.id),
  })

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(project),
  })

  useEffect(() => {
    if (fullProject) reset(toFormValues(fullProject))
  }, [fullProject, reset])

  const { fields, append, remove } = useFieldArray({ control, name: 'contentSections' })

  const mutation = useMutation({
    mutationFn: ({ amenitiesRaw, risksRaw, imagesRaw, contentSections, ...data }: FormData) => {
      const toArr = (raw: string | undefined) =>
        raw ? raw.split('\n').map((s) => s.trim()).filter(Boolean) : undefined
      const sections = contentSections?.filter((s) => s.heading || s.body)
      return adminProjectsApi.update(project.id, {
        ...data,
        ...(amenitiesRaw !== undefined ? { amenities: toArr(amenitiesRaw) } : {}),
        ...(risksRaw !== undefined ? { risks: toArr(risksRaw) } : {}),
        ...(imagesRaw !== undefined ? { images: toArr(imagesRaw) } : {}),
        ...(sections !== undefined ? { contentSections: sections } : {}),
      })
    },
    onSuccess,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-card rounded-xl border border-border shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-foreground">Chỉnh sửa dự án</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{project.slug}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang tải dữ liệu...
          </div>
        )}

        {!isLoading && (
          <form onSubmit={handleSubmit((d) => mutation.mutateAsync(d))} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {mutation.isError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                  {mutation.error instanceof Error ? mutation.error.message : 'Có lỗi xảy ra'}
                </div>
              )}

              {/* Thông tin cơ bản */}
              <SectionTitle>Thông tin cơ bản</SectionTitle>
              <div className="space-y-1.5">
                <Label htmlFor="name">Tên dự án</Label>
                <Input id="name" {...register('name')} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Trạng thái</Label>
                  <select id="status" {...register('status')} className={inputCls}>
                    <option value="UPCOMING">Sắp mở</option>
                    <option value="OPEN">Đang mở</option>
                    <option value="CLOSED">Đã đóng</option>
                    <option value="UNKNOWN">Không rõ</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projectType">Loại hình</Label>
                  <Input id="projectType" placeholder="Nhà ở xã hội" {...register('projectType')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Mô tả tổng quan</Label>
                <textarea id="description" rows={3} {...register('description')} className={textareaCls} />
              </div>

              {/* Thời gian */}
              <SectionTitle>Thời gian nhận hồ sơ</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="applicationOpenDate">Ngày mở</Label>
                  <Input id="applicationOpenDate" type="date" {...register('applicationOpenDate')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="applicationCloseDate">Ngày đóng</Label>
                  <Input id="applicationCloseDate" type="date" {...register('applicationCloseDate')} />
                </div>
              </div>

              {/* Địa chỉ */}
              <SectionTitle>Địa chỉ</SectionTitle>
              <div className="space-y-1.5">
                <Label htmlFor="address">Địa chỉ đầy đủ</Label>
                <Input id="address" {...register('address')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="district">Quận / Huyện</Label>
                  <Input id="district" {...register('district')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ward">Phường / Xã</Label>
                  <Input id="ward" {...register('ward')} />
                </div>
              </div>

              {/* Vị trí bản đồ */}
              <SectionTitle>Vị trí bản đồ</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" type="number" step="any" placeholder="21.0278" {...register('latitude', numOpts)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" type="number" step="any" placeholder="105.8342" {...register('longitude', numOpts)} />
                </div>
              </div>

              {/* Chủ đầu tư */}
              <SectionTitle>Chủ đầu tư</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="developer">Tên công ty</Label>
                  <Input id="developer" {...register('developer')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="developerPhone">Số điện thoại</Label>
                  <Input id="developerPhone" {...register('developerPhone')} />
                </div>
              </div>

              {/* Pháp lý */}
              <SectionTitle>Pháp lý</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="legalStatus">Tình trạng pháp lý</Label>
                  <Input id="legalStatus" placeholder="Sở hữu lâu dài" {...register('legalStatus')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="permitNumber">Số giấy phép</Label>
                  <Input id="permitNumber" placeholder="123/GP-UBND" {...register('permitNumber')} />
                </div>
              </div>

              {/* Quy mô xây dựng */}
              <SectionTitle>Quy mô xây dựng</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="landArea">Diện tích khu đất</Label>
                  <Input id="landArea" placeholder="3.500 – 6.600 m²" {...register('landArea')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="buildingScale">Quy mô xây dựng</Label>
                  <Input id="buildingScale" placeholder="01 tòa 33 tầng" {...register('buildingScale')} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="constructionDensity">Mật độ xây dựng</Label>
                <Input id="constructionDensity" placeholder="58–60%" {...register('constructionDensity')} />
              </div>

              {/* Căn hộ */}
              <SectionTitle>Căn hộ</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="totalUnits">Tổng số căn</Label>
                  <Input id="totalUnits" type="number" min="0" {...register('totalUnits', numOpts)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="noxhUnits">Số căn NOXH</Label>
                  <Input id="noxhUnits" type="number" min="0" {...register('noxhUnits', numOpts)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="unitArea">Diện tích căn</Label>
                  <Input id="unitArea" placeholder="31–70 m²" {...register('unitArea')} />
                </div>
              </div>

              {/* Giá */}
              <SectionTitle>Giá (VND)</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="priceMin">Giá từ</Label>
                  <Input id="priceMin" placeholder="800000000" {...register('priceMin')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priceMax">Giá đến</Label>
                  <Input id="priceMax" placeholder="1500000000" {...register('priceMax')} />
                </div>
              </div>

              {/* Content Sections */}
              <SectionTitle>Nội dung theo section</SectionTitle>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Section {index + 1}</span>
                      <button type="button" onClick={() => remove(index)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`sh-${index}`}>Tiêu đề</Label>
                      <Input id={`sh-${index}`} placeholder="Tổng quan dự án" {...register(`contentSections.${index}.heading`)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`sb-${index}`}>Nội dung</Label>
                      <textarea id={`sb-${index}`} rows={3} {...register(`contentSections.${index}.body`)} className={textareaCls} />
                    </div>
                    {(field as { images?: string[] }).images?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {((field as { images?: string[] }).images ?? []).map((url, i) => (
                          <img key={i} src={url} alt="" className="h-16 w-24 rounded object-cover border border-border" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                <button type="button" onClick={() => append({ heading: '', body: '' })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground hover:border-ring hover:text-foreground transition-colors">
                  <Plus className="size-4" />
                  Thêm section
                </button>
              </div>

              {/* Tiện ích & Rủi ro */}
              <SectionTitle>Tiện ích & Rủi ro</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="amenitiesRaw">Tiện ích (mỗi dòng)</Label>
                  <textarea id="amenitiesRaw" rows={4} placeholder={'Hồ bơi\nCông viên'} {...register('amenitiesRaw')} className={textareaCls} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="risksRaw">Rủi ro / Lưu ý (mỗi dòng)</Label>
                  <textarea id="risksRaw" rows={4} placeholder={'Pháp lý chưa hoàn thiện'} {...register('risksRaw')} className={textareaCls} />
                </div>
              </div>

              {/* Ảnh */}
              <SectionTitle>Ảnh</SectionTitle>
              <div className="space-y-1.5">
                <Label htmlFor="thumbnailUrl">Ảnh đại diện (URL)</Label>
                <Input id="thumbnailUrl" placeholder="https://..." {...register('thumbnailUrl')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="imagesRaw">Danh sách ảnh (mỗi dòng một URL)</Label>
                <textarea id="imagesRaw" rows={3} placeholder="https://..." {...register('imagesRaw')} className={textareaCls} />
              </div>

              {/* Trạng thái */}
              <SectionTitle>Trạng thái</SectionTitle>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('isActive')} className="rounded border-input size-4" />
                  <span className="text-sm text-foreground">Hiển thị dự án</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('isVerified')} className="rounded border-input size-4" />
                  <span className="text-sm text-foreground">Đã xác minh</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting || mutation.isPending}>
                {(isSubmitting || mutation.isPending) && <Loader2 className="mr-2 size-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
