export interface Chapter {
  id: string;
  filename: string;
  content: string;
  dirty: boolean;
}

export type CompileStatus = "idle" | "compiling" | "error";

export interface ProjectRow {
  id: string;
  name: string;
  createdAt: number;
  deletedAt?: number;
}

export interface ChapterRow {
  id: string;
  projectId: string;
  filename: string;
  content: string;
  updatedAt: number;
}

export interface CompileResult {
  gen: number;
  pdfBytes: Uint8Array;
}
