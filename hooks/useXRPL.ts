'use client';

import { create } from 'zustand';
import { XRPLService } from '../lib/xrpl';

interface XRPLState {
  xrplService: XRPLService | null;
  isConnected: boolean;
  walletAddress: string | null;
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  addWallet: (name?: string, secretKey?: string) => Promise<void>;
  switchWallet: (address: string) => Promise<void>;
  removeWallet: (address: string) => Promise<void>;
  getWallets: () => { seed: string; address: string; name?: string }[];
  sendPayment: (destination: string, amount: string) => Promise<void>;
  getBalance: () => Promise<void>;
  getSecretKey: (address: string) => string | null;
  getTransactionHistory: (limit?: number) => Promise<{
    hash: string;
    type: string;
    amount: any;
    destination: string;
    date: Date;
    status: string;
  }[]>;
}

export const useXRPL = create<XRPLState>((set, get) => ({
  xrplService: null,
  isConnected: false,
  walletAddress: null,
  balance: null,

  connect: async () => {
    const service = new XRPLService();
    await service.connect();
    const walletAddress = service.getWalletAddress();
    set({ xrplService: service, isConnected: true, walletAddress });
    if (walletAddress) {
      await get().getBalance();
    }
  },

  disconnect: async () => {
    const { xrplService } = get();
    if (xrplService) {
      await xrplService.disconnect();
      set({ xrplService: null, isConnected: false, walletAddress: null, balance: null });
    }
  },

  addWallet: async (name?: string, secretKey?: string) => {
    const { xrplService } = get();
    if (!xrplService) {
      throw new Error('XRPL service not connected');
    }

    const wallet = await xrplService.addWallet(name, secretKey);
    set({ walletAddress: wallet.address });
    await get().getBalance();
  },

  switchWallet: async (address: string) => {
    const { xrplService } = get();
    if (!xrplService) {
      throw new Error('XRPL service not connected');
    }

    await xrplService.switchWallet(address);
    set({ walletAddress: address });
    await get().getBalance();
  },

  removeWallet: async (address: string) => {
    const { xrplService } = get();
    if (!xrplService) {
      throw new Error('XRPL service not connected');
    }

    await xrplService.removeWallet(address);
    const newAddress = xrplService.getWalletAddress();
    set({ walletAddress: newAddress });
    if (newAddress) {
      await get().getBalance();
    }
  },

  getWallets: () => {
    const { xrplService } = get();
    if (!xrplService) {
      return [];
    }
    return xrplService.getWallets();
  },

  sendPayment: async (destination: string, amount: string) => {
    const { xrplService } = get();
    if (!xrplService) {
      throw new Error('XRPL service not connected');
    }

    await xrplService.sendPayment(destination, amount);
    await get().getBalance();
  },

  getBalance: async () => {
    const { xrplService } = get();
    if (!xrplService) {
      throw new Error('XRPL service not connected');
    }

    const balance = await xrplService.getBalance();
    set({ balance });
  },

  getSecretKey: (address: string) => {
    const { xrplService } = get();
    if (!xrplService) {
      return null;
    }
    return xrplService.getSecretKey(address);
  },

  getTransactionHistory: async (limit?: number) => {
    const { xrplService } = get();
    if (!xrplService) {
      throw new Error('XRPL service not connected');
    }
    return xrplService.getTransactionHistory(limit);
  }
})); 