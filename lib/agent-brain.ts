import { createPublicClient, http, namehash, parseAbiItem, Hash, encodeFunctionData } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { normalize } from 'viem/ens';
import { YellowClient } from './yellow-client';

// Constants
// Note: In a real app these typically live in a config/env file
const REGISTRY_DOMAIN = 'd4-registry.eth';
const BOND_CONTRACT_ADDRESS = '0x31D4BbD8FFB9c77B90F5b679D19C998ACdDC14AF'; 
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'; 
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'; // Sepolia Registry

// ABI Snippets
const RESOLVER_ABI = [
  parseAbiItem('function text(bytes32 node, string key) view returns (string)'),
  parseAbiItem('function resolver(bytes32 node) view returns (address)')
];
const BOND_ABI = [
  parseAbiItem('function bonds(bytes32 node) view returns (uint256 amount, uint256 creationTime, uint256 unbondRequestTime)')
];

// --- Types ---

export type BrainStatus = 'IDLE' | 'THINKING' | 'ACTING' | 'DISCOVERING' | 'NEGOTIATING' | 'STREAMING' | 'SWITCHING' | 'COMPLETED' | 'ERROR';

export interface Provider {
  ensName: string;
  endpoint: string;
  paymentAddress: string;
  bondAmount: bigint; // Wei
  bondAge: number; // Seconds
  isUnbonding: boolean;
  trustScore: number;
  
  // Real-time state
  lastKnownPrice: number;
  status: 'online' | 'offline' | 'active';
}

export type BrainLog = {
  timestamp: number;
  type: 'INFO' | 'WARN' | 'ERROR' | 'ARB' | 'YEL' | 'ENS' | 'THOUGHT' | 'OP' | 'DATA';
  message: string;
};

// --- The Brain ---

export class AgentBrain extends EventTarget {
  public status: BrainStatus = 'IDLE';
  public providers: Provider[] = [];
  public activeProvider: Provider | null = null;
  public contextBuffer: string = '';
  public logs: BrainLog[] = [];
  
  private publicClient: any;
  private yellow: YellowClient | null = null;
  private abortController: AbortController | null = null;

  constructor(yellowClient: YellowClient) {
    super();
    this.yellow = yellowClient;
    this.publicClient = createPublicClient({
      chain: sepolia, // Using Sepolia for ENS/Contract calls as per spec
      transport: http(RPC_URL)
    });
    this.log('INFO', 'Brain initialized. Waiting for prompt.');
  }

  // --- Public API ---

  public async start(prompt: string) {
    if (this.status !== 'IDLE' && this.status !== 'COMPLETED' && this.status !== 'ERROR') {
      this.log('WARN', 'Brain is busy. Ignoring start command.');
      return;
    }

    this.setStatus('DISCOVERING');
    this.contextBuffer = ''; // Reset buffer for new prompt

    try {
      // 1. Discovery Phase
      await this.discoverProviders();
      
      if (this.providers.length === 0) {
        throw new Error('Market Exhausted: No providers found.');
      }

      // 2. Select & Connect
      const best = this.providers[0];
      await this.connectAndStream(best, prompt);

    } catch (err: any) {
      this.setStatus('ERROR');
      this.log('ERROR', err.message || 'Unknown error');
      console.error(err);
    }
  }

  // --- Public Tools for Cognitive Mode ---

  public async searchRegistry(category: string = 'finance'): Promise<string[]> {
      this.log('ENS', `Tool: Searching registry for '${category}'...`);
      try {
        const node = namehash(normalize(REGISTRY_DOMAIN));
        
        // 1. Get Resolver
        const resolverAddr = await this.publicClient.readContract({
            address: ENS_REGISTRY_ADDRESS,
            abi: RESOLVER_ABI,
            functionName: 'resolver',
            args: [node]
        });

        if (resolverAddr === '0x0000000000000000000000000000000000000000') {
              throw new Error(`No resolver set for ${REGISTRY_DOMAIN}`);
        }

        // 2. Get Text (Dynamic key based on category)
        const key = `d4.list.${category}`;
        const listString = await this.publicClient.readContract({
            address: resolverAddr as `0x${string}`,
            abi: RESOLVER_ABI,
            functionName: 'text',
            args: [node, key]
        }) as string;

        if (!listString) return [];
        return listString.split(',').map(s => s.trim()).filter(Boolean);
      } catch (e: any) {
        this.log('ERROR', `Registry Search Failed: ${e.message}`);
        return [];
      }
  }

