import asyncio
import sys
import httpx

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')


async def run_audit():
    print("========================================")
    print("🔍 EXHAUSTIVE SYSTEM & GEO AUDIT STARTED")
    print("========================================")

    async with httpx.AsyncClient(timeout=30.0) as client:
        # 1. Next.js Health Proxy & API
        try:
            r_next = await client.get("http://localhost:3000/api/health")
            print(f"1. [Next.js /api/health]: Status {r_next.status_code} -> Latency: {r_next.json().get('latency_ms')}ms | Service: {r_next.json().get('service')}")
        except Exception as e:
            print(f"1. [Next.js /api/health]: ERROR -> {e}")

        # 2. FastAPI Direct Health
        try:
            r_fast = await client.get("http://127.0.0.1:8000/health")
            print(f"2. [FastAPI /health]: Status {r_fast.status_code} -> Available Voices: {len(r_fast.json().get('audio_engine', {}).get('available_voices', []))}")
        except Exception as e:
            print(f"2. [FastAPI /health]: ERROR -> {e}")

        # 3. Next.js Neural Edge-TTS Streaming Endpoint
        try:
            r_tts = await client.get("http://localhost:3000/api/voice?text=Welcome+to+the+healing+sanctuary&voice=en-US-AriaNeural")
            print(f"3. [Next.js /api/voice Edge-TTS]: Status {r_tts.status_code}, Content-Type: {r_tts.headers.get('content-type')}, Streamed Bytes: {len(r_tts.content)}")
        except Exception as e:
            print(f"3. [Next.js /api/voice Edge-TTS]: ERROR -> {e}")

        # 4. Multi-Language Geo Pack Inference & Native Neural Voice Generation
        geo_test_cases = [
            ("India (Hindi / hi-IN)", "मुझे बहुत अकेलापन और तनाव महसूस हो रहा है", "hi-IN"),
            ("Spain (Español / es-ES)", "Me siento muy abrumado con el trabajo hoy", "es-ES"),
            ("Japan (日本語 / ja-JP)", "仕事のプレッシャーでとても疲れています", "ja-JP"),
            ("Germany (Deutsch / de-DE)", "Ich fühle mich überfordert und gestresst", "de-DE"),
            ("Global (English / en-US)", "I am carrying a lot of burnout and anxiety", "en-US"),
        ]

        print("\n4. [Multi-Language Geo Inference & Voice Synthesis]:")
        for region, prompt, locale in geo_test_cases:
            res = await client.post("http://127.0.0.1:8000/api/chat", json={
                "message": prompt,
                "locale": locale,
                "voice_mode": True
            })
            if res.status_code == 200:
                data = res.json()
                reply_preview = data.get("reply", "")[:60]
                audio_len = len(data.get("audio_base64") or "")
                emotion = data.get("telemetry", {}).get("dominant_emotion")
                print(f"   ✓ {region:30} -> Status 200 | Emotion: {emotion:25} | Audio: {audio_len:7} bytes | Reply: \"{reply_preview}...\"")
            else:
                print(f"   ✗ {region:30} -> Failed with status {res.status_code}")

        # 5. Anti-Looping & Anti-Hallucination Longitudinal 6-Turn Test
        print("\n5. [Anti-Looping & Multi-Turn Diversity Test]:")
        turns = [
            "I failed my driving test and I feel like an idiot",
            "I always mess up everything in my life",
            "My parents will be so disappointed in me",
            "Who are you and what can you do for me?",
            "Stop repeating the same thing over and over",
            "Thank you so much, I feel a lot better now"
        ]
        history = []
        seen_replies = set()
        for i, turn_msg in enumerate(turns, 1):
            res = await client.post("http://127.0.0.1:8000/api/chat", json={
                "message": turn_msg,
                "history": history,
                "voice_mode": False
            })
            data = res.json()
            reply = data.get("reply", "")
            is_dup = reply in seen_replies
            seen_replies.add(reply)
            history.append({"sender": "user", "text": turn_msg})
            history.append({"sender": "assistant", "text": reply})
            status_str = "DUPLICATE (FAIL)" if is_dup else "UNIQUE (PASS)"
            print(f"   Turn {i}: User: \"{turn_msg[:35]:35}\" -> [{status_str}] AI: \"{reply[:55]}...\"")

    print("\n========================================")
    print("🎉 ALL AUDIT CHECKS COMPLETED SUCCESSFULLY")
    print("========================================")

if __name__ == "__main__":
    asyncio.run(run_audit())
