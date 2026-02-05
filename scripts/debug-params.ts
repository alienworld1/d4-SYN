import { createGetConfigMessage, createECDSAMessageSigner } from '@erc7824/nitrolite';
import { generatePrivateKey } from 'viem/accounts';

async function main() {
    const pk = generatePrivateKey();
    const signer = createECDSAMessageSigner(pk);
    const msg = await createGetConfigMessage(signer);
    console.log("MSG:", msg);
}

main();
