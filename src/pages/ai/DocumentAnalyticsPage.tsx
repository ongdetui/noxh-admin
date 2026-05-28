import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAiApi } from "@/lib/api";
import type {
  DocumentAnalysis,
  DocumentAnalysesFilter,
  DocumentAnalysisDetail,
} from "@/types/ai";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

function fmt(n: number, decimals = 0) {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: decimals });
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">—</span>;
  const variant =
    score >= 80 ? "success" : score >= 50 ? "info" : "danger";
  return <Badge variant={variant}>{score}</Badge>;
}

function DetailModal({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-analysis", id],
    queryFn: () => adminAiApi.getAnalysis(id),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-xl border border-border w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-xl m-4">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <p className="font-semibold text-foreground">Chi tiết phân tích</p>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Đang tải...</p>
        ) : data ? (
          <DetailContent data={data} />
        ) : null}
      </div>
    </div>
  );
}

function DetailContent({ data }: { data: DocumentAnalysisDetail }) {
  const result = data.result;
  const detected =
    result?.detectedDocuments?.map((d) => d.documentType) ??
    data.detectedDocuments ??
    [];

  return (
    <div className="p-5 space-y-5 text-sm">
      {/* User */}
      <section className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Người dùng
        </p>
        <p className="font-medium text-foreground">{data.user.fullName}</p>
        <p className="text-muted-foreground">{data.user.email}</p>
      </section>

      {/* File info */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          File
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="default">{data.fileType.toUpperCase()}</Badge>
          <span className="text-muted-foreground">{data.pageCount} trang</span>
          <a
            href={data.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <ExternalLink className="size-3" />
            Xem file
          </a>
        </div>
      </section>

      {/* Score */}
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Điểm
        </p>
        <ScoreBadge score={result?.overallScore ?? result?.score ?? data.overallScore} />
      </section>

      {/* Detected documents */}
      {detected.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Loại tài liệu phát hiện ({detected.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {detected.map((doc) => (
              <Badge key={doc} variant="info">
                {doc}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Summary */}
      {(result?.summary ?? data.summary) && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tóm tắt
          </p>
          <p className="text-foreground leading-relaxed">
            {result?.summary ?? data.summary}
          </p>
        </section>
      )}

      {/* Errors */}
      {result?.errors && result.errors.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Lỗi ({result.errors.length})
          </p>
          <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
            {JSON.stringify(result.errors, null, 2)}
          </pre>
        </section>
      )}

      {/* Warnings */}
      {result?.warnings && result.warnings.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Cảnh báo ({result.warnings.length})
          </p>
          <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
            {JSON.stringify(result.warnings, null, 2)}
          </pre>
        </section>
      )}

      {/* Recommendations */}
      {result?.recommendations && result.recommendations.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Khuyến nghị ({result.recommendations.length})
          </p>
          <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
            {JSON.stringify(result.recommendations, null, 2)}
          </pre>
        </section>
      )}

      {/* Missing documents */}
      {result?.missingDocuments && result.missingDocuments.length > 0 && (
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Tài liệu thiếu ({result.missingDocuments.length})
          </p>
          <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto">
            {JSON.stringify(result.missingDocuments, null, 2)}
          </pre>
        </section>
      )}

      {/* Token & cost */}
      <section className="grid grid-cols-2 gap-4 pt-2 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground">Token đã dùng</p>
          <p className="font-medium">{fmt(data.tokensUsed)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Chi phí (USD)</p>
          <p className="font-medium">${data.costUsd.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Thời gian</p>
          <p className="font-medium">
            {new Date(data.createdAt).toLocaleString("vi-VN")}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">ID</p>
          <p className="font-mono text-xs truncate text-muted-foreground">
            {data.id}
          </p>
        </div>
      </section>
    </div>
  );
}

const selCls =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function DocumentAnalyticsPage() {
  const [filter, setFilter] = useState<DocumentAnalysesFilter>({
    page: 1,
    limit: 20,
  });
  const [userInput, setUserInput] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((prev) => ({
        ...prev,
        userId: userInput || undefined,
        page: 1,
      }));
    }, 400);
    return () => clearTimeout(t);
  }, [userInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-analyses", filter],
    queryFn: () => adminAiApi.listAnalyses(filter),
  });

  function upd(updates: Partial<DocumentAnalysesFilter>) {
    setFilter((prev) => ({ ...prev, ...updates, page: 1 }));
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <p className="text-[32px] font-semibold text-foreground m-0!">
          Document Analytics
        </p>
        <span className="text-sm text-muted-foreground">
          {data ? `${data.total} bản phân tích` : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm theo User ID..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="pl-8 h-8 w-52 text-sm"
          />
        </div>
        <input
          type="date"
          value={filter.dateFrom ?? ""}
          onChange={(e) => upd({ dateFrom: e.target.value || undefined })}
          className={selCls}
          placeholder="Từ ngày"
        />
        <input
          type="date"
          value={filter.dateTo ?? ""}
          onChange={(e) => upd({ dateTo: e.target.value || undefined })}
          className={selCls}
          placeholder="Đến ngày"
        />
        {(filter.dateFrom || filter.dateTo || filter.userId) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setUserInput("");
              setFilter({ page: 1, limit: 20 });
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Người dùng",
                  "Loại file",
                  "Trang",
                  "Điểm",
                  "Token",
                  "Chi phí (USD)",
                  "Thời gian",
                ].map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data?.items.map((item: DocumentAnalysis) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className="bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground truncate max-w-[160px]">
                        {item.user.fullName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {item.user.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge variant="default">
                        {item.fileType.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.pageCount}
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={item.overallScore} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {fmt(item.tokensUsed)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      ${item.costUsd.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
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
            Trang {data.page} / {data.totalPages} &nbsp;·&nbsp; {data.total}{" "}
            bản phân tích
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() =>
                setFilter((prev) => ({ ...prev, page: prev.page - 1 }))
              }
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() =>
                setFilter((prev) => ({ ...prev, page: prev.page + 1 }))
              }
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {selectedId && (
        <DetailModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}
