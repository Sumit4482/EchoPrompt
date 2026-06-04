import { apiService } from '@/services/api';

export type ProductEventType =
  | 'prompt_copied'
  | 'template_used'
  | 'prompt_saved';

/** Fire-and-forget product funnel events (optional auth). */
export function trackProductEvent(
  eventType: ProductEventType,
  metadata?: Record<string, unknown>,
): void {
  apiService.trackProductEvent(eventType, metadata).catch(() => {});
}
