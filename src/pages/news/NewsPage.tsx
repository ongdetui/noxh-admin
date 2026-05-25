import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminNewsApi } from '@/lib/api'
import type { City } from '@/types/project'
import type { NewsFilter, NewsItem, ScraperSource } from '@/types/news'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Pencil, Trash2, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import EditNewsModal from './EditNewsModal'

const CITY_LABEL: Record<City, string> = {
  HANOI: 'Hà Nội',
  HO_CHI_MINH: 'TP.HCM',
}

const SOURCE_LABEL: Record<ScraperSource, string> = {
  SOX_HANOI: 'Sở XD HN',
  SOX_HCM: 'Sở XD HCM',
  MOC: 'Bộ XD',
  BATDONGSAN: 'BĐS.com',
  CAFELAND: 'Cafeland',
  NHAOXAHOI_HN: 'NhàỞXH HN',
  ANNHOME_HCM: 'AnNhome HCM',
  GOOGLE_NEWS: 'Google News',
  MANUAL: 'Thủ công',
}

const selCls =
  'h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

function formatDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default function NewsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<NewsFilter>({ page: 1, limit: 20, isActive: undefined })
  const [editNews, setEditNews] = useState<NewsItem | null>(null)
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }))
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const { data, isLoading } = useQuery({
    queryKey: ['admin-news', filter],
    queryFn: () => adminNewsApi.list(filter),
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminNewsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-news'] }),
  })

  function upd(updates: Partial<NewsFilter>) {
    setFilter((prev) => ({ ...prev, ...updates, page: 1 }))
  }

  function handleDelete(item: NewsItem) {
    if (!window.confirm(`Ẩn tin tức "${item.title}"?`)) return
    deleteMut.mutate(item.id)
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <p className="text-[32px] font-semibold text-foreground m-0!">Quản lý tin tức</p>
        <span className="text-sm text-muted-foreground">{data ? `${data.total} tin tức` : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm tiêu đề..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-8 w-56 text-sm"
          />
        </div>

        <select
          className={selCls}
          value={filter.city ?? ''}
          onChange={(e) => upd({ city: (e.target.value as City) || undefined })}
        >
          <option value="">Tất cả thành phố</option>
          <option value="HANOI">Hà Nội</option>
          <option value="HO_CHI_MINH">TP.HCM</option>
        </select>

        <select
          className={selCls}
          value={filter.source ?? ''}
          onChange={(e) => upd({ source: (e.target.value as ScraperSource) || undefined })}
        >
          <option value="">Tất cả nguồn</option>
          {(Object.keys(SOURCE_LABEL) as ScraperSource[]).map((s) => (
            <option key={s} value={s}>
              {SOURCE_LABEL[s]}
            </option>
          ))}
        </select>

        <select
          className={selCls}
          value={filter.isActive === undefined ? '' : String(filter.isActive)}
          onChange={(e) =>
            upd({ isActive: e.target.value === '' ? undefined : e.target.value === 'true' })
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang hiển thị</option>
          <option value="false">Đã ẩn</option>
        </select>

        <select
          className={selCls}
          value={filter.unlinked ? 'true' : ''}
          onChange={(e) => upd({ unlinked: e.target.value === 'true' || undefined })}
        >
          <option value="">Tất cả liên kết</option>
          <option value="true">Chưa liên kết dự án</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Tin tức', 'Nguồn', 'Thành phố', 'Ngày đăng', 'Dự án', 'Tags', 'Trạng thái', ''].map(
                  (col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Đang tải...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Không có tin tức nào
                  </td>
                </tr>
              ) : (
                data?.items.map((item) => (
                  <tr key={item.id} className="bg-card hover:bg-muted/30 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-3 max-w-[300px]">
                      <div className="flex items-start gap-2">
                        {item.thumbnailUrl && (
                          <img
                            src={item.thumbnailUrl}
                            alt=""
                            className="h-10 w-14 rounded object-cover border border-border shrink-0 mt-0.5"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-foreground line-clamp-2 leading-snug">
                            {item.title}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">#{item.id}</div>
                        </div>
                      </div>
                    </td>
                    {/* Source */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">{SOURCE_LABEL[item.source] ?? item.source}</span>
                        {item.sourceUrl && (
                          <a
                            href={item.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    {/* City */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {CITY_LABEL[item.city] ?? item.city}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(item.publishedAt)}
                    </td>
                    {/* Project */}
                    <td className="px-4 py-3 max-w-[160px]">
                      {item.project ? (
                        <div className="text-foreground text-xs truncate">{item.project.name}</div>
                      ) : item.autoProject ? (
                        <div className="text-muted-foreground text-xs truncate italic">
                          Auto: {item.autoProject.name}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {/* Tags */}
                    <td className="px-4 py-3 max-w-[180px]">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={item.isActive ? 'success' : 'danger'}>
                        {item.isActive ? 'Hiển thị' : 'Đã ẩn'}
                      </Badge>
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditNews(item)}
                          title="Chỉnh sửa"
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {item.isActive && (
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deleteMut.isPending}
                            title="Ẩn tin tức"
                            className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-red-500 disabled:opacity-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Trang {data.page} / {data.totalPages} &nbsp;·&nbsp; {data.total} tin tức
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setFilter((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setFilter((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {editNews && (
        <EditNewsModal
          news={editNews}
          onClose={() => setEditNews(null)}
          onSuccess={() => {
            setEditNews(null)
            qc.invalidateQueries({ queryKey: ['admin-news'] })
          }}
        />
      )}
    </div>
  )
}
