import { Client, Wallet, Payment } from 'xrpl';
import { PinataService } from './pinata';

const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';
const WALLET_STORAGE_KEY = 'renmo_wallets';

// rLUSD configuration
const RLUSD_CURRENCY = 'USD';
const RLUSD_ISSUER = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'; // Testnet issuer

interface TrustLine {
  account: string;
  balance: string;
  currency: string;
  limit: string;
  limit_peer: string;
  quality_in: number;
  quality_out: number;
}

interface StoredWallet {
  seed: string;
  address: string;
  name?: string;
}

export class XRPLService {
  private client: Client;
  private wallet: Wallet | null = null;
  private isConnected: boolean = false;
  private wallets: StoredWallet[] = [];
  private pinataService: PinataService;

  constructor() {
    this.client = new Client(TESTNET_URL);
    this.pinataService = PinataService.getInstance();
    this.loadWallets();
    this.autoConnect();
  }

  private async autoConnect() {
    try {
      await this.connect();
      if (this.wallets.length > 0) {
        this.wallet = Wallet.fromSeed(this.wallets[0].seed);
        await this.getBalance();
      }
    } catch (error) {
      console.error('Error in auto-connect:', error);
    }
  }

  private async loadWallets() {
    if (typeof window !== 'undefined') {
      const storedWallets = localStorage.getItem(WALLET_STORAGE_KEY);
      if (storedWallets) {
        try {
          this.wallets = JSON.parse(storedWallets);
          if (this.wallets.length > 0) {
            this.wallet = Wallet.fromSeed(this.wallets[0].seed);
            // Load metadata for all wallets
            await Promise.all(this.wallets.map(async (wallet) => {
              const metadata = await this.pinataService.getAccountMetadata(wallet.address);
              if (metadata) {
                wallet.name = metadata.name;
              }
            }));
          }
        } catch (error) {
          console.error('Error loading wallets from storage:', error);
          localStorage.removeItem(WALLET_STORAGE_KEY);
        }
      }
    }
  }

