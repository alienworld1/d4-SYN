import { 
  NitroliteClient, 
  WalletStateSigner,
  createECDSAMessageSigner,
  createAuthRequestMessage,
  createAuthVerifyMessageFromChallenge,
  createCreateChannelMessage,
  createCloseChannelMessage,
  createTransferMessage,
  createGetLedgerBalancesMessage,
  createEIP712AuthMessageSigner,
  createGetConfigMessage,
  createGetAssetsMessage
} from '@erc7824/nitrolite';
import { createWalletClient, createPublicClient, http, PrivateKeyAccount as ViemPrivateKeyAccount, hexToBigInt, Account, WalletClient, Transport, Chain, ParseAccount } from 'viem';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { YELLOW_RPC_URL, YELLOW_ADDRESSES, MOCK_YELLOW, USDC_SEPOLIA_ADDRESS } from './constants';

const SLA_CONFIG = {
  SLA_TARGET_MS: 100,
  SLA_PENALTY_STEP_MS: 50,
  SLA_PENALTY_PERCENT: 0.10,
  SLA_HARD_CAP_MS: 500,
};

// Types
export type YellowStatus = 'disconnected' | 'connecting' | 'connected' | 'active' | 'settling' | 'error';

export interface YellowState {
  status: YellowStatus;
  balance: bigint; // In wei units (or whatever the token decimals are)
  channelId: string | null;
  provider: string | null;
  address: string | null;
}

export interface YellowSLAStats {
  lastChunkTime: number;
  averageLatency: number;
  penaltyCount: number;
  totalSavings: number;
}

