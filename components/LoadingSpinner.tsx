export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center gap-3 p-6">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-[#0b3d91]/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0b3d91] animate-spin"></div>
      </div>
      <div className="text-gray-400">
        <div className="font-medium">Analyzing emails...</div>
        <div className="text-sm text-gray-500">AI is processing your messages</div>
      </div>
    </div>
  );
}
