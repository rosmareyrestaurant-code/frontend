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
    <div className="flex items-center justify-between border-t border-[#F0EDE5] pt-4">
      {totalItems && start && end ? (
        <span className="text-[11px] font-semibold text-[#9A9C90]">
          {start}–{end} من {totalItems}
        </span>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F2EE] text-[#6B7264] transition-colors hover:bg-[#EDEAE1] hover:text-[#333B2E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {pages.map((page, i) =>
          page === "..." ? (
            <span key={i} className="px-1 text-[11px] text-[#B5B2A8]">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page as number)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                currentPage === page
                  ? "bg-[#50604D] text-[#fff]"
                  : "bg-[#F4F2EE] text-[#6B7264] hover:bg-[#EDEAE1] hover:text-[#333B2E]"
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F2EE] text-[#6B7264] transition-colors hover:bg-[#EDEAE1] hover:text-[#333B2E] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
