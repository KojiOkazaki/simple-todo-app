// CareerBot relay server entry point.
// Wires: HTTP health server + WebSocket gateway + voice provider + persistence.

import { config } from './config.js';
import { createHttpServer } from './server/httpServer.js';
import { WsGateway } from './gateway/wsGateway.js';
import { CareerService } from './services/careerService.js';
import { ConversationService } from './services/conversationService.js';
import { MemoryRepo } from './repositories/memoryRepo.js';
import { createVoiceProvider } from './realtime/voiceProvider.js';

async function createRepo() {
  if (config.storage === 'sqlite') {
    try {
      const { SqliteRepo } = await import('./repositories/sqliteRepo.js');
      const repo = new SqliteRepo(config.sqlitePath);
      await repo.init();
      console.log(`[careerbot] storage: sqlite (${config.sqlitePath})`);
      return repo;
    } catch (err) {
      console.warn(
        `[careerbot] sqlite unavailable (${err.message}); falling back to memory`
      );
    }
  }
  const repo = new MemoryRepo();
  await repo.init();
  console.log('[careerbot] storage: memory');
  return repo;
}

export async function startServer() {
  const repo = await createRepo();
  const conversationService = new ConversationService(repo);
  const careerService = new CareerService();

  const httpServer = createHttpServer({
    status: () => ({
      provider: config.voiceProvider,
      storage: config.storage,
    }),
  });

  const gateway = new WsGateway({
    server: httpServer,
    conversationService,
    careerService,
    createProvider: createVoiceProvider,
  });

  await new Promise((resolve) => httpServer.listen(config.port, resolve));
  console.log(
    `[careerbot] listening on :${config.port} (ws path /ws, provider=${config.voiceProvider})`
  );

  return {
    httpServer,
    gateway,
    async close() {
      gateway.close();
      await new Promise((resolve) => httpServer.close(resolve));
    },
  };
}

// Run when executed directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((err) => {
    console.error('[careerbot] fatal:', err);
    process.exit(1);
  });
}