  public async inspectProvider(ensName: string): Promise<Provider | null> {
      this.log('ENS', `Tool: Inspecting ${ensName}...`);
      return this.resolveProvider(ensName);
  }

  public async hireProvider(ensName: string, prompt: string) {
       this.log('OP', `Tool: Hiring ${ensName}...`);
       // Find or resolve
       let provider: Provider | null | undefined = this.providers.find(p => p.ensName === ensName);
       if (!provider) {
           provider = await this.resolveProvider(ensName);
           if (!provider) throw new Error(`Could not resolve ${ensName}`);
       }
       
       // Force set active and connect
       await this.connectAndStream(provider, prompt);
       return { status: 'streaming_started', provider };
  }

  // --- Core Logic ---

  private async discoverProviders() {
    this.log('ENS', `Querying registry: ${REGISTRY_DOMAIN}`);
    // ... existing implementation simplified to use new tool?
    // For now, keep existing logic to avoid breaking Module 6-7, but exposing tools above is strictly additive.
    
    try {
        let listString = '';
        try {
            // Standard ENS Resolution via Registry -> Resolver -> Text
            const node = namehash(normalize(REGISTRY_DOMAIN));
            
            // 1. Get Resolver
            const resolverAddr = await this.publicClient.readContract({
                address: ENS_REGISTRY_ADDRESS,
                abi: RESOLVER_ABI,
                functionName: 'resolver',
                args: [node]
            });

            if (resolverAddr === '0x0000000000000000000000000000000000000000') {
                 throw new Error(`No resolver set for ${REGISTRY_DOMAIN}`);
            }

            // 2. Get Text
            listString = await this.publicClient.readContract({
                address: resolverAddr as `0x${string}`,
                abi: RESOLVER_ABI,
                functionName: 'text',
                args: [node, 'd4.list.finance']
            }) as string;

        } catch (e: any) {
             this.log('ERROR', `Registry lookup failed: ${e.message}`);
             throw e; // Fail hard if registry is down, per user request to be "real"
        }

        if (!listString) throw new Error('Registry empty.');

        const names = listString.split(',').map(s => s.trim()).filter(Boolean);
        this.log('ENS', `Discovered ${names.length} candidates.`);

        // B. Resolve details for each provider parallel
        const results = await Promise.all(names.map(name => this.resolveProvider(name)));
        
        // C. Filter & Sort
        this.providers = results
            .filter((p): p is Provider => p !== null) // Remove failed resolutions
            .filter(p => p.trustScore >= 20)           // Min Trust Score requirement
            .sort((a, b) => b.trustScore - a.trustScore); // Descending Trust

        this.log('ENS', `Filtered to ${this.providers.length} valid providers.`);
        
    } catch (err: any) {
        this.log('ERROR', `Discovery Failed: ${err.message}`);
        throw err;
    }
  }

