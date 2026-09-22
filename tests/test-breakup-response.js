const { generateTherapeuticResponse } = require('../lib/services/therapist-engine.ts');

async function run() {
  const inputs = [
    "I broke up with my girl friend",
    "I broke up with my girlfriend"
  ];

  for (const input of inputs) {
    console.log('====================================================');
    console.log(`INPUT: "${input}"`);
    console.log('====================================================');
    const res = await generateTherapeuticResponse(input, undefined, 'en');
    console.log('--- Therapeutic Response ---');
    console.log(res.reply);
    console.log('\n--- Telemetry & Synchronization ---');
    console.log('Provider used:', res.providerUsed);
    console.log('Telemetry:', JSON.stringify(res.telemetry, null, 2));
    console.log('CBT Distortion:', res.telemetry?.cbt_distortion || res.cbt_distortion);
    console.log('Recommended Trataka:', res.recommended_trataka);
    console.log('Word count:', res.reply.split(/\s+/).filter(Boolean).length);
    console.log('\n');
  }
}

run().catch(console.error);
