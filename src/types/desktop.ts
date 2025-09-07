// Shared types for desktop components
export interface FSNode {
  path: string;
  parent: string;
  name: string;
  type: "file" | "directory" | "symlink";
  createdAt: Date;
  modifiedAt: Date;
  attributes: {
    readOnly: boolean;
    hidden: boolean;
  };
  content?: ArrayBuffer;
  target?: string;
  desktopX?: number;
  desktopY?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface SelectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
}

export interface DragState {
  startPos: Position;
  currentPos: Position;
  offset: Position;
  item: FSNode | null;
}