  private async resolveProvider(ensName: string): Promise<Provider | null> {
    try {
        const node = namehash(normalize(ensName));
        
        // 1. Get Resolver first
        const resolverAddr = await this.publicClient.readContract({
            address: ENS_REGISTRY_ADDRESS,
            abi: RESOLVER_ABI,
            functionName: 'resolver',
            args: [node]
        }) as `0x${string}`;

        if (resolverAddr === '0x0000000000000000000000000000000000000000') {
             this.log('WARN', `Skipping ${ensName}: No resolver set`);
             return null;
        }

        // 2. Parallel fetch of Text Records directly from Resolver
        const [endpoint, paymentAddr, bondAddr] = await Promise.all([
            this.publicClient.readContract({ address: resolverAddr, abi: RESOLVER_ABI, functionName: 'text', args: [node, 'd4.endpoint'] }),
            this.publicClient.readContract({ address: resolverAddr, abi: RESOLVER_ABI, functionName: 'text', args: [node, 'd4.payment'] }),
            this.publicClient.readContract({ address: resolverAddr, abi: RESOLVER_ABI, functionName: 'text', args: [node, 'd4.bond'] }),
        ]) as [string, string, string];

        if (!endpoint || !paymentAddr) {
             this.log('WARN', `Skipping ${ensName}: Missing metadata`);
             return null;
        }

        // Fetch Bond Data (On-Chain)
        let bondAmount = BigInt(0);
        let creationTime = BigInt(0);
        let unbondRequestTime = BigInt(0);

        try {
             // Read from the known Bond Contract
             const data = await this.publicClient.readContract({
                address: BOND_CONTRACT_ADDRESS,
                abi: BOND_ABI,
                functionName: 'bonds',
                args: [node]
             });
             [bondAmount, creationTime, unbondRequestTime] = data as [bigint, bigint, bigint];
        } catch (e) {
            console.warn(`Bond read failed for ${ensName}`, e);
        }

        const isUnbonding = unbondRequestTime > 0n;
        
        // Calculate Trust Score
        const ageSeconds = Number((BigInt(Math.floor(Date.now() / 1000)) - creationTime));
        // Use a safe effective age (if 0, it's 0)
        const effectiveAge = creationTime === 0n ? 0 : ageSeconds;
        
        const ethAmount = Number(bondAmount) / 1e18;
        const trustScore = this.calculateTrustScore(ethAmount, effectiveAge, isUnbonding);

        return {
            ensName,
            endpoint,
            paymentAddress: paymentAddr,
            bondAmount,
            bondAge: effectiveAge,
            isUnbonding,
            trustScore,
            lastKnownPrice: 0,
            status: isUnbonding ? 'offline' : 'online'
        };

    } catch (err) {
        console.warn(`Resolution failed for ${ensName}`, err);
        return null;
    }
  }

  private calculateTrustScore(stakeEth: number, ageSeconds: number, isUnbonding: boolean): number {
      if (isUnbonding) return 0; // Immediate reject
      
      const units = stakeEth * 2500; 
      let wealth = (units > 1) ? Math.min(40, 10 * Math.log10(units)) : 0;

      // 2. Time Score (Capped Linear at 30 days)
      let time = Math.min(60, (ageSeconds / 86400) * 2);

      return Math.floor(wealth + time);
  }

