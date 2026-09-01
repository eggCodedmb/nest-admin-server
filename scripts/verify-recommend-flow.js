require('dotenv').config({ path: '.env.development' });
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { RecommendService } = require('../dist/modules/article/recommend/recommend.service');

async function main() {
  console.log('Bootstrapping NestJS context for recommend verification...');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const recommendService = app.get(RecommendService);

  const active = await recommendService.getActiveConfig();
  console.log('✅ Active Strategy:', active.name);
  console.log('✅ Weights:', JSON.stringify(active.weights));

  const simResult = await recommendService.simulate({
    weights: active.weights,
    coldStartConfig: active.coldStartConfig,
    limit: 5,
  });

  console.log('✅ Total Candidates in pool:', simResult.totalCandidates);
  console.log('✅ Top 5 Simulated Articles:');
  simResult.simulatedList.forEach((item, i) => {
    console.log(`  #${i + 1} [Score: ${item.scoreBreakdown.finalScore}] [ID: ${item.id}] ${item.title}`);
    console.log(`     -> Interaction: ${item.scoreBreakdown.interactionScore} | Decay: ${item.scoreBreakdown.timeDecayFactor} | ColdStart: ${item.scoreBreakdown.coldStartMultiplier} | ManualBoost: ${item.scoreBreakdown.manualBoostScore}`);
  });

  const feed = await recommendService.getRecommendedArticles({ limit: 3 });
  console.log('✅ Feed count returned:', feed.length);

  await app.close();
  console.log('Verification completed successfully!');
}

main().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
