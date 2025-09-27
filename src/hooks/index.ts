export {
  useWallet,
  useIsWalletConnected,
  useWalletAddress,
  useWalletBalance,
  useWalletChain,
  useIsAddress,
  useFormattedAddress,
  useDisplayName,
  type WalletState,
  type WalletActions,
  type UseWalletReturn,
} from "./useWallet";

// Shows (formerly Events) hooks
export {
  useGetAllShows,
  useGetShow,
  useCreateShow,
  useMintTicket,
  useTransferTicket,
  type Show,
} from "./useContracts";

// Backend API hooks (REST)
export { useBackendShow, useBackendShows } from "./useBackendShows";
export { useShowData, useShowsData } from "./useShowData";
