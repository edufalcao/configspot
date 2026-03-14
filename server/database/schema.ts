export interface Comparison {
  id: string,
  left_content: string,
  right_content: string,
  format: string,
  filters: string | null,
  created_at: number,
  expires_at: number | null,
  view_count: number,
  delete_token: string
}
