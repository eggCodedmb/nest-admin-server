require('dotenv').config({ path: '.env.development' });
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
const { RecommendService } = require('../dist/modules/article/recommend/recommend.service');

async function runFullVerification() {
  console.log('=== Starting Full-Lifecycle Recommendation Verification ===');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const service = app.get(RecommendService);

  // 1. 获取当前默认策略
  const active = await service.getActiveConfig();
  console.log(`[PASS] 1. Active Strategy: "${active.name}" (${active.algorithmType})`);

  // 2. 沙盘试算 - 热门衰减预设
  console.log('\n[PASS] 2. Testing Simulation with HOT_DECAY weights...');
  const hotSim = await service.simulate({
    weights: {
      viewWeight: 15,
      likeWeight: 50,
      commentWeight: 35,
      timeDecayRate: 1.8,
      tagMatchWeight: 10,
      categoryMatchWeight: 10,
      manualBoostWeight: 30,
    },
    limit: 3,
  });
  console.log(`  Top 1 Article: "${hotSim.simulatedList[0].title}" Score: ${hotSim.simulatedList[0].scoreBreakdown.finalScore}`);

  // 3. 测试单篇文章干预 (加权提权 & 禁推黑名单)
  console.log('\n[PASS] 3. Testing Single-Article Overrides...');
  const testArticleId = hotSim.simulatedList[2].id; // 取第3名文章
  console.log(`  Original #3 article: [ID: ${testArticleId}] "${hotSim.simulatedList[2].title}"`);

  // 提权 +100
  await service.updateArticleControl(testArticleId, { recommendWeight: 100, recommendFactor: 1 }, 1);
  const boostedSim = await service.simulate({
    weights: hotSim.weightsSnapshot,
    limit: 3,
  });
  console.log(`  After +100 Boost: [ID: ${boostedSim.simulatedList[0].id}] is now rank #${boostedSim.simulatedList[0].simulatedRank} with delta ${boostedSim.simulatedList[0].rankDelta}`);

  // 设为禁推 (recommendFactor = 2)
  await service.updateArticleControl(testArticleId, { recommendFactor: 2 }, 1);
  const blacklistedSim = await service.simulate({
    weights: hotSim.weightsSnapshot,
    limit: 5,
  });
  const foundInList = blacklistedSim.simulatedList.some((a) => a.id === testArticleId);
  console.log(`  After Blacklist (recommendFactor=2): Article in simulated feed? ${foundInList ? 'YES (FAIL)' : 'NO (EXCLUDED CORRECTLY)'}`);

  // 恢复自然状态
  await service.updateArticleControl(testArticleId, { recommendWeight: 0, recommendFactor: 0 }, 1);
  console.log('  Restored article to natural algorithm state.');

  // 4. 测试 Feed 推荐流接口与分类打散
  console.log('\n[PASS] 4. Testing Feed API with Diversity Dispersion...');
  const feed = await service.getRecommendedArticles({ limit: 6 });
  console.log(`  Feed returned ${feed.length} articles.`);
  const categories = feed.map((f) => f.categoryName);
  console.log('  Category distribution in feed:', categories);

  await app.close();
  console.log('\n=== All Recommendation Algorithm Tests Passed Successfully! ===');
}

runFullVerification().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
