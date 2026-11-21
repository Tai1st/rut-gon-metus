"use client";

import type { ReactNode } from "react";

/** Thành phần giao diện dùng chung, theo style guide: sáng, viền mảnh, nút xanh. */

export const inputCls =
  "bg-white border border-gray-200 py-2 px-3 rounded-md text-sm w-full outline-none focus:border-blue-300 disabled:opacity-60";

export const btnPrimary =
  "px-4 py-2 text-sm font-medium rounded-md shadow-sm transition-colors bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none";

export const btnGhost =
  "px-3 py-1.5 text-xs font-medium rounded-md border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40";

export const btnDanger = "text-xs text-red-500 hover:text-red-600 disabled:opacity-40";

export function Card({ title, right, children }: { title?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
      {title && (
        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-gray-600 uppercase">{title}</h2>
          {right}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium text-gray-500 block mb-1">{children}</label>;
}

const BADGE = {
  green: "text-green-700 bg-green-50 border-green-200",
  blue: "text-blue-600 bg-blue-50 border-blue-200",
  amber: "text-amber-700 bg-amber-50 border-amber-200",
  gray: "text-gray-500 bg-gray-50 border-gray-200",
  red: "text-red-600 bg-red-50 border-red-200",
} as const;

export function Badge({ tone = "gray", children }: { tone?: keyof typeof BADGE; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium border rounded-full px-2 py-0.5 ${BADGE[tone]}`}>
      {children}
    </span>
  );
}

export function ErrorBox({ message }: { message: string }) {
  if (!message) return null;
  return <div className="text-xs bg-red-50 p-2.5 rounded-md border border-red-200 text-red-600">{message}</div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
            ×
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