  private async connectAndStream(provider: Provider, prompt: string, isHandover = false) {
      if (!this.yellow) return;

      this.setStatus('NEGOTIATING');
      this.activeProvider = provider;
      provider.status = 'active';
      this.emitUpdate();

      this.log('YEL', `${isHandover ? 'Handing over' : 'Opening channel'} to ${provider.paymentAddress.slice(0, 6)}...`);
      
      try {
          await this.yellow.openChannel(provider.paymentAddress);
          this.setStatus('STREAMING');

          // Prepare AbortController
          this.abortController = new AbortController();
          
          // Request Payload
          const payload = {
              prompt: prompt,
              history: isHandover ? this.contextBuffer : undefined
          };

          this.log('INFO', `Requesting stream... (History: ${isHandover ? this.contextBuffer.length + ' chars' : 'None'})`);

          const response = await fetch(provider.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
              signal: this.abortController.signal
          });

          if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
          if (!response.body) throw new Error('No response body');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          // Stream Loop
          let chunkCounter = 0;
          while (true) {
              const { value, done } = await reader.read();
              if (done) {
                  this.setStatus('COMPLETED');
                  this.log('INFO', 'Stream finished successfully.');
                  break;
              }

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Parse SSE (data: {...})
              const lines = buffer.split('\n\n');
              buffer = lines.pop() || ''; // Keep incomplete lines

              for (const line of lines) {
                  const cleanLine = line.replace(/^data: /, '').trim();
                  if (cleanLine === '[DONE]') {
                      continue;
                  }
                  if (!cleanLine) continue;

                  try {
                      const data = JSON.parse(cleanLine);
                      
                      // Process Content
                      if (data.type === 'content') {
                          this.contextBuffer += data.text;
                          this.emit('content', data.text); // Fire event for UI typing
                          
                          // Track Price
                          provider.lastKnownPrice = data.price;
                          chunkCounter++;

                          // Payment & SLA
                          const payResult = await this.yellow.payWithSLA(chunkCounter, data.price);
                          
                          // --- ARBITRAGE CHECK ---
                          const shouldSwitch = await this.checkForArbitrage(provider, data.price, payResult);
                          
                          if (shouldSwitch) {
                              this.log('ARB', 'Triggering Flash Switch...');
                              // ABORT!
                              await reader.cancel();
                              this.switchProvider(prompt); // Restart loop with next provider
                              return; // Exit this loop
                          }
                      }
                  } catch (e) {
                      console.warn('JSON Parse Error', e);
                  }
              }
          }

      } catch (err: any) {
          if (err.name === 'AbortError') return; // Expected
          this.log('ERROR', `Stream Failed: ${err.message}`);
          this.setStatus('ERROR');
      }
  }

  private async checkForArbitrage(current: Provider, currentPrice: number, slaResult: any): Promise<boolean> {
      // 1. SLA Hard Cap
      if (slaResult && slaResult.error === 'TIMEOUT') {
          this.log('ARB', `SLA Violation (Latency > 500ms).`);
          
          // Safety Check: Do we have anywhere to go?
          const nextProvider = this.providers.find(p => p.ensName !== current.ensName && p.status !== 'offline');
          if (!nextProvider) {
              this.log('WARN', 'SLA Triggered but no alternatives. Staying put.');
              return false;
          }
          return true;
      }

      // 2. Price Spike
      const nextBest = this.providers.find(p => p.ensName !== current.ensName && p.status !== 'offline');
      if (!nextBest) return false; // No alternative

      // Adjusted Baseline: 
      // Fast Agent is $0.005. Cheap Agent is $0.001.
      // If we use 0.001 * 3 = 0.003, Fast Agent triggers immediately.
      // We set baseline to 0.002, so trigger is > 0.006.
      // Fast Agent ($0.005) is Safe. Spike ($0.05) is Triggered.
      const baselinePrice = 0.002; 
      
      if (currentPrice > baselinePrice * 3) {
          this.log('ARB', `Price Spike Detected: $${currentPrice} > $${baselinePrice * 3}`);
          return true;
      }

      return false;
  }

  private async switchProvider(originalPrompt: string) {
      this.setStatus('SWITCHING');
      this.abortCurrentStream();
      
      // Close current channel
      if (this.activeProvider) {
          this.activeProvider.status = 'offline'; // Mark as "bad" or just "done"
          await this.yellow?.closeChannel();
      }

      // Find next
      const nextProvider = this.providers.find(p => p.status !== 'offline' && p.ensName !== this.activeProvider?.ensName);
      
      if (!nextProvider) {
          this.log('ERROR', 'No alternative providers available for switch!');
          return;
      }

      this.log('ARB', `Switching to ${nextProvider.ensName}...`);
      
      // Recurse / Restart Stream with Handover flag
      await this.connectAndStream(nextProvider, originalPrompt, true);
  }

  private abortCurrentStream() {
      if (this.abortController) {
          this.abortController.abort();
          this.abortController = null;
      }
  }

  // --- Helpers ---

  private setStatus(s: BrainStatus) {
      this.status = s;
      this.emitUpdate();
  }

  public log(type: BrainLog['type'], message: string) {
      const entry = { timestamp: Date.now(), type, message };
      this.logs.push(entry);
      // Keep log size sane
      if (this.logs.length > 50) this.logs.shift();
      
      // Emit 'log' event
      const event = new CustomEvent('log', { detail: entry });
      this.dispatchEvent(event);
      
      console.log(`[BRAIN:${type}] ${message}`);
  }

  public stop() {
    this.abortCurrentStream();
    this.yellow?.closeChannel().catch(console.error);
    this.setStatus('IDLE');
    this.log('INFO', 'Brain stopped manually.');
  }

  private emitUpdate() {
      // Emit 'update' event with full state clone
      const event = new CustomEvent('update', { 
          detail: {
            status: this.status,
            providers: [...this.providers],
            activeProvider: this.activeProvider
          } 
      });
      this.dispatchEvent(event);
  }

  // Convenience for React-like usage
  private emit(type: string, detail: any) {
      this.dispatchEvent(new CustomEvent(type, { detail }));
  }
}
