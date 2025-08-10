import { z } from 'zod';

// Event creation schema (single ticket type MVP)
export const createEventSchema = z.object({
  name: z.string().min(2, '名称至少 2 个字符').max(64, '名称过长'),
  description: z.string().min(10, '描述至少 10 个字符').max(2000, '描述过长'),
  venue: z.string().min(2, '请输入地点').max(128, '地点过长'),
  startTime: z.date({ required_error: '请选择开始时间' }),
  endTime: z.date({ required_error: '请选择结束时间' }),
  ticketPrice: z.string().regex(/^\d+(\.\d{1,6})?$/, '价格格式不正确'),
  maxTickets: z.number().int().positive('数量必须为正整数').max(100000, '数量过大'),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export function validateEventChronology(data: CreateEventInput) {
  if (data.endTime <= data.startTime) {
    return '结束时间必须晚于开始时间';
  }
}
