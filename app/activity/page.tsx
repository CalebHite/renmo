'use client';

import { useEffect, useState } from 'react';
import { useXRPL } from '../../hooks/useXRPL';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transaction {
  hash: string;
  type: string;
  amount: any;
  destination: string;
  date: Date;
  status: string;
}

export default function ActivityPage() {
  const { getTransactionHistory, walletAddress } = useXRPL();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const txHistory = await getTransactionHistory();
        setTransactions(txHistory);
      } catch (err) {
        setError('Failed to load transaction history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (walletAddress) {
      fetchTransactions();
    }
  }, [walletAddress, getTransactionHistory]);

  if (!walletAddress) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please connect your wallet to view transaction history</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>
      
      {transactions.length === 0 ? (
        <Alert>
          <AlertDescription>No transactions found</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <Card key={tx.hash} className="border-none bg-slate-50">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {tx.type === 'Payment' ? 'Payment' : tx.type}
                      </span>
                      {tx.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      To: {tx.destination}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDistanceToNow(tx.date, { addSuffix: true })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                        {tx.amount}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-[150px]">
                      {tx.hash}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 