import { createMemoryStore } from '@/lib/data/adapters/memory-store';

import { storeContract } from './store-contract';

storeContract('in-memory', async () => ({ store: createMemoryStore() }));
