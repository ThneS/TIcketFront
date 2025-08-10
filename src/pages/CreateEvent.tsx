import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createEventSchema, type CreateEventInput, validateEventChronology } from '../schemas/event';
import { useCreateEvent } from '../hooks/useContracts';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 创建活动页面（MVP 单票种版本）
 * TODO:
 *  - 成功后通过事件或返回值获取新 eventId 并跳转详情
 *  - 表单分步化与多票种扩展
 *  - 成功/失败 Toast & 重置
 */
export function CreateEvent() {
  const { createEvent, isPending, isConfirming, isSuccess, error, newEventId } = useCreateEvent();
  const navigate = useNavigate();
  const form = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      description: '',
      venue: '',
      startTime: undefined as any,
      endTime: undefined as any,
      ticketPrice: '0.1',
      maxTickets: 100,
    },
  });

  const onSubmit = async (values: CreateEventInput) => {
    const chronologyError = validateEventChronology(values);
    if (chronologyError) {
      form.setError('endTime', { message: chronologyError });
      return;
    }
    try {
      await createEvent(values);
    } catch (e) {
      // 交由全局日志处理
    }
  };

  // 成功解析到新 eventId 后跳转
  useEffect(() => {
    if (isSuccess && newEventId != null) {
      navigate(`/events/${newEventId.toString()}`);
    }
  }, [isSuccess, newEventId, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">创建活动</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-medium mb-1">活动名称</label>
          <input
            type="text"
            {...form.register('name')}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="例如：Web3 峰会"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">活动描述</label>
          <textarea
            rows={4}
            {...form.register('description')}
            className="w-full border rounded px-3 py-2 resize-y focus:outline-none focus:ring"
            placeholder="介绍活动的亮点、议程等"
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">地点</label>
            <input
              type="text"
              {...form.register('venue')}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
              placeholder="上海国际会议中心"
            />
            {form.formState.errors.venue && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.venue.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">最高票数</label>
            <input
              type="number"
              {...form.register('maxTickets', { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
            {form.formState.errors.maxTickets && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.maxTickets.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">开始时间</label>
            <input
              type="datetime-local"
              onChange={(e) => {
                const v = e.target.value ? new Date(e.target.value) : undefined;
                form.setValue('startTime', v as any, { shouldValidate: true });
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
            {form.formState.errors.startTime && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.startTime.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">结束时间</label>
            <input
              type="datetime-local"
              onChange={(e) => {
                const v = e.target.value ? new Date(e.target.value) : undefined;
                form.setValue('endTime', v as any, { shouldValidate: true });
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
            {form.formState.errors.endTime && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.endTime.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">单张票价 (ETH)</label>
            <input
              type="text"
              {...form.register('ticketPrice')}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
              placeholder="0.1"
            />
            {form.formState.errors.ticketPrice && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.ticketPrice.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded transition-colors"
          >
            {isPending && '等待钱包确认...'}
            {isConfirming && '链上确认中...'}
            {isSuccess && newEventId && '创建成功，跳转中...'}
            {!isPending && !isConfirming && !isSuccess && '创建活动'}
          </button>
          {error && <span className="text-sm text-red-600">{error.message}</span>}
        </div>
      </form>
    </div>
  );
}
