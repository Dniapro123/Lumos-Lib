export interface Shelf {
  id: number;
  name: string;
  shareToken?: string;
  isPublic?: boolean;
  books: import('./book').Book[];
}
