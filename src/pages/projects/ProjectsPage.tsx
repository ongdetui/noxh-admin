import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminProjectsApi } from "@/lib/api";
import type {
  City,
  Project,
  ProjectFilter,
  ProjectStatus,
} from "@/types/project";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pencil, Search, Trash2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import EditProjectModal from "./EditProjectModal";

const CITY_LABEL: Record<City, string> = {
  HANOI: "Hà Nội",
  HO_CHI_MINH: "TP.HCM",
};

const STATUS_LABEL: Record<ProjectStatus, string> = {
  UPCOMING: "Sắp mở",
  OPEN: "Đang mở",
  CLOSED: "Đã đóng",
  UNKNOWN: "Không rõ",
};

const STATUS_VARIANT: Record<
  ProjectStatus,
  "default" | "success" | "danger" | "info"
> = {
  UPCOMING: "info",
  OPEN: "success",
  CLOSED: "danger",
  UNKNOWN: "default",
};

const selCls =
  "h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function ProjectsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ProjectFilter>({ page: 1, limit: 20 });
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setFilter((prev) => ({
        ...prev,
        search: searchInput || undefined,
        page: 1,
      }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projects", filter],
    queryFn: () => adminProjectsApi.list(filter),
  });

  const verifyMut = useMutation({
    mutationFn: (p: Project) =>
      p.isVerified
        ? adminProjectsApi.cancelVerify(p.id)
        : adminProjectsApi.verify(p.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-projects"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminProjectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-projects"] }),
  });

  function upd(updates: Partial<ProjectFilter>) {
    setFilter((prev) => ({ ...prev, ...updates, page: 1 }));
  }

  function handleDelete(project: Project) {
    if (!window.confirm(`Ẩn dự án "${project.name}"?`)) return;
    deleteMut.mutate(project.id);
  }

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <p className="text-[32px] font-semibold text-foreground m-0!">
          Quản lý dự án
        </p>
        <span className="text-sm text-muted-foreground">
          {data ? `${data.total} dự án` : ""}
        </span>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Tìm tên, địa chỉ, chủ đầu tư..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 h-8 w-64 text-sm"
          />
        </div>
        <select
          className={selCls}
          value={filter.city ?? ""}
          onChange={(e) => upd({ city: (e.target.value as City) || undefined })}
        >
          <option value="">Tất cả thành phố</option>
          <option value="HANOI">Hà Nội</option>
          <option value="HO_CHI_MINH">TP.HCM</option>
        </select>

        <select
          className={selCls}
          value={filter.status ?? ""}
          onChange={(e) =>
            upd({ status: (e.target.value as ProjectStatus) || undefined })
          }
        >
          <option value="">Tất cả trạng thái</option>
          <option value="UPCOMING">Sắp mở</option>
          <option value="OPEN">Đang mở</option>
          <option value="CLOSED">Đã đóng</option>
          <option value="UNKNOWN">Không rõ</option>
        </select>

        <select
          className={selCls}
          value={
            filter.isVerified === undefined ? "" : String(filter.isVerified)
          }
          onChange={(e) =>
            upd({
              isVerified:
                e.target.value === "" ? undefined : e.target.value === "true",
            })
          }
        >
          <option value="">Tất cả xác minh</option>
          <option value="true">Đã xác minh</option>
          <option value="false">Chưa xác minh</option>
        </select>

        <select
          className={selCls}
          value={filter.isActive === undefined ? "" : String(filter.isActive)}
          onChange={(e) =>
            upd({
              isActive:
                e.target.value === "" ? undefined : e.target.value === "true",
            })
          }
        >
          <option value="">Tất cả hiển thị</option>
          <option value="true">Đang hiển thị</option>
          <option value="false">Đã ẩn</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {[
                  "Dự án",
                  "Thành phố",
                  "Trạng thái",
                  "Chủ đầu tư",
                  "Số căn",
                  "Xác minh",
                  "Hiển thị",
                  "",
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
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Đang tải...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    Không có dự án nào
                  </td>
                </tr>
              ) : (
                data?.items.map((project) => (
                  <tr
                    key={project.id}
                    className="bg-card hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 max-w-[220px]">
                      <div className="font-medium text-foreground truncate">
                        {project.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {project.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {CITY_LABEL[project.city] ?? project.city}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[project.status]}>
                        {STATUS_LABEL[project.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-foreground">
                        {project.developer || "—"}
                      </div>
                      {project.developerPhone && (
                        <div className="text-xs text-muted-foreground">
                          {project.developerPhone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>{project.totalUnits} căn</div>
                      <div className="text-xs text-muted-foreground">
                        NOXH: {project.noxhUnits}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={project.isVerified ? "success" : "default"}
                      >
                        {project.isVerified ? "Đã xác minh" : "Chưa xác minh"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={project.isActive ? "success" : "danger"}>
                        {project.isActive ? "Hiển thị" : "Đã ẩn"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => verifyMut.mutate(project)}
                          disabled={verifyMut.isPending}
                          title={
                            project.isVerified ? "Bỏ xác minh" : "Xác minh"
                          }
                          className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-50"
                        >
                          {project.isVerified ? (
                            <XCircle className="size-4 text-yellow-500" />
                          ) : (
                            <CheckCircle2 className="size-4 text-green-500" />
                          )}
                        </button>
                        <button
                          onClick={() => setEditProject(project)}
                          title="Chỉnh sửa"
                          className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-4" />
                        </button>
                        {project.isActive && (
                          <button
                            onClick={() => handleDelete(project)}
                            disabled={deleteMut.isPending}
                            title="Ẩn dự án"
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
            Trang {data.page} / {data.totalPages} &nbsp;·&nbsp; {data.total} dự
            án
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

      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSuccess={() => {
            setEditProject(null);
            qc.invalidateQueries({ queryKey: ["admin-projects"] });
          }}
        />
      )}
    </div>
  );
}
