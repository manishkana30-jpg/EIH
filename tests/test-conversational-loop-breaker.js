import { generateTherapeuticResponse } from "../lib/services/therapist-engine.ts";

async function runLoopBreakerTestSuite() {
  console.log("================================================================");
  console.log("TEST SUITE: LOOP BREAKER & RESEARCH-GROUNDED CONVERSATIONAL BRAIN");
  console.log("================================================================\n");

  let allPassed = true;

  // Test 1: Direct user complaint about repetitive loops
  console.log("--- 1. Testing Loop Complaint Interception ---");
  const loopComplaints = [
    "you are again in loop giving single type of message for everything, please stop repeating",
    "Why do you keep sending the same template again and again?",
    "आप बार-बार एक ही जैसा उत्तर क्यों दे रहे हैं? कुछ अलग और रिसर्च के आधार पर बताएं",
  ];

  for (const complaint of loopComplaints) {
    console.log(`Checking complaint: "${complaint}"`);
    const res = await generateTherapeuticResponse(complaint, []);
    console.log(`  Provider: ${res.providerUsed}`);
    console.log(`  Reply snippet: "${res.reply.slice(0, 150)}..."`);

    // Verify it broke the loop and did NOT output the 4-card template
    if (res.reply.includes("• **1. Bhagavad Gita") && res.reply.includes("• **4. Tri-Pillar Synergy")) {
      console.error("  ❌ FAILED: Still generated rigid 4-card template!");
      allPassed = false;
    } else {
      console.log("  ✓ Successfully broke repetitive template loop!");
    }
  }

  // Test 2: Informational & Neuroscience inquiries (Must give research, not 4 cards)
  console.log("\n--- 2. Testing Research Inquiries ---");
  const inquiries = [
    {
      q: "Why does anxiety make my stomach churn and hurt?",
      expectedKeywords: ["gut", "nervous system", "vagus", "enteric", "brain", "parasympathetic"],
    },
    {
      q: "How does contralateral alternate nostril breathing affect the autonomic nervous system?",
      expectedKeywords: ["breathing", "vagal", "sympathetic", "autonomic", "hemispheric", "heart rate"],
    },
    {
      q: "त्राटक साधना से मस्तिष्क पर क्या प्रभाव पड़ता है?",
      expectedKeywords: ["त्राटक", "मस्तिष्क", "एकाग्रता", "तंत्रिका", "न्यूरो"],
    },
  ];

  for (const item of inquiries) {
    console.log(`Checking inquiry: "${item.q}"`);
    const res = await generateTherapeuticResponse(item.q, []);
    console.log(`  Provider: ${res.providerUsed}`);
    console.log(`  Reply: "${res.reply.slice(0, 160)}..."`);

    const hasNoTemplate = !res.reply.includes("• **4. Tri-Pillar Synergy");
    const mentionsResearch = item.expectedKeywords.some(kw => res.reply.toLowerCase().includes(kw.toLowerCase()));

    if (!hasNoTemplate || !mentionsResearch) {
      console.error(`  ❌ FAILED inquiry check: hasNoTemplate=${hasNoTemplate}, mentionsResearch=${mentionsResearch}`);
      allPassed = false;
    } else {
      console.log("  ✓ Verified research-grounded cognitive explanation without template dump.");
    }
  }

  // Test 3: Multi-turn Dialogue (Turns 2 & 3 must never repeat the 4-card template)
  console.log("\n--- 3. Testing Multi-Turn Dialogue Continuity ---");
  const history = [
    { role: "user", content: "I am feeling overwhelmed with college and work pressure." },
    {
      role: "assistant",
      content: "I hear the weight you are carrying. Let us ground your nervous system first.",
    },
  ];

  const followUp1 = "What if I get distracted while trying the breathwork practice?";
  console.log(`Turn 2 User: "${followUp1}"`);
  const resTurn2 = await generateTherapeuticResponse(followUp1, history);
  console.log(`  Provider: ${resTurn2.providerUsed}`);
  console.log(`  Reply snippet: "${resTurn2.reply.slice(0, 160)}..."`);

  const turn2NoTemplate = !resTurn2.reply.includes("• **4. Tri-Pillar Synergy");
  if (!turn2NoTemplate) {
    console.error("  ❌ FAILED: Turn 2 dumped the 4-card template!");
    allPassed = false;
  } else {
    console.log("  ✓ Turn 2 maintained fluid therapeutic dialogue without template replay.");
  }

  // Turn 3
  history.push({ role: "user", content: followUp1 });
  history.push({ role: "assistant", content: resTurn2.reply });

  const followUp2 = "Should I do this before going to sleep or in the morning?";
  console.log(`Turn 3 User: "${followUp2}"`);
  const resTurn3 = await generateTherapeuticResponse(followUp2, history);
  console.log(`  Provider: ${resTurn3.providerUsed}`);
  console.log(`  Reply snippet: "${resTurn3.reply.slice(0, 160)}..."`);

  const turn3NoTemplate = !resTurn3.reply.includes("• **4. Tri-Pillar Synergy");
  if (!turn3NoTemplate) {
    console.error("  ❌ FAILED: Turn 3 dumped the 4-card template!");
    allPassed = false;
  } else {
    console.log("  ✓ Turn 3 maintained fluid therapeutic dialogue without template replay.");
  }

  console.log("\n================================================================");
  if (allPassed) {
    console.log("🎉 ALL LOOP BREAKER & CONVERSATIONAL BRAIN TESTS PASSED (100%)");
  } else {
    console.log("❌ SOME TESTS FAILED!");
    process.exit(1);
  }
  console.log("================================================================");
}

runLoopBreakerTestSuite().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
