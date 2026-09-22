const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');

async function run() {
  const input = "I have financial problems and I have more debts on me which is constantly a burden on my mind";
  console.log('====================================================');
  console.log(`INPUT: "${input}"`);
  console.log('====================================================');
  const res = await generateTherapeuticResponse(input, undefined, 'en');
  console.log('--- Therapeutic Response ---');
  console.log(res.reply);
  console.log('\n--- Telemetry & Synchronization ---');
  console.log('Provider used:', res.providerUsed);
  console.log('Telemetry:', JSON.stringify(res.telemetry, null, 2));
  console.log('Recommended Trataka:', res.recommended_trataka);
  console.log('Sources:', res.sources ? res.sources.map(s => s.title) : []);
  console.log('Word count:', res.reply.split(/\s+/).filter(Boolean).length);
}

run().catch(console.error);
