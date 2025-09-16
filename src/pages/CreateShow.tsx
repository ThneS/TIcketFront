import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createShowSchema,
  type CreateShowInput,
  validateShowChronology,
} from "../schemas/event";
import { useCreateShow } from "../hooks/useContracts";
import { useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import { useNavigate } from "react-router-dom";

/**
 * 创建活动页面（MVP 单票种版本）
 * TODO:
 *  - 成功后通过事件或返回值获取新 eventId 并跳转详情
 *  - 表单分步化与多票种扩展
 *  - 成功/失败 Toast & 重置
 */
export function CreateShow() {
  const { createShow, isPending, isConfirming, isSuccess, error, newShowId } =
    useCreateShow();
  const { isConnected, connect } = useWallet();
  const navigate = useNavigate();
  const form = useForm<CreateShowInput>({
    resolver: zodResolver(createShowSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "",
      startTime: undefined as any,
      endTime: undefined as any,
      ticketPrice: "0.1",
      totalTickets: 100,
      ipfs_cid: "",
    },
  });

  const onSubmit = async (values: CreateShowInput) => {
    console.log("提交创建活动表单", values);
    const chronologyError = validateShowChronology(values);
    if (chronologyError) {
      form.setError("endTime", { message: chronologyError });
      return;
    }
    if (!isConnected) {
      // 未连接钱包时提示并尝试唤起连接
      alert("请先连接钱包再创建演出");
      try {
        await connect?.();
      } catch (_) {
        /* 忽略 */
      }
      return;
    }
    try {
      await createShow(values);
    } catch (e: any) {
      // 显式反馈而不是静默
      alert(e?.message || "创建失败");
    }
  };

  // 确保 RHF 已注册日期字段（避免仅 setValue 时未注册导致的校验行为异常）
  useEffect(() => {
    form.register("startTime");
    form.register("endTime");
  }, [form]);

  // 成功解析到新 eventId 后跳转
  useEffect(() => {
    if (isSuccess && newShowId != null) {
      navigate(`/shows/${newShowId.toString()}`);
    }
  }, [isSuccess, newShowId, navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">创建演出</h1>
      {!isConnected && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          尚未连接钱包，提交时会提示连接。
        </div>
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          // 快速定位表单未通过校验导致 onSubmit 未触发的情况
          console.warn("createShow invalid form", errors);
        })}
        className="space-y-6 max-w-2xl"
      >
        <div>
          <label className="block text-sm font-medium mb-1">活动名称</label>
          <input
            type="text"
            {...form.register("name")}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="例如：Web3 峰会"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">活动描述</label>
          <textarea
            rows={4}
            {...form.register("description")}
            className="w-full border rounded px-3 py-2 resize-y focus:outline-none focus:ring"
            placeholder="介绍活动的亮点、议程等"
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">地点</label>
            <input
              type="text"
              {...form.register("location")}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
              placeholder="上海国际会议中心"
            />
            {form.formState.errors.location && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.location.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">最高票数</label>
            <input
              type="number"
              {...form.register("totalTickets", { valueAsNumber: true })}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
            {form.formState.errors.totalTickets && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.totalTickets.message}
              </p>
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
                form.setValue("startTime", v as any, { shouldValidate: true });
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
            {form.formState.errors.startTime && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.startTime.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">结束时间</label>
            <input
              type="datetime-local"
              onChange={(e) => {
                const v = e.target.value ? new Date(e.target.value) : undefined;
                form.setValue("endTime", v as any, { shouldValidate: true });
              }}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            />
            {form.formState.errors.endTime && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              单张票价 (ETH)
            </label>
            <input
              type="text"
              {...form.register("ticketPrice")}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
              placeholder="0.1"
            />
            {form.formState.errors.ticketPrice && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.ticketPrice.message}
              </p>
            )}
          </div>
        </div>

        {/* IPFS CID 输入（schema 必填，否则会阻断提交） */}
        <div>
          <label className="block text-sm font-medium mb-1">IPFS CID</label>
          <input
            type="text"
            {...form.register("ipfs_cid")}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
            placeholder="例如：bafy... 或 ipfs://..."
          />
          {form.formState.errors.ipfs_cid && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.ipfs_cid.message}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending || isConfirming}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded transition-colors"
          >
            {isPending && "等待钱包确认..."}
            {isConfirming && "链上确认中..."}
            {isSuccess && newShowId && "创建成功，跳转中..."}
            {!isPending && !isConfirming && !isSuccess && "创建演出"}
          </button>
          {error && (
            <span className="text-sm text-red-600">{error.message}</span>
          )}
        </div>
      </form>
    </div>
  );
}
