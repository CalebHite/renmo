import WalletConnect from '@/components/WalletConnect';
import SendPayment from '@/components/SendPayment';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 mx-auto">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#3D95CE] flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-center mb-2">Welcome to GLIDE</h2>
        <p className="text-gray-600 text-center mb-6">Fast, secure payments with XRPL and RLUSD</p>

        <div className="space-y-6">
          <SendPayment />
        </div>
      </div>

      <WalletConnect />
    </div>
  );
}
