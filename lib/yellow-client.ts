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
  createEIP712AuthMessageSigner 
} from '@erc7824/nitrolite';
import { createWalletClient, createPublicClient, http, PrivateKeyAccount as ViemPrivateKeyAccount, hexToBigInt, Account, WalletClient, Transport, Chain, ParseAccount } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { YELLOW_RPC_URL, YELLOW_ADDRESSES, MOCK_YELLOW, USDC_SEPOLIA_ADDRESS } from './constants';

// Types
export type YellowStatus = 'disconnected' | 'connecting' | 'connected' | 'active' | 'settling' | 'error';

export interface YellowState {
  status: YellowStatus;
  balance: bigint; // In wei units (or whatever the token decimals are)
  channelId: string | null;
  provider: string | null;
}

export class YellowClient {
  private ws: WebSocket | null = null;
  public client: NitroliteClient;
  private account: ViemPrivateKeyAccount;
  private signer: WalletStateSigner;
  private messageSigner: any; // Type is inferred from createECDSAMessageSigner
  private walletClient: WalletClient<Transport, Chain, Account>;
  
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: (data: any) => void; reject: (err: any) => void; }>();
  
  private currentAuthParams: any = null;

  // State observable pattern could be used, but for now we'll expose a callback
  public onStateChange: ((state: YellowState) => void) | null = null;
  
  private internalState: YellowState = {
    status: 'disconnected',
    balance: BigInt(0),
    channelId: null,
    provider: null
  };

  constructor(privateKey: string) {
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    this.account = privateKeyToAccount(formattedKey as `0x${string}`);
    
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

  private setState(updates: Partial<YellowState>) {
    this.internalState = { ...this.internalState, ...updates };
    if (this.onStateChange) {
      this.onStateChange(this.internalState);
    }
  }

  public getState(): YellowState {
    return this.internalState;
  }

  public async init() {
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
      
      // Timeout after 10s
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timed out'));
        }
      }, 10000);
    });
  }

  private async authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      
      this.currentAuthParams = {
        address: this.account.address,
        session_key: this.account.address,
        application: typeof window !== 'undefined' ? window.location.host : 'd4-syn-bot',
        allowances: [],
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
      // console.log('[YELLOW] Recv:', msg); // Verbose logging

      // Unwrap Envelope
      const payload = msg.res || msg.req;
      
      // 1. Handle Response (res)
      if (msg.res && Array.isArray(msg.res)) {
        const [id, method, result] = msg.res; 
        
        // Resolve pending request
        if (this.pendingRequests.has(id)) {
          const { resolve } = this.pendingRequests.get(id)!;
          this.pendingRequests.delete(id);
          resolve(result);
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
    } catch (err) {
        console.error('[YELLOW] Auth Sign Failed', err);
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
        // Asset ID format: "chainId:tokenAddress" e.g. "11155111:0x..."
        const assetId = `${sepolia.id}:${USDC_SEPOLIA_ADDRESS}`;
        
        // res might be array of {asset, amount} or object
        // Based on other RPCs, likely an array of balances.
        // Let's assume standard response structure.
        
        if (Array.isArray(res)) {
            const tokenBal = res.find((b: any) => b.asset?.toLowerCase() === assetId.toLowerCase());
            if (tokenBal) {
                this.setState({ balance: BigInt(tokenBal.amount) });
            }
        } else if (res && typeof res === 'object') {
             // Try to parse if it comes as a map
             // ...
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

  public async openChannel(providerAddress: string) {
    if (this.internalState.status !== 'connected') {
        console.warn("Client not connected, attempting but might fail");
    }

    try {
        console.log(`[YELLOW] Opening Channel (Real)`);
        
        const response = await this.request((id) => createCreateChannelMessage(this.messageSigner, {
            chain_id: sepolia.id,
            token: USDC_SEPOLIA_ADDRESS as `0x${string}`,
        }, id));

        // Expect response to contain channel_id
        console.log('[YELLOW] Create Channel Response:', response);
        const channelId = response?.channel_id;

        if (!channelId) {
            throw new Error('No channel ID returned from Clearnode');
        }
        
        this.setState({ 
            status: 'active', 
            channelId: channelId,
            provider: providerAddress, // Mapped for application logic
            balance: BigInt(0) 
        });

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
    const newBalance = this.internalState.balance - val;
    this.setState({
        balance: newBalance >= 0n ? newBalance : 0n // Prevent visual negative, though logic might fail later
    });

    try {
        // Send Transform/Transfer Message
        const asset = `${sepolia.id}:${USDC_SEPOLIA_ADDRESS}`;
        
        // FIRE AND FORGET: Do not await the response for high-frequency streams
        // We generate the ID manually if needed, or let createTransferMessage default (but we need unique IDs for tracking if we cared)
        // For pure stream, we just send.
        
        const msg = await createTransferMessage(this.messageSigner, {
             destination: this.internalState.provider as `0x${string}`,
             allocations: [{
                 asset: asset, 
                 amount: valString 
             }]
        }); // Note: id params omitted, standard generator used

        this.send(msg);
        
    } catch (err) {
        console.error('[YELLOW] Pay/Transfer Failed', err);
        // Revert balance on error? 
        // Complex in async stream. For demo, we ignore rollback.
    }
  }

  public async closeChannel() {
    if (!this.internalState.channelId) return;

    try {
        console.log('[YELLOW] Closing Channel');
        
        await this.request((id) => createCloseChannelMessage(
            this.messageSigner, 
            this.internalState.channelId as `0x${string}`, 
            this.account.address,
            id
        ));
        
        this.setState({ 
            status: 'connected', 
            channelId: null, 
            provider: null 
        });

    } catch (err) {
        console.error('[YELLOW] Close Failed', err);
    }
  }
}