export class YellowClient {
  private ws: WebSocket | null = null;
  public client: NitroliteClient;
  private account: ViemPrivateKeyAccount;
  private sessionAccount: ViemPrivateKeyAccount | null = null;
  private signer: WalletStateSigner;
  private messageSigner: any; // Type is inferred from createECDSAMessageSigner
  private walletClient: WalletClient<Transport, Chain, Account>;
  
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: (data: any) => void; reject: (err: any) => void; }>();
  
  private currentAuthParams: any = null;

  // State observable pattern - supports multiple listeners
  private listeners: ((state: YellowState) => void)[] = [];
  public eventBus = new EventTarget();
  
  private internalState: YellowState = {
    status: 'disconnected',
    balance: BigInt(0),
    channelId: null,
    provider: null,
    address: null
  };

  private slaStats: YellowSLAStats = {
    lastChunkTime: 0,
    averageLatency: 0,
    penaltyCount: 0,
    totalSavings: 0
  };

  constructor(privateKey: string) {
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    this.account = privateKeyToAccount(formattedKey as `0x${string}`);
    
    // Initialize address in state
    this.internalState.address = this.account.address;
    
    // Setup Viem clients
    const publicClient = createPublicClient({ 
      chain: sepolia, 
      transport: http() 
    });
    
    const walletClient = createWalletClient({ 
      account: this.account, 
      chain: sepolia, 
      transport: http() 
    });
    
    this.walletClient = walletClient;

    this.signer = new WalletStateSigner(walletClient);
    this.messageSigner = createECDSAMessageSigner(formattedKey as `0x${string}`);
    
    this.client = new NitroliteClient({
      publicClient,
      walletClient,
      stateSigner: this.signer,
      addresses: {
        custody: YELLOW_ADDRESSES.custody as `0x${string}`,
        adjudicator: YELLOW_ADDRESSES.adjudicator as `0x${string}`
      },
      chainId: sepolia.id,
      challengeDuration: BigInt(3600),
    });
  }

  public subscribe(callback: (state: YellowState) => void): () => void {
    this.listeners.push(callback);
    // Send immediate update
    callback(this.internalState);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private setState(updates: Partial<YellowState>) {
    this.internalState = { ...this.internalState, ...updates };
    this.listeners.forEach(listener => listener(this.internalState));
  }

  public getState(): YellowState {
    return this.internalState;
  }

  public getTelemetry(): YellowSLAStats {
    return { ...this.slaStats };
  }

  public async init() {
    // Prevent overlapping connections
    if (this.internalState.status === 'connecting' || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
        console.log('[YELLOW] Init skipped - already connecting or connected');
        return;
    }

    // MOCK MODE Disabled for Real Implementation
    /*
    if (MOCK_YELLOW) {
      console.log('[YELLOW] MOCK MODE ACTIVATED');
      setTimeout(() => this.setState({ status: 'connected' }), 500);
      return;
    }
    */

    this.setState({ status: 'connecting' });

    try {
      this.ws = new WebSocket(YELLOW_RPC_URL);

      this.ws.onopen = async () => {
        console.log('[YELLOW] WS Connected');
        await this.authenticate();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onclose = () => {
        console.log('[YELLOW] WS Closed');
        this.setState({ status: 'disconnected', channelId: null });
        
        // Automatic Reconnection
        console.log('[YELLOW] Connection lost. Reconnecting in 3s...');
        setTimeout(() => this.init(), 3000);
      };

      this.ws.onerror = (err) => {
        console.error('[YELLOW] WS Error', err);
        this.setState({ status: 'error' });
      };

    } catch (err) {
      console.error('[YELLOW] Init Error', err);
      this.setState({ status: 'error' });
    }
  }

  private async request(creator: (id: number) => Promise<string>): Promise<any> {
    const id = ++this.requestId;
    const msg = await creator(id);
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.send(msg);
      
      // Timeout after 30s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${id} timed out`));
        }
      }, 30000);
    });
  }

  private async authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      // Generate Ephemeral Session Key
      const sessionPrivKey = generatePrivateKey();
      this.sessionAccount = privateKeyToAccount(sessionPrivKey);
      
      // Update Message Signer to use Session Key
      this.messageSigner = createECDSAMessageSigner(sessionPrivKey);
      console.log(`[YELLOW] Generated New Session Key: ${this.sessionAccount.address}`);
      
      this.currentAuthParams = {
        address: this.account.address,
        session_key: this.sessionAccount.address,
        application: typeof window !== 'undefined' ? window.location.host : 'd4-syn-bot',
        allowances: [{asset: 'ytest.usd', amount: '1000000000'}],
        expires_at: BigInt(Math.floor(Date.now() / 1000) + 24 * 60 * 60), 
        scope: 'app'
      };

      // @ts-ignore
      const authReq = await createAuthRequestMessage(this.currentAuthParams);
      
      console.warn('[YELLOW] Sending Auth Request:', authReq);
      this.send(authReq); 
    } catch (err) {
      console.error('[YELLOW] Auth Failed', err);
      this.setState({ status: 'error' });
    }
  }

  private handleMessage(data: any) {
    if (typeof data !== 'string') return; 
    
    try {
      const msg = JSON.parse(data);
      console.log('[YELLOW] Recv:', JSON.stringify(msg).substring(0, 200) + '...'); // Verbose logging for debugging

      // Unwrap Envelope
      const payload = msg.res || msg.req;
      
      // 1. Handle Response (res)
      if (msg.res && Array.isArray(msg.res)) {
        const [id, method, result] = msg.res; 
        
        // Resolve pending request
        if (this.pendingRequests.has(id)) {
          const { resolve, reject } = this.pendingRequests.get(id)!;
          this.pendingRequests.delete(id);
          
          if (method === 'error') {
            const errorMsg = result && result.error ? result.error : JSON.stringify(result);
            console.warn(`[YELLOW] RPC Error for Req ${id}:`, errorMsg);
            reject(new Error(errorMsg));
          } else {
            resolve(result);
          }
          return;
        }
      }

      // 2. Handle Request/Notification (req) or Unwrapped
      const target = payload || msg; // Fallback
      if (!Array.isArray(target)) return;
      
      const method = target[1];

      // Auth Challenge
      if (method === 'auth_challenge') {
        console.warn('[YELLOW] Received Auth Challenge:', JSON.stringify(target));
        this.handleAuthChallenge(target);
        return;
      }

    } catch (e) {
      console.error('[YELLOW] Parse Error', e);
    }
  }

  private async handleAuthChallenge(msg: any[]) {
    // msg = [id, 'auth_challenge', { challenge_message: '...' }, timestamp]
    const params = msg[2];
    const challenge = params?.challenge_message || params?.challenge;
    
    console.warn('[YELLOW] Extracted Challenge:', challenge);

    if (!challenge) {
        console.error('[YELLOW] No challenge found in params', params);
        return;
    }

    try {
        // Must wait for server to verify before querying data

        // Custom EIP-712 Signer to handle potential SDK vs Contract Version Mismatch (v0.5 SDK vs v0.3 Contract)
        const customSigner = async (payload: any) => {
             const method = payload[1];
             if (method !== 'auth_verify') throw new Error('Signer only for auth_verify');
             
             const params = payload[2]; // { challenge: '...' }
             const challengeUUID = params.challenge;
             
             // The v0.3.0 contract likely uses the v0.3.0 Policy structure.
             // Hypothesis 1: 'expires_at' might be 'uint256'
             // Hypothesis 2: 'scope' vs 'application'
             
             // Let's first try exact SDK types but ensure we have full control
             // Using specs from yellow-authentication.md
             
             // "domain": {"name": "<application_name>"}
             const domain = {
                name: this.currentAuthParams.application
             };

             // Policy struct as per docs (no 'application' field, uint64 expires_at)
             const types = {
                Policy: [
                    { name: 'challenge', type: 'string' },
                    { name: 'scope', type: 'string' },
                    { name: 'wallet', type: 'address' },
                    { name: 'session_key', type: 'address' },
                    { name: 'expires_at', type: 'uint64' }, 
                    { name: 'allowances', type: 'Allowance[]' },
                ],
                Allowance: [
                    { name: 'asset', type: 'string' },
                    { name: 'amount', type: 'string' },
                ],
             };

             const message = {
                challenge: challengeUUID,
                scope: this.currentAuthParams.scope,
                wallet: this.walletClient.account!.address,
                session_key: this.currentAuthParams.session_key,
                expires_at: this.currentAuthParams.expires_at,
                allowances: this.currentAuthParams.allowances
             };

             console.log('[YELLOW Debug] Signing Typed Data:', { domain, types, message });

             return await this.walletClient.signTypedData({
                account: this.walletClient.account!,
                domain,
                types,
                primaryType: 'Policy',
                message
             });
        };

        const authResponse = await this.request((id) => createAuthVerifyMessageFromChallenge(customSigner, challenge, id));
        
        console.log('[YELLOW] Auth Verify Response:', authResponse);

        if (authResponse && typeof authResponse === 'object' && (authResponse as any).error) {
             console.error('[YELLOW] Auth Failed (Server Rejected):', (authResponse as any).error);
             return;
        }
        
        console.log('[YELLOW] Auth Verified by Server');
        
        // Short delay to ensure session propagation on Clearnode
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Fetch initial balance after successful auth
        await this.refreshBalance();
        
        this.setState({ status: 'connected' });
    } catch (err: any) {
        console.error('[YELLOW] Auth Sign Failed', err);
        // Retry logic for expired sessions or collisions
        if (err.message && (err.message.includes('session key already exists') || err.message.includes('expired'))) {
            console.warn('[YELLOW] Session Key Rejected. Retrying with fresh key in 1s...');
            setTimeout(() => this.authenticate(), 1000);
        }
    }
  }

  public async refreshBalance() {
    try {
        // Fetch balances from Clearnode
        const msg = await createGetLedgerBalancesMessage(this.messageSigner);
        
        // We can't easily wait for the specific response in this fire-and-forget architecture 
        // without the ID correlation working perfectly for all message types.
        // For now, we will send and handle the response in handleMessage if possible, 
        // OR we just use the request() method if we want to wait.
        
        // Let's use request() pattern for this query
        const res = await this.request((id) => createGetLedgerBalancesMessage(this.messageSigner, undefined, id));
        
        // Response format: { balances: { 'chainId:token': 'amount' } } or similar?
        // Checking SDK types for GetLedgerBalancesResponse...
        // Assuming array or map.
        console.log('[YELLOW] Balances:', res);
        
        // Find our token
        const assetId = 'ytest.usd';
        
        let balances: any[] = [];
        if (Array.isArray(res)) {
            balances = res;
        } else if (res && typeof res === 'object' && Array.isArray((res as any).ledger_balances)) {
            balances = (res as any).ledger_balances;
        }

        const tokenBal = balances.find((b: any) => b.asset?.toLowerCase() === assetId.toLowerCase());
        if (tokenBal) {
            this.setState({ balance: BigInt(tokenBal.amount) });
        }

    } catch (err) {
        console.warn('[YELLOW] Failed to fetch balance', err);
    }
  }

  private send(msg: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (typeof msg === 'string') {
        this.ws.send(msg);
        return;
      }
      
      const payload = JSON.stringify(msg, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
      
      this.ws.send(payload);
    }
  }

  // --- Core Actions ---

  private async fetchRPCCall(creator: () => Promise<string>, name: string): Promise<any> {
    try {
        console.log(`[YELLOW] Requesting ${name}...`);
        const msgStr = await creator();
        
        let msg: any;
        try {
            msg = JSON.parse(msgStr);
        } catch (e) {
            msg = msgStr;
        }
        
        const req = msg.req || msg;
        const id = Array.isArray(req) ? req[0] : null; 
        
        if (id === null || id === undefined) {
             console.warn(`[YELLOW] Could not extract ID from ${name} message`);
             this.send(msg);
             return null;
        }

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { 
                resolve: (res) => {
                    // Extract data from response structure if needed
                    // Usually payload is in res[2]
                    resolve(res);
                }, 
                reject 
            });
            this.send(msg);
            
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    console.warn(`[YELLOW] ${name} timed out`);
                    resolve(null); 
                }
            }, 5000);
        });
    } catch (err) {
        console.warn(`[YELLOW] Error preparing ${name} message`, err);
        return null;
    }
  }

  private async waitForConnection(timeoutMs = 15000): Promise<void> {
    if (this.internalState.status === 'connected') return;
    
    // If completely dead, trigger init
    if (this.internalState.status === 'disconnected' || this.internalState.status === 'error') {
        this.init();
    }

    return new Promise((resolve, reject) => {
        let unsubscribe: () => void;
        
        const timeout = setTimeout(() => {
            if (unsubscribe) unsubscribe();
            reject(new Error(`Connection timeout after ${timeoutMs}ms. Status: ${this.internalState.status}`));
        }, timeoutMs);

        unsubscribe = this.subscribe((state) => {
            if (state.status === 'connected') {
                clearTimeout(timeout);
                unsubscribe();
                resolve();
            }
        });
    });
  }

  public async openChannel(providerAddress: string) {
    // Ensure we are connected before proceeding
    if (this.internalState.status !== 'connected') {
        console.warn("[YELLOW] Client not connected, waiting for connection...");
        try {
            await this.waitForConnection();
        } catch (e) {
            console.error("[YELLOW] Failed to establish connection for openChannel", e);
            throw e;
        }
    }

    try {
        console.log(`[YELLOW] Discovering Assets...`);
        
        let tokenAddress = '0xDB9F293e3898c9E5536A3be1b0C56c89d2b32DEb'; // Updated Default fallback from logs
        const chainId = sepolia.id;
        
        // 1. Fetch Assets using get_assets
        try {
            // Retrieve all assets (pass undefined for chainId to get all, or chainId to filter)
            // Using a lambda to delay execution until needed
            const assetsRes: any = await this.fetchRPCCall(
                () => createGetAssetsMessage(this.messageSigner), 
                'Assets'
            );

            if (assetsRes) {
                 console.log('[YELLOW] Raw Assets Response:', JSON.stringify(assetsRes).substring(0, 500));
                 
                 let assetsList: any[] = [];
                 
                 // Case 1: Result is { assets: [...] } (Standard handled response where fetchRPCCall unwraps it)
                 if (assetsRes && typeof assetsRes === 'object' && 'assets' in assetsRes && Array.isArray(assetsRes.assets)) {
                     assetsList = assetsRes.assets;
                 }
                 // Case 2: Result is direct array [...]
                 else if (Array.isArray(assetsRes)) {
                     // Check if it looks like a raw envelope [id, method, payload, ...]
                     // This happens if fetchRPCCall didn't unwrap correctly or handleMessage logic varied
                     if (assetsRes.length >= 3 && typeof assetsRes[0] === 'number' && typeof assetsRes[1] === 'string') {
                         const payload = assetsRes[2];
                          if (payload && typeof payload === 'object' && 'assets' in payload && Array.isArray((payload as any).assets)) {
                             assetsList = (payload as any).assets;
                         } else if (Array.isArray(payload)) {
                             assetsList = payload;
                         }
                     } else {
                         // Assume it's the assets list itself
                         assetsList = assetsRes;
                     }
                 }
                 
                 if (assetsList.length > 0) {
                     console.log(`[YELLOW] Found ${assetsList.length} assets from RPC`);
                     // Filter for Sepolia (11155111) and USDC (ytest.usd implies USDC usually)
                     // or look for our known address
                     
                     const asset = assetsList.find((a: any) => {
                         // Check chain
                         const cId = Number(a.chain_id);
                         if (cId !== chainId) return false;
                         
                         // Check symbol (ytest.usd or usdc)
                         // Or just match ANY valid asset for this chain for now?
                         // Prefer 'ytest.usd' or 'usdc'
                         const sym = a.asset || a.symbol;
                         return sym?.toLowerCase().includes('usd');
                     });

                     if (asset) {
                         console.log(`[YELLOW] Found matching asset: ${JSON.stringify(asset)}`);
                         if (asset.token) {
                             tokenAddress = asset.token;
                         } else if (asset.address) {
                             tokenAddress = asset.address;
                         }
                     } else {
                         console.warn(`[YELLOW] No USDC-like asset found for chain ${chainId}. Available:`, assetsList.map((a: any) => `${a.symbol}(${a.chain_id})`));
                     }
                 } else {
                     console.warn('[YELLOW] Assets list empty or unparseable');
                 }
            }
        } catch (e) {
            console.warn('[YELLOW] Asset fetch failed', e);
        }

        console.log(`[YELLOW] Using Configured Token Address: ${tokenAddress}`);

        console.log(`[YELLOW] Opening Channel (Real) with token: ${tokenAddress}`);
        
        // Use Checksummed Address (remove .toLowerCase()) as per yellow-example.md
        const response = await this.request((id) => createCreateChannelMessage(this.messageSigner, {
            chain_id: chainId,
            token: tokenAddress as `0x${string}`, 
        }, id));

        // Expect response to contain channel_id
        console.log('[YELLOW] Create Channel Response:', response);
        const channelId = response?.channel_id;

        if (!channelId) {
            throw new Error('No channel ID returned from Clearnode');
        }
        
        // Reset SLA Stats for new channel
        this.slaStats = {
            lastChunkTime: 0, // Critical: Reset this so the first chunk isn't penalized for the handover time
            averageLatency: 0,
            penaltyCount: 0,
            totalSavings: 0
        };

        this.setState({ 
            status: 'active', 
            channelId: channelId,
            provider: providerAddress, // Mapped for application logic
            // Preserve existing balance (from refreshBalance), or if null/0, try to fetch again
            balance: this.internalState.balance > 0n ? this.internalState.balance : BigInt(0) 
        });

        // Trigger a background balance refresh just in case
        this.refreshBalance();

        return channelId;

    } catch (err) {
        console.error('[YELLOW] Open Channel Failed', err);
        throw err;
    }
  }

  public async pay(amount: number) {
    // amount input is e.g. 0.001 USDC
    if (this.internalState.status !== 'active' || !this.internalState.provider) return;

    // Convert to Wei/MicroUSDC
    // USDC usually 6 decimals.
    const scale = 1000000; 
    const val = BigInt(Math.floor(amount * scale));
    const valString = val.toString();

    // Optimistically update local state immediately (for UI responsiveness)
    // Synchronous update ensures sequential calls in a loop see the decremented balance
    const newBalance = this.internalState.balance - val;
    
    if (newBalance < 0n) {
        console.warn('[YELLOW] Insufficient balance for payment');
        return;
    }

    this.setState({
        balance: newBalance
    });

    try {
        // Send Transform/Transfer Message
        const asset = 'ytest.usd';
        
        // Use explicit, sequential ID to prevent collisions during high-frequency bursting
        const txRequestId = ++this.requestId;

        // FIRE AND FORGET: Do not await the response for high-frequency streams
        const msg = await createTransferMessage(
            this.messageSigner, 
            {
                destination: this.internalState.provider as `0x${string}`,
                allocations: [{
                    asset: asset, 
                    amount: valString 
                }]
            },
            txRequestId
        );

        this.send(msg);
        console.log(`[YELLOW] Pay Sent: ${amount} (ReqID: ${txRequestId})`);
        
    } catch (err) {
        console.error('[YELLOW] Pay/Transfer Failed', err);
        // Revert balance on error? 
        // Complex in async stream. For demo, we ignore rollback.
    }
  }

  public async payWithSLA(chunkId: number, baseRate: number) {
    const now = performance.now();
    
    // 1. First Token Exception
    // If lastChunkTime is 0, it's the first chunk or reset.
    if (this.slaStats.lastChunkTime === 0) {
        this.slaStats.lastChunkTime = now;
        // Pay full amount for first chunk
        return this.pay(baseRate).then(() => ({ 
            signed: true, 
            amountPaid: baseRate, 
            latency: 0 
        }));
    }

    // 2. Calculate Latency
    const latency = now - this.slaStats.lastChunkTime;
    this.slaStats.lastChunkTime = now; // Reset for next

    // Update Average (Rolling of last 10 approx)
    if (this.slaStats.averageLatency === 0) {
        this.slaStats.averageLatency = latency;
    } else {
        this.slaStats.averageLatency = (this.slaStats.averageLatency * 9 + latency) / 10;
    }

    // 3. Hard Cap (Circuit Breaker)
    if (latency > SLA_CONFIG.SLA_HARD_CAP_MS) {
        // Telemetry
        this.emitTelemetry('SLA_VIOLATION', { 
            chunkId, latency, type: 'HARD_CAP' 
        });
        return { signed: false, error: 'TIMEOUT', latency };
    }

    // 4. Calculate Multiplier
    let multiplier = 1.0;
    if (latency > SLA_CONFIG.SLA_TARGET_MS) {
        const over = latency - SLA_CONFIG.SLA_TARGET_MS;
        const steps = Math.floor(over / SLA_CONFIG.SLA_PENALTY_STEP_MS);
        const penalty = steps * SLA_CONFIG.SLA_PENALTY_PERCENT;
        multiplier = Math.max(0, 1.0 - penalty);
    }

    const amount = baseRate * multiplier;
    const isPenalty = multiplier < 1.0;

    // 5. Telemetry
    if (isPenalty) {
        this.slaStats.penaltyCount++;
        this.slaStats.totalSavings += (baseRate - amount);
        
        this.emitTelemetry('SLA_PENALTY', {
            chunkId,
            latency,
            multiplier,
            saved: baseRate - amount
        });
        
        // Console Vibe
        console.log(`%c[SLA] PENALTY -${Math.round((1-multiplier)*100)}% (${Math.round(latency)}ms)`, 'color: orange; font-weight: bold');
    }

    // 6. Pay
    if (amount > 0) {
        await this.pay(amount);
    } else {
        console.warn(`[SLA] Payment Skipped (100% Penalty) for Chunk #${chunkId}`);
    }

    // Regular Telemetry for every chunk (optional, but good for dashboard)
    // this.emitTelemetry('SLA_STATS_UPDATE', this.getTelemetry());

    return { signed: true, amountPaid: amount, latency };
  }

  private emitTelemetry(type: string, data: any) {
    if (typeof CustomEvent !== 'undefined') {
      this.eventBus.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
  }

  public async closeChannel() {
    if (!this.internalState.channelId) return;

    try {
        console.log('[YELLOW] Closing Channel', this.internalState.channelId);
        
        // We attempt to close the channel on Clearnode
        // Note: If we haven't funded it on-chain, this might return "not found" or similar errors.
        // We will catch and ignore them to allow the UI to reset cleanly.
        try {
            await this.request((id) => createCloseChannelMessage(
                this.messageSigner, 
                this.internalState.channelId as `0x${string}`, 
                this.account.address,
                id
            ));
        } catch (requestErr) {
            const errMsg = (requestErr as any)?.message || String(requestErr);
            if (errMsg.includes('not found') || errMsg.includes('token not supported')) {
                 console.warn('[YELLOW] Channel close returned error (ignoring for reset):', errMsg);
            } else {
                 throw requestErr;
            }
        }
        
        this.setState({ 
            status: 'connected', 
            channelId: null, 
            provider: null 
        });

    } catch (err) {
        console.error('[YELLOW] Close Failed', err);
        // Force state reset even if network call failed
        this.setState({ 
            status: 'connected', 
            channelId: null, 
            provider: null 
        });
    }
  }
}
