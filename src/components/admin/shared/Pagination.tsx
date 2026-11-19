"use client";

import { ChevronRight, ChevronLeft } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : null;
  const end = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : null;

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between pt-4 border-t border-[#231d17]">
      {totalItems && start && end ? (
        <span className="text-xs text-[#8a8076]">
          {start}–{end} من {totalItems}
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c1613] border border-[#2a231d] text-[#a89f94] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {pages.map((page, i) =>
          page === "..." ? (
            <span key={i} className="px-1 text-[#5a4f45]">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                currentPage === page
                  ? "bg-[#ff7a00] text-white border border-[#ff7a00]"
                  : "bg-[#1c1613] border border-[#2a231d] text-[#a89f94] hover:text-white"
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1c1613] border border-[#2a231d] text-[#a89f94] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