  private saveWallets() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(this.wallets));
    }
  }

  getWallets() {
    return this.wallets;
  }

  async switchWallet(address: string) {
    const walletData = this.wallets.find(w => w.address === address);
    if (!walletData) {
      throw new Error('Wallet not found');
    }
    
    this.wallet = Wallet.fromSeed(walletData.seed);
    if (!this.isConnected) {
      await this.connect();
    }

    // Update last used timestamp in metadata
    await this.pinataService.updateAccountMetadata(address, {
      lastUsed: new Date().toISOString()
    });

    await this.getBalance();
  }

  async addWallet(name?: string, secretKey?: string): Promise<StoredWallet> {
    if (!this.isConnected) {
      await this.connect();
    }

    let newWallet: Wallet;
    if (secretKey) {
      try {
        newWallet = Wallet.fromSeed(secretKey);
        // Check if wallet already exists
        const existingWallet = this.wallets.find(w => w.address === newWallet.address);
        if (existingWallet) {
          throw new Error('This account is already imported');
        }
      } catch (error) {
        if (error instanceof Error && error.message === 'This account is already imported') {
          throw error;
        }
        throw new Error('Invalid secret key');
      }
    } else {
      newWallet = Wallet.generate();
    }

    const walletData: StoredWallet = {
      seed: secretKey || newWallet.seed!,
      address: newWallet.address,
      name: name || `Account ${this.wallets.length + 1}`
    };

    // Save metadata to Pinata
    await this.pinataService.saveAccountMetadata(walletData.address, {
      name: walletData.name,
      address: walletData.address,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    });

    this.wallets.push(walletData);
    this.saveWallets();
    this.wallet = newWallet;

    // Only fund the wallet if it's newly generated
    if (!secretKey) {
      console.log('Funding new wallet...');
      await this.fundWallet();
      console.log('Waiting for funding to complete...');
      await this.waitForFunding();
    }

    return walletData;
  }

  async removeWallet(address: string) {
    const index = this.wallets.findIndex(w => w.address === address);
    if (index === -1) {
      throw new Error('Wallet not found');
    }

    this.wallets.splice(index, 1);
    this.saveWallets();

    if (this.wallet?.address === address) {
      this.wallet = this.wallets.length > 0 ? 
        Wallet.fromSeed(this.wallets[0].seed) : 
        null;
    }
  }

  async connect() {
    if (this.isConnected) {
      return;
    }

    try {
      await this.client.connect();
      this.isConnected = true;
      console.log('Connected to XRPL Testnet');
    } catch (error) {
      console.error('Error connecting to XRPL:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        console.log('Disconnected from XRPL Testnet');
      }
    } catch (error) {
      console.error('Error disconnecting from XRPL:', error);
      throw error;
    }
  }

  private async waitForFunding(maxAttempts = 20) {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.client.request({
          command: 'account_info',
          account: this.wallet.address,
          ledger_index: 'validated',
        });
        
        if (response.result.account_data.Balance) {
          console.log('Wallet funded successfully');
          return true;
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('Account not found')) {
          console.log(`Waiting for funding... Attempt ${i + 1}/${maxAttempts}`);
        } else {
          console.error('Error checking account:', error);
          throw error;
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Increased wait time to 3 seconds
    }
    
    throw new Error('Wallet funding timed out. Please try again in a few minutes.');
  }

  async generateWallet() {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      let wallet: Wallet;
      let isNewWallet = false;
      
      if (this.wallet) {
        wallet = this.wallet;
      } else {
        wallet = Wallet.generate();
        this.wallet = wallet;
        this.saveWallets();
        isNewWallet = true;
      }

      // Fund the wallet if it's new
      if (isNewWallet) {
        console.log('Funding new wallet...');
        await this.fundWallet();
        console.log('Waiting for funding to complete...');
        await this.waitForFunding();
      }

      return wallet;
    } catch (error) {
      console.error('Error generating wallet:', error);
      throw error;
    }
  }

  async fundWallet() {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }

    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const response = await this.client.fundWallet(this.wallet);
      console.log('Funding request sent:', response);
      return response;
    } catch (error) {
      console.error('Error funding wallet:', error);
      throw error;
    }
  }

  async sendPayment(destination: string, amount: string): Promise<any> {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }

    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const payment: Payment = {
        TransactionType: 'Payment',
        Account: this.wallet.address,
        Amount: {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: amount
        },
        Destination: destination,
      };

      // Get the current ledger index
      const ledgerResponse = await this.client.request({
        command: 'ledger',
        ledger_index: 'validated',
      });
      const currentLedgerIndex = ledgerResponse.result.ledger_index;

      // Prepare the transaction with a LastLedgerSequence that gives us more time
      const prepared = await this.client.autofill(payment);
      prepared.LastLedgerSequence = currentLedgerIndex + 10; // Give us 10 ledgers to submit

      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      return result;
    } catch (error) {
      console.error('Error sending payment:', error);
      
      // If the error is due to LastLedgerSequence, retry once
      if (error instanceof Error && error.message.includes('LastLedgerSequence')) {
        console.log('Retrying payment with updated LastLedgerSequence...');
        return this.sendPayment(destination, amount);
      }
      
      throw error;
    }
  }

  async getBalance() {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }

    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const response = await this.client.request({
        command: 'account_lines',
        account: this.wallet.address,
        ledger_index: 'validated',
      });

      // Find the rLUSD trustline
      const rlusdLine = response.result.lines.find(
        (line: TrustLine) => line.currency === RLUSD_CURRENCY && line.account === RLUSD_ISSUER
      );

      return rlusdLine ? rlusdLine.balance : '0';
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Add method to create trustline for rLUSD
  async setupTrustline() {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const trustSetTx = {
        TransactionType: 'TrustSet',
        Account: this.wallet.address,
        LimitAmount: {
          currency: RLUSD_CURRENCY,
          issuer: RLUSD_ISSUER,
          value: '1000000000' // Set a high limit
        }
      };

      const prepared = await this.client.autofill(trustSetTx);
      const signed = this.wallet.sign(prepared);
      const result = await this.client.submitAndWait(signed.tx_blob);

      return result;
    } catch (error) {
      console.error('Error setting up trustline:', error);
      throw error;
    }
  }

  getWalletAddress() {
    return this.wallet?.address || null;
  }

  getSecretKey(address: string): string | null {
    const wallet = this.wallets.find(w => w.address === address);
    return wallet?.seed || null;
  }

  async getTransactionHistory(limit: number = 20) {
    if (!this.wallet) {
      throw new Error('No wallet connected');
    }

    if (!this.isConnected) {
      await this.connect();
    }

    try {
      const response = await this.client.request({
        command: 'account_tx',
        account: this.wallet.address,
        limit: limit,
        ledger_index_min: -1,
        ledger_index_max: -1,
        forward: false
      });

      return response.result.transactions.map((tx: any) => ({
        hash: tx.tx.hash,
        type: tx.tx.TransactionType,
        amount: tx.tx.Amount,
        destination: tx.tx.Destination,
        date: new Date(tx.tx.date * 1000),
        status: tx.meta.TransactionResult === 'tesSUCCESS' ? 'success' : 'failed'
      }));
    } catch (error) {
      console.error('Error getting transaction history:', error);
      throw error;
    }
  }
} 