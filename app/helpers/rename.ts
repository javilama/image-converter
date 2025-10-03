// helpers/rename.ts
export type RenameParams = {
  prefix?: string; // opcional, por ejemplo "img_"
  name?: string;   // opcional, nombre base
  type: "counter" | "hash" | "timestamp"; // obligatorio
};
