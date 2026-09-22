const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');

async function run() {
  const input = "I made new girlfriend";
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
  console.log('Word count:', res.reply.split(/\s+/).filter(Boolean).length);
}

run().catch(console.error);
