import { adminNewsApi } from '@/lib/api'
import type { NewsItem } from '@/types/news'
import { useMutation, useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

const inputCls =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

interface FormValues {
  title: string
  tagsRaw: string
  projectId: string
  isActive: boolean
}

interface Props {
  news: NewsItem
  onClose: () => void
  onSuccess: () => void
}

export default function EditNewsModal({ news, onClose, onSuccess }: Props) {
  const { data: detail } = useQuery({
    queryKey: ['admin-news-detail', news.id],
    queryFn: () => adminNewsApi.getOne(news.id),
  })

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      title: news.title,
      tagsRaw: news.tags.join('\n'),
      projectId: news.projectId != null ? String(news.projectId) : '',
      isActive: news.isActive,
    },
  })

  useEffect(() => {
    if (!detail) return
    reset({
      title: detail.title,
      tagsRaw: detail.tags.join('\n'),
      projectId: detail.projectId != null ? String(detail.projectId) : '',
      isActive: detail.isActive,
    })
  }, [detail, reset])

  const mut = useMutation({
    mutationFn: (vals: FormValues) => {
      const pidRaw = vals.projectId.trim()
      return adminNewsApi.update(news.id, {
        title: vals.title.trim() || undefined,
        tags: vals.tagsRaw
          .split('\n')
          .map((t) => t.trim())
          .filter(Boolean),
        projectId: pidRaw === '' ? null : Number(pidRaw),
        isActive: vals.isActive,
      })
    },
    onSuccess,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-xl border border-border shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground m-0">Sửa tin tức</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((v) => mut.mutate(v))}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Source info (read-only) */}
            {detail?.sourceUrl && (
              <div className="text-xs text-muted-foreground break-all">
                <span className="font-medium">Nguồn: </span>
                <a
                  href={detail.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-foreground"
                >
                  {detail.sourceUrl}
                </a>
              </div>
            )}

            {/* Summary (read-only) */}
            {detail?.summary && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground leading-relaxed">
                {detail.summary}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Tiêu đề</label>
              <input {...register('title')} className={inputCls} />
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Tags{' '}
                <span className="font-normal text-muted-foreground">(mỗi dòng một tag)</span>
              </label>
              <textarea
                {...register('tagsRaw')}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            {/* Project ID */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                ID Dự án liên kết{' '}
                <span className="font-normal text-muted-foreground">(để trống để bỏ liên kết)</span>
              </label>
              {(news.project || news.autoProject) && (
                <p className="text-xs text-muted-foreground">
                  {news.project && (
                    <>
                      Thủ công:{' '}
                      <span className="text-foreground">
                        #{news.project.id} {news.project.name}
                      </span>
                    </>
                  )}
                  {news.autoProject && (
                    <>
                      {news.project && ' · '}Auto:{' '}
                      <span className="text-foreground">
                        #{news.autoProject.id} {news.autoProject.name}
                      </span>
                    </>
                  )}
                </p>
              )}
              <input
                {...register('projectId')}
                type="number"
                placeholder="VD: 42"
                className={inputCls}
              />
            </div>

            {/* isActive */}
            <div className="flex items-center gap-3">
              <input
                {...register('isActive')}
                id="news-isActive"
                type="checkbox"
                className="size-4 rounded accent-primary"
              />
              <label htmlFor="news-isActive" className="text-sm font-medium text-foreground">
                Hiển thị (isActive)
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            {mut.isError && (
              <p className="text-sm text-destructive mr-auto">
                {(mut.error as Error).message}
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-input text-sm hover:bg-muted transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={mut.isPending}
              className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {mut.isPending ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
