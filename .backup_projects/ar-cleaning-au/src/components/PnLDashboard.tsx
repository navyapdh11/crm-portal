'use client';

import { useEffect, useState } from 'react';
import { getPlatformPnL, getCleanerEarnings, getConnectBalance } from '@/lib/actions/connect';

interface PnLData {
  totalRevenue: number;
  totalPayouts: number;
  totalFees: number;
  netProfit: number;
  totalBookings: number;
  profitMargin: string;
  breakdown: any[];
}

interface EarningsData {
  totalEarnings: number;
  totalPayouts: number;
  pendingEarnings: number;
  totalJobs: number;
  breakdown: any[];
}

interface BalanceData {
  available: number;
  pending: number;
  currencies: { currency: string; amount: number }[];
}

export default function PnLDashboard({ role = 'admin' }: { role?: 'admin' | 'cleaner' }) {
  const [pnl, setPnl] = useState<PnLData | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (role === 'admin') {
        const [pnlData, balanceData] = await Promise.all([
          getPlatformPnL('month'),
          getConnectBalance(),
        ]);
        if (!pnlData.error) setPnl(pnlData as any);
        if (!balanceData.error) setBalance(balanceData as any);
      } else {
        const earningsData = await getCleanerEarnings('cleaner-id-here', 'month');
        if (!earningsData.error) setEarnings(earningsData as any);
      }
      setLoading(false);
    };

    fetchData();
  }, [role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          {role === 'admin' ? 'Platform P&L Dashboard' : 'My Earnings'}
        </h1>

        {role === 'admin' && pnl && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-green-50 to-green-100">
                <p className="text-sm text-green-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">${pnl.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                <p className="text-sm text-blue-600 mb-1">Total Payouts</p>
                <p className="text-3xl font-bold text-blue-900">${pnl.totalPayouts.toFixed(2)}</p>
              </div>
              <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
                <p className="text-sm text-purple-600 mb-1">Net Profit</p>
                <p className="text-3xl font-bold text-purple-900">${pnl.netProfit.toFixed(2)}</p>
              </div>
              <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
                <p className="text-sm text-yellow-600 mb-1">Profit Margin</p>
                <p className="text-3xl font-bold text-yellow-900">{pnl.profitMargin}%</p>
              </div>
            </div>

            {/* Balance */}
            {balance && (
              <div className="card mb-8">
                <h2 className="text-xl font-semibold mb-4">Stripe Balance</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-600">Available</p>
                    <p className="text-2xl font-bold text-green-900">${balance.available.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-xl">
                    <p className="text-sm text-yellow-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-900">${balance.pending.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Breakdown */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Monthly Breakdown</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Period</th>
                      <th className="text-right py-3 px-4">Revenue</th>
                      <th className="text-right py-3 px-4">Payouts</th>
                      <th className="text-right py-3 px-4">Fees</th>
                      <th className="text-right py-3 px-4">Profit</th>
                      <th className="text-right py-3 px-4">Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pnl.breakdown?.map((row: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(row.period_start).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="text-right py-3 px-4">${Number(row.total_revenue).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">${Number(row.total_payouts).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">${Number(row.total_fees).toFixed(2)}</td>
                        <td className="text-right py-3 px-4 text-green-600 font-semibold">
                          ${Number(row.net_profit).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4">{row.booking_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {role === 'cleaner' && earnings && (
          <>
            {/* Earnings Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-green-50 to-green-100">
                <p className="text-sm text-green-600 mb-1">Total Earnings</p>
                <p className="text-3xl font-bold text-green-900">${earnings.totalEarnings.toFixed(2)}</p>
              </div>
              <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                <p className="text-sm text-blue-600 mb-1">Paid Out</p>
                <p className="text-3xl font-bold text-blue-900">${earnings.totalPayouts.toFixed(2)}</p>
              </div>
              <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
                <p className="text-sm text-yellow-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-900">${earnings.pendingEarnings.toFixed(2)}</p>
              </div>
            </div>

            {/* Jobs Count */}
            <div className="card mb-8">
              <h2 className="text-xl font-semibold mb-4">Jobs Completed</h2>
              <p className="text-4xl font-bold text-primary-600">{earnings.totalJobs}</p>
            </div>

            {/* Monthly Breakdown */}
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Monthly Earnings</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Period</th>
                      <th className="text-right py-3 px-4">Earnings</th>
                      <th className="text-right py-3 px-4">Payouts</th>
                      <th className="text-right py-3 px-4">Jobs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.breakdown?.map((row: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(row.period_start).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="text-right py-3 px-4 text-green-600 font-semibold">
                          ${Number(row.total_earnings).toFixed(2)}
                        </td>
                        <td className="text-right py-3 px-4">${Number(row.total_payouts).toFixed(2)}</td>
                        <td className="text-right py-3 px-4">{row.job_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
