'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function WalletButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  const disableLogin = !ready || (ready && authenticated);

  if (!ready) {
    return (
      <div className="bg-gray-200 animate-pulse rounded-lg px-4 py-2 w-32 h-10" />
    );
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">
          <p className="font-medium">
            {user?.email?.address || user?.wallet?.address?.slice(0, 6) + '...' + user?.wallet?.address?.slice(-4)}
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={login}
      disabled={disableLogin}
      className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
    >
      Connect Wallet
    </button>
  );
}