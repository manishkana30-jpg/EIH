// tests/test-problem-description.mjs
import { generateTherapeuticResponse } from '../lib/services/therapist-engine.ts';

const scenarios = [
  { label: 'Grief EN', msg: 'my mother passed away yesterday, I feel broken' },
  { label: 'Job Loss EN', msg: 'I got fired from my job today and have no savings' },
  { label: 'Insomnia EN', msg: 'I haven\'t slept in 4 days, my head hurts and I can\'t think' },
  { label: 'Panic EN', msg: 'My heart is beating like crazy and I feel like I\'m having a panic attack' },
  { label: 'Grief HI', msg: 'meri maa gujar gayi hai kal se ro raha hu' },
  { label: 'Job Loss HI', msg: 'aaj meri naukri chali gayi mere paas koi paise nahi bache' },
  { label: 'Insomnia HI', msg: 'mujhe neend nahi aa rahi 4 din se' },
  { label: 'Breakup HI', msg: 'mera breakup ho gaya hai aur seene me dard ho raha hai' },
  { label: 'Toxic Boss EN', msg: 'my boss yelled at me and humiliated me in front of the whole team' },
  { label: 'Custom Eviction', msg: 'my landlord is evicting me tomorrow and I have nowhere to go' }
];

async function run() {
  console.log("==========================================================");
  console.log("VERIFYING SITUATIONAL PROBLEM DESCRIPTIONS IN REPLIES");
  console.log("==========================================================\n");

  for (const s of scenarios) {
    const res = await generateTherapeuticResponse(s.msg);
    console.log(`\n▶ [${s.label}] Input: "${s.msg}"`);
    console.log(`Provider: ${res.providerUsed}`);
    console.log(`First 300 characters of reply:`);
    console.log(res.reply.slice(0, 300));
    console.log("----------------------------------------------------------");
  }
}

run();
