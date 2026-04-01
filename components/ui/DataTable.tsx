"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type SortDirection = "asc" | "desc";

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
};

type DataTableProps<T> = {
  data: T[];
  columns: DataTableColumn<T>[];
  getRowKey: (row: T) => string;
  initialSort?: { columnId: string; direction: SortDirection };
  loading?: boolean;
  skeletonRows?: number;
  emptyState?: ReactNode;
  className?: string;
};

function compareValues(a: string | number, b: string | number) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), "de");
}

export default function DataTable<T>({
  data,
  columns,
  getRowKey,
  initialSort,
  loading = false,
  skeletonRows = 3,
  emptyState,
  className = "",
}: DataTableProps<T>) {
  const [sortState, setSortState] = useState(initialSort);

  const sortedData = useMemo(() => {
    if (!sortState) return data;
    const column = columns.find((item) => item.id === sortState.columnId);
    if (!column?.sortValue) return data;

    return [...data].sort((a, b) => {
      const aValue = column.sortValue?.(a) ?? "";
      const bValue = column.sortValue?.(b) ?? "";
      const result = compareValues(aValue, bValue);
      return sortState.direction === "asc" ? result : -result;
    });
  }, [columns, data, sortState]);

  const getAlignClass = (align: DataTableColumn<T>["align"]) => {
    switch (align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      default:
        return "text-left";
    }
  };

  return (
    <div
      className={[
        "overflow-hidden rounded-lg border border-[#E2E8F0] bg-white",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-[#F8FAFC]">
            <tr className="border-b border-[#E2E8F0]">
              {columns.map((column) => {
                const sortable = Boolean(column.sortValue);
                const active = sortState?.columnId === column.id;

                return (
                  <th
                    key={column.id}
                    scope="col"
                    className={[
                      "px-6 py-5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]",
                      getAlignClass(column.align),
                      column.headerClassName ?? "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSortState((current) => {
                            if (current?.columnId !== column.id) {
                              return { columnId: column.id, direction: "asc" };
                            }
                            return {
                              columnId: column.id,
                              direction:
                                current.direction === "asc" ? "desc" : "asc",
                            };
                          })
                        }
                        className="inline-flex min-h-10 items-center gap-1 text-inherit transition-colors hover:text-[#475569]"
                      >
                        <span>{column.header}</span>
                        {active && sortState?.direction === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : null}
                        {active && sortState?.direction === "desc" ? (
                          <ChevronDown
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        ) : null}
                        {!active ? (
                          <ChevronDown
                            className="h-3.5 w-3.5 opacity-40"
                            aria-hidden="true"
                          />
                        ) : null}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                  <tr
                    key={`skeleton-${rowIndex}`}
                    className="border-b border-[#F0F4F9] last:border-b-0"
                  >
                    {columns.map((column) => (
                      <td key={column.id} className="px-6 py-5">
                        <div className="h-4 animate-pulse rounded bg-[#E2E8F0]" />
                      </td>
                    ))}
                  </tr>
                ))
              : null}

            {!loading && sortedData.length > 0
              ? sortedData.map((row) => (
                  <tr
                    key={getRowKey(row)}
                    className="border-b border-[#F0F4F9] transition-colors duration-100 hover:bg-[#F8FAFC] last:border-b-0"
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={[
                          "px-6 py-5 text-[15px] text-[#0F172A]",
                          getAlignClass(column.align),
                          column.cellClassName ?? "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {!loading && sortedData.length === 0 ? (
        <div className="p-6">{emptyState}</div>
      ) : null}
    </div>
  );
}
