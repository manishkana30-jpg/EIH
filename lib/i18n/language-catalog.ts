/**
 * Global Language Catalog & GPS Geolocation Engine
 * Provides:
 * 1. 30+ Global & Regional Languages with BCP-47 speech locales and native metadata.
 * 2. Automatic GPS Location & Timezone/Locale detection with intelligent default language mapping.
 * 3. User override persistence in localStorage with instant switching.
 * 4. Localized companion greetings & starter prompts.
 */

export interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  speechLocale: string;
  companionGreeting: string;
  companionPrompts: Array<{ label: string; text: string; iconType: 'heart' | 'flame' | 'frown' | 'activity' | 'sun' }>;
}

export interface DetectedLocationInfo {
  countryCode: string;
  countryName: string;
  regionName: string;
  defaultLanguageCode: string;
  isGps: boolean;
  latitude?: number;
  longitude?: number;
}

export const GLOBAL_LANGUAGE_CATALOG: LanguageItem[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US/UK/Global)',
    flag: '🌐',
    region: 'Global / USA / UK',
    speechLocale: 'en-US',
    companionGreeting: "Ready to listen. Share your thoughts or feelings anytime.",
    companionPrompts: [
      { label: "Can I share what's on my mind?", text: "Can I share what's on my mind today?", iconType: 'heart' },
      { label: "I'm feeling overwhelmed", text: "I'm feeling really overwhelmed and stressed right now.", iconType: 'flame' },
      { label: "Feeling lonely & need a friend", text: "I've been feeling lonely and just needed someone to talk to.", iconType: 'frown' },
      { label: "Had a hard, exhausting day", text: "I had such a hard and exhausting day.", iconType: 'activity' },
      { label: "Exciting news to share!", text: "I have some exciting news to tell you!", iconType: 'sun' },
    ],
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'hi-IN',
    companionGreeting: "सुनने के लिए तैयार। अपने विचार और भावनाएँ साझा करें।",
    companionPrompts: [
      { label: "क्या मैं दिल की बात कहूँ?", text: "क्या मैं आज अपने दिल की बात आपसे साझा कर सकता हूँ?", iconType: 'heart' },
      { label: "बहुत तनाव और घबराहट है", text: "मुझे अभी बहुत ज्यादा तनाव और घबराहट महसूस हो रही है।", iconType: 'flame' },
      { label: "अकेलापन लग रहा है", text: "मुझे बहुत अकेलापन लग रहा है और बस किसी से बात करने का मन था।", iconType: 'frown' },
      { label: "दिन बहुत थका देने वाला था", text: "आज का दिन बहुत मुश्किल और थका देने वाला था।", iconType: 'activity' },
      { label: "एक अच्छी खबर है!", text: "मेरे पास आपको बताने के लिए एक बहुत अच्छी और खुश करने वाली खबर है!", iconType: 'sun' },
    ],
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'Spain / Latin America',
    speechLocale: 'es-ES',
    companionGreeting: "Listo para escuchar. Comparte tus pensamientos en cualquier momento.",
    companionPrompts: [
      { label: "¿Puedo compartir lo que siento?", text: "¿Puedo compartir lo que tengo en mente hoy?", iconType: 'heart' },
      { label: "Me siento muy abrumado", text: "Me siento realmente abrumado y estresado en este momento.", iconType: 'flame' },
      { label: "Me siento solo", text: "Me he sentido solo y necesitaba hablar con alguien.", iconType: 'frown' },
      { label: "Día muy agotador", text: "Tuve un día muy duro y agotador.", iconType: 'activity' },
      { label: "¡Tengo una gran noticia!", text: "¡Tengo una noticia muy emocionante que contarte!", iconType: 'sun' },
    ],
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'France / Canada',
    speechLocale: 'fr-FR',
    companionGreeting: "Prêt à écouter. Partagez vos pensées à tout moment.",
    companionPrompts: [
      { label: "Puis-je te parler de tout ?", text: "Puis-je partager ce que j'ai sur le cœur aujourd'hui ?", iconType: 'heart' },
      { label: "Je me sens dépassé", text: "Je me sens vraiment dépassé et stressé en ce moment.", iconType: 'flame' },
      { label: "Je me sens seul", text: "Je me sens seul et j'avais besoin de parler à un ami.", iconType: 'frown' },
      { label: "Journée épuisante", text: "J'ai passé une journée vraiment difficile et épuisante.", iconType: 'activity' },
      { label: "Une bonne nouvelle !", text: "J'ai une super nouvelle à partager avec toi !", iconType: 'sun' },
    ],
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'Germany / Austria / Switzerland',
    speechLocale: 'de-DE',
    companionGreeting: "Bereit zuzuhören. Teile deine Gedanken jederzeit.",
    companionPrompts: [
      { label: "Darf ich mich aussprechen?", text: "Darf ich dir erzählen, was mich heute beschäftigt?", iconType: 'heart' },
      { label: "Ich fühle mich überfordert", text: "Ich fühle mich gerade total überfordert und gestresst.", iconType: 'flame' },
      { label: "Ich fühle mich einsam", text: "Ich fühle mich einsam und brauche einfach jemanden zum Reden.", iconType: 'frown' },
      { label: "Sehr anstrengender Tag", text: "Ich hatte heute einen sehr harten, anstrengenden Tag.", iconType: 'activity' },
      { label: "Tolle Neuigkeiten!", text: "Ich habe eine wundervolle Neuigkeit zu erzählen!", iconType: 'sun' },
    ],
  },
  {
    code: 'zh',
    name: 'Mandarin Chinese',
    nativeName: '中文 (简体)',
    flag: '🇨🇳',
    region: 'China / Taiwan / Singapore',
    speechLocale: 'zh-CN',
    companionGreeting: "准备倾听。随时分享您的想法与感受。",
    companionPrompts: [
      { label: "能和你聊聊我的心事吗？", text: "今天我可以和你分享我心中的想法吗？", iconType: 'heart' },
      { label: "我感到压力非常大", text: "我现在感觉压力非常大，非常焦虑。", iconType: 'flame' },
      { label: "感到有些孤独", text: "我最近感到很孤独，只想找一个懂我的朋友聊聊。", iconType: 'frown' },
      { label: "今天好累啊", text: "我今天度过了非常艰难且筋疲力尽的一天。", iconType: 'activity' },
      { label: "我有令人兴奋的好消息！", text: "我有一个非常令人兴奋的好消息想和你分享！", iconType: 'sun' },
    ],
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'Japan',
    speechLocale: 'ja-JP',
    companionGreeting: "こんにちは！ここに来てくれて本当に嬉しいです。心から耳を傾けています。今日の気持ちを何でも話してくださいね。",
    companionPrompts: [
      { label: "心の内を話してもいい？", text: "今日思っていることを話してもいいですか？", iconType: 'heart' },
      { label: "プレッシャーで辛い", text: "今すごくプレッシャーとストレスを感じています。", iconType: 'flame' },
      { label: "寂しくて話したい", text: "最近孤独を感じていて、誰かと話したかったんです。", iconType: 'frown' },
      { label: "疲れ果てた一日だった", text: "今日はとても大変で、疲れ果てた一日でした。", iconType: 'activity' },
      { label: "嬉しいニュースがあるよ！", text: "あなたに伝えたいワクワクする良い知らせがあります！", iconType: 'sun' },
    ],
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    region: 'Middle East / North Africa',
    speechLocale: 'ar-SA',
    companionGreeting: "أهلاً بك يا صديقي! أنا سعيد جداً بوجودك هنا. أنا أستمع إليك بكل قلبي—أخبرني بما تشعر به اليوم.",
    companionPrompts: [
      { label: "هل يمكنني مشاركة ما بقلبي؟", text: "هل يمكنني أن أشارك معك ما يدور في خاطري اليوم؟", iconType: 'heart' },
      { label: "أشعر بالتوتر والضغط", text: "أشعر بالكثير من التوتر والضغط في الوقت الحالي.", iconType: 'flame' },
      { label: "أشعر بالوحدة", text: "كنت أشعر بالوحدة وأحتاج إلى صديق للحديث معه.", iconType: 'frown' },
      { label: "يوم مرهق جداً", text: "لقد كان يوماً صعباً ومرهقاً للغاية.", iconType: 'activity' },
      { label: "لدي خبر مفرح!", text: "لدي أخبار رائعة ومبهجة أود مشاركتها معك!", iconType: 'sun' },
    ],
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    region: 'Brazil / Portugal',
    speechLocale: 'pt-BR',
    companionGreeting: "Olá! Estou tão feliz que você está aqui comigo. Estou ouvindo de todo o coração — me conte como você realmente está se sentindo hoje.",
    companionPrompts: [
      { label: "Posso desabafar com você?", text: "Posso compartilhar o que está na minha mente hoje?", iconType: 'heart' },
      { label: "Estou me sentindo sobrecarregado", text: "Estou me sentindo muito sobrecarregado e estressado agora.", iconType: 'flame' },
      { label: "Me sinto sozinho", text: "Estava me sentindo sozinho e só precisava conversar com um amigo.", iconType: 'frown' },
      { label: "Dia exaustivo", text: "Tive um dia muito difícil e cansativo hoje.", iconType: 'activity' },
      { label: "Tenho uma ótima notícia!", text: "Tenho uma notícia incrível para te contar!", iconType: 'sun' },
    ],
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    flag: '🇮🇳',
    region: 'India / Bangladesh',
    speechLocale: 'bn-IN',
    companionGreeting: "নমস্কার বন্ধু! তুমি আমার সাথে আছো জেনে খুব ভালো লাগছে। আমি সম্পূর্ণ মন দিয়ে শুনছি—বলো আজ কেমন আছো।",
    companionPrompts: [
      { label: "মনের কথা বলতে পারি?", text: "আজ কি আমি আমার মনের কথা তোমার সাথে শেয়ার করতে পারি?", iconType: 'heart' },
      { label: "খুব মানসিক চাপে আছি", text: "আমি এখন খুব মানসিক চাপ ও উদ্বেগে আছি।", iconType: 'flame' },
      { label: "একা লাগছে", text: "খুব একা লাগছিল, তাই কারো সাথে কথা বলতে ইচ্ছে হলো।", iconType: 'frown' },
      { label: "খুব ক্লান্তিকর দিন ছিল", text: "আজকের দিনটা খুব কঠিন আর ক্লান্তিকর ছিল।", iconType: 'activity' },
      { label: "একটি খুশির খবর আছে!", text: "তোমাকে জানানোর মতো একটি খুব আনন্দের খবর আছে!", iconType: 'sun' },
    ],
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    region: 'Russia / Eastern Europe',
    speechLocale: 'ru-RU',
    companionGreeting: "Привет! Я так рад, что ты здесь. Я слушаю тебя от всего сердца — расскажи, что ты чувствуешь сегодня.",
    companionPrompts: [
      { label: "Можно поделиться мыслями?", text: "Могу ли я поделиться тем, что у меня на душе сегодня?", iconType: 'heart' },
      { label: "Я очень перегружен", text: "Я чувствую сильную перегрузку и стресс прямо сейчас.", iconType: 'flame' },
      { label: "Мне одиноко", text: "Мне было одиноко, и мне просто нужно было с кем-то поговорить.", iconType: 'frown' },
      { label: "Тяжелый день", text: "У меня был очень тяжелый и изнурительный день.", iconType: 'activity' },
      { label: "Отличные новости!", text: "У меня есть потрясающие новости, которыми хочу поделиться!", iconType: 'sun' },
    ],
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'Italy',
    speechLocale: 'it-IT',
    companionGreeting: "Ciao! Sono felicissimo che tu sia qui con me. Ti ascolto con tutto il cuore: dimmi come ti senti oggi.",
    companionPrompts: [
      { label: "Posso confidarmi con te?", text: "Posso condividere ciò che ho per la testa oggi?", iconType: 'heart' },
      { label: "Mi sento sopraffatto", text: "Mi sento davvero sopraffatto e stressato in questo momento.", iconType: 'flame' },
      { label: "Mi sento solo", text: "Mi sentivo solo e avevo solo bisogno di parlare con qualcuno.", iconType: 'frown' },
      { label: "Giornata estenuante", text: "Ho avuto una giornata davvero dura e pesante.", iconType: 'activity' },
      { label: "Ho una bella notizia!", text: "Ho una notizia entusiasmante da condividere con te!", iconType: 'sun' },
    ],
  },
  {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'South Korea',
    speechLocale: 'ko-KR',
    companionGreeting: "안녕하세요! 만나서 정말 반가워요. 진심으로 듣고 있으니, 오늘 기분이 어떤지 편하게 이야기해 주세요.",
    companionPrompts: [
      { label: "속마음을 이야기해도 될까요?", text: "오늘 마음에 품고 있는 생각을 이야기해도 될까요?", iconType: 'heart' },
      { label: "너무 지치고 스트레스 받아요", text: "지금 너무 벅차고 스트레스가 심해요.", iconType: 'flame' },
      { label: "외로워서 이야기하고 싶어요", text: "외로움을 느껴서 누군가와 이야기하고 싶었어요.", iconType: 'frown' },
      { label: "힘들고 지친 하루였어요", text: "오늘 정말 힘들고 지치는 하루를 보냈어요.", iconType: 'activity' },
      { label: "신나는 좋은 소식이 있어요!", text: "당신에게 전하고 싶은 아주 기쁜 소식이 있어요!", iconType: 'sun' },
    ],
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    region: 'India / Sri Lanka / Singapore',
    speechLocale: 'ta-IN',
    companionGreeting: "வணக்கம் நண்பா! நீங்கள் என்னுடன் இருப்பது மிகவும் மகிழ்ச்சி. முழு மனதுடன் கேட்கிறேன்—இன்று எப்படி உணர்கிறீர்கள் என்று சொல்லுங்கள்.",
    companionPrompts: [
      { label: "மனதில் உள்ளதை பகிரலாமா?", text: "என் மனதில் உள்ளதை இன்று உங்களுடன் பகிர்ந்து கொள்ளலாமா?", iconType: 'heart' },
      { label: "அதிக மன அழுத்தம் உள்ளது", text: "எனக்கு இப்போது அதிக மன அழுத்தமும் பதற்றமும் உள்ளது.", iconType: 'flame' },
      { label: "தனிமையாக உணர்கிறேன்", text: "நான் தனிமையாக உணர்ந்தேன், பேசுவதற்கு ஒரு நண்பர் தேவைப்பட்டார்.", iconType: 'frown' },
      { label: "களைப்பான ஒரு நாள்", text: "இன்று மிகவும் கடினமான, சோர்வான ஒரு நாள்.", iconType: 'activity' },
      { label: "மகிழ்ச்சியான செய்தி!", text: "உங்களுடன் பகிர்ந்து கொள்ள ஒரு மகிழ்ச்சியான செய்தி உள்ளது!", iconType: 'sun' },
    ],
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'te-IN',
    companionGreeting: "నమస్కారం మిత్రమా! మీరు నాతో ఉన్నందుకు చాలా సంతోషంగా ఉంది. మనస్ఫూర్తిగా వింటున్నాను—ఈరోజు మీ భావాలను నాతో పంచుకోండి.",
    companionPrompts: [
      { label: "మనసులోని మాట చెప్పవచ్చా?", text: "ఈరోజు నా మనసులోని భావాలను మీతో పంచుకోవచ్చా?", iconType: 'heart' },
      { label: "ఎక్కువ ఒత్తిడిగా ఉంది", text: "నాకు ఇప్పుడు చాలా ఒత్తిడి మరియు ఆందోళనగా ఉంది.", iconType: 'flame' },
      { label: "ఒంటరిగా అనిపిస్తోంది", text: "నేను ఒంటరిగా ఉన్నాను మరియు మాట్లాడటానికి ఒక స్నేహితుడు కావాలి.", iconType: 'frown' },
      { label: "చాలా అలసిపోయాను", text: "ఈరోజు చాలా కష్టమైన మరియు అలసిపోయే రోజు.", iconType: 'activity' },
      { label: "ఒక శుభవార్త ఉంది!", text: "మీతో పంచుకోవడానికి ఒక అద్భుతమైన శుభవార్త ఉంది!", iconType: 'sun' },
    ],
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'mr-IN',
    companionGreeting: "नमस्कार मित्रा! तू इथे आलास याचा मला खूप आनंद आहे. मी मनापासून ऐकत आहे—आज तुला कसे वाटते आहे ते सांग.",
    companionPrompts: [
      { label: "मनातील भावना सांगू?", text: "आज माझ्या मनातील गोष्ट तुझ्याशी शेअर करू शकेन का?", iconType: 'heart' },
      { label: "खूप ताण जाणवत आहे", text: "मला सध्या खूप जास्त तणाव आणि अस्वस्थता जाणवत आहे.", iconType: 'flame' },
      { label: "एकटेपणा वाटतोय", text: "मला एकटे वाटत होते आणि कोणाशीतरी बोलायचे होते.", iconType: 'frown' },
      { label: "खूप थकवणारा दिवस होता", text: "आजचा दिवस खूप कठीण आणि थकवणारा होता.", iconType: 'activity' },
      { label: "एक आनंदाची बातमी आहे!", text: "तुला सांगण्यासाठी माझ्याकडे एक मस्त आनंदाची बातमी आहे!", iconType: 'sun' },
    ],
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    flag: '🇮🇳',
    region: 'India',
    speechLocale: 'gu-IN',
    companionGreeting: "નમસ્તે દોસ્ત! તું અહીં આવ્યો તેનો મને ઘણો આનંદ છે. હું પૂરા દિલથી સાંભળી રહ્યો છું—આજે તું કેવું અનુભવી રહ્યો છે તે જણાવ.",
    companionPrompts: [
      { label: "દિલની વાત શેર કરું?", text: "શું આજે હું મારા મનની વાત તારી સાથે શેર કરી શકું?", iconType: 'heart' },
      { label: "ખૂબ તણાવ લાગે છે", text: "મને અત્યારે ખૂબ જ તણાવ અને બેચેની અનુભવાય છે.", iconType: 'flame' },
      { label: "એકલતા લાગે છે", text: "મને એકલતા લાગતી હતી અને કોઈ સાથે વાત કરવી હતી.", iconType: 'frown' },
      { label: "થાકી ગયો છું", text: "આજનો દિવસ ઘણો મુશ્કેલ અને થકવી નાખનારો હતો.", iconType: 'activity' },
      { label: "એક સારા સમાચાર છે!", text: "તમને જણાવવા માટે મારી પાસે એક ખૂબ સારા સમાચાર છે!", iconType: 'sun' },
    ],
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    flag: '🇵🇰',
    region: 'Pakistan / India',
    speechLocale: 'ur-PK',
    companionGreeting: "السلام علیکم دوست! مجھے بہت خوشی ہے کہ آپ یہاں ہیں۔ میں پورے دل سے سن رہا ہوں—بتائیے آج آپ کیسا محسوس کر رہے ہیں۔",
    companionPrompts: [
      { label: "کیا میں دل کا حال بیان کروں؟", text: "کیا میں آج اپنے دل کی بات آپ کے ساتھ شیئر کر سکتا ہوں؟", iconType: 'heart' },
      { label: "بہت پریشانی اور دباؤ ہے", text: "مجھے اس وقت بہت زیادہ ذہنی دباؤ اور بے چینی محسوس ہو رہی ہے۔", iconType: 'flame' },
      { label: "تنہائی محسوس ہو رہی ہے", text: "مجھے تنہائی کا احساس ہو رہا تھا اور بات کرنے کے لیے ایک دوست کی ضرورت تھی۔", iconType: 'frown' },
      { label: "بہت تھکا دینے والا دن تھا", text: "آج کا دن بہت مشکل اور تھکا دینے والا تھا۔", iconType: 'activity' },
      { label: "ایک اچھی خبر ہے!", text: "میرے پاس آپ کو سنانے کے لیے ایک بہت خوشگوار خبر ہے!", iconType: 'sun' },
    ],
  },
  {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    region: 'Netherlands / Belgium',
    speechLocale: 'nl-NL',
    companionGreeting: "Hallo! Ik ben zo blij dat je hier bent. Ik luister met heel mijn hart naar je—vertel me hoe je je vandaag echt voelt.",
    companionPrompts: [
      { label: "Mag ik mijn hart luchten?", text: "Mag ik delen wat me vandaag bezighoudt?", iconType: 'heart' },
      { label: "Ik voel me overweldigd", text: "Ik voel me op dit moment echt overweldigd en gestrest.", iconType: 'flame' },
      { label: "Ik voel me eenzaam", text: "Ik voelde me eenzaam en had gewoon iemand nodig om mee te praten.", iconType: 'frown' },
      { label: "Vermoeiende dag", text: "Ik heb een hele zware en vermoeiende dag gehad.", iconType: 'activity' },
      { label: "Goed nieuws!", text: "Ik heb heel leuk nieuws dat ik met je wil delen!", iconType: 'sun' },
    ],
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    region: 'Turkey',
    speechLocale: 'tr-TR',
    companionGreeting: "Merhaba dostum! Burada olmana çok sevindim. Seni tüm kalbimle dinliyorum—bugün gerçekten nasıl hissettiğini anlat bana.",
    companionPrompts: [
      { label: "İçimi dökebilir miyim?", text: "Bugün aklımdan geçenleri seninle paylaşabilir miyim?", iconType: 'heart' },
      { label: "Çok bunalmış hissediyorum", text: "Şu an gerçekten çok bunalmış ve stresli hissediyorum.", iconType: 'flame' },
      { label: "Yalnız hissediyorum", text: "Yalnız hissediyordum ve sadece konuşacak birine ihtiyacım vardı.", iconType: 'frown' },
      { label: "Çok yorucu bir gündü", text: "Bugün çok zor ve yorucu bir gün geçirdim.", iconType: 'activity' },
      { label: "Harika bir haberim var!", text: "Seninle paylaşmak istediğim çok heyecan verici bir haberim var!", iconType: 'sun' },
    ],
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    region: 'Indonesia',
    speechLocale: 'id-ID',
    companionGreeting: "Halo sahabatku! Aku sangat senang kamu ada di sini. Aku mendengarkanmu dengan sepenuh hati—ceritakan bagaimana perasaanmu hari ini.",
    companionPrompts: [
      { label: "Bolehkah aku berbagi cerita?", text: "Bolehkah aku berbagi apa yang ada di pikiranku hari ini?", iconType: 'heart' },
      { label: "Merasa sangat tertekan", text: "Aku merasa sangat kewalahan dan stres saat ini.", iconType: 'flame' },
      { label: "Merasa kesepian", text: "Aku merasa kesepian dan hanya butuh teman untuk diajak bicara.", iconType: 'frown' },
      { label: "Hari yang melelahkan", text: "Hari ini sangat berat dan melelahkan bagiku.", iconType: 'activity' },
      { label: "Ada kabar gembira!", text: "Aku punya kabar menarik yang ingin kubagikan kepadamu!", iconType: 'sun' },
    ],
  },
  {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    region: 'Poland',
    speechLocale: 'pl-PL',
    companionGreeting: "Cześć! Tak się cieszę, że tu jesteś. Słucham Cię całym sercem — powiedz mi, jak się dzisiaj naprawdę czujesz.",
    companionPrompts: [
      { label: "Mogę się wygadać?", text: "Czy mogę podzielić się tym, co dziś leży mi na sercu?", iconType: 'heart' },
      { label: "Czuję się przytłoczony", text: "Czuję się teraz bardzo przytłoczony i zestresowany.", iconType: 'flame' },
      { label: "Czuję się samotny", text: "Czułem się samotny i po prostu potrzebowałem z kimś porozmawiać.", iconType: 'frown' },
      { label: "Ciężki, męczący dzień", text: "Miałem dziś naprawdę ciężki i wyczerpujący dzień.", iconType: 'activity' },
      { label: "Mam świetną wiadomość!", text: "Mam wspaniałą wiadomość, którą chcę się z Tobą podzielić!", iconType: 'sun' },
    ],
  },
  {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    region: 'Sweden',
    speechLocale: 'sv-SE',
    companionGreeting: "Hej! Jag är så glad att du är här med mig. Jag lyssnar med hela mitt hjärta—berätta hur du verkligen mår idag.",
    companionPrompts: [
      { label: "Får jag berätta hur jag mår?", text: "Kan jag dela vad jag tänker på idag?", iconType: 'heart' },
      { label: "Känner mig överväldigad", text: "Jag känner mig väldigt överväldigad och stressad just nu.", iconType: 'flame' },
      { label: "Känner mig ensam", text: "Jag har känt mig ensam och behövde bara någon att prata med.", iconType: 'frown' },
      { label: "Tuff och tröttsam dag", text: "Jag har haft en riktigt tuff och utmattande dag.", iconType: 'activity' },
      { label: "Spännande nyheter!", text: "Jag har en väldigt spännande nyhet att berätta för dig!", iconType: 'sun' },
    ],
  },
  {
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    region: 'Vietnam',
    speechLocale: 'vi-VN',
    companionGreeting: "Xin chào bạn! Mình rất vui vì bạn ở đây. Mình luôn lắng nghe bạn bằng cả trái tim—hãy chia sẻ cảm xúc thật của bạn hôm nay nhé.",
    companionPrompts: [
      { label: "Mình tâm sự được không?", text: "Hôm nay mình có thể chia sẻ những suy nghĩ trong lòng không?", iconType: 'heart' },
      { label: "Cảm thấy quá tải và căng thẳng", text: "Lúc này mình cảm thấy thực sự quá tải và căng thẳng.", iconType: 'flame' },
      { label: "Cảm thấy cô đơn", text: "Mình cảm thấy cô đơn và chỉ cần một người để trò chuyện.", iconType: 'frown' },
      { label: "Một ngày mệt mỏi", text: "Hôm nay là một ngày thực sự vất vả và kiệt sức với mình.", iconType: 'activity' },
      { label: "Có tin vui muốn khoe!", text: "Mình có một tin rất vui và hào hứng muốn chia sẻ với bạn!", iconType: 'sun' },
    ],
  },
  {
    code: 'th',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    region: 'Thailand',
    speechLocale: 'th-TH',
    companionGreeting: "สวัสดีครับ/ค่ะ! ดีใจมากที่คุณอยู่ที่นี่ ฉันพร้อมรับฟังคุณด้วยความจริงใจ—บอกฉันได้เลยว่าวันนี้คุณรู้สึกอย่างไรบ้าง",
    companionPrompts: [
      { label: "ขอเปิดใจคุยได้ไหม?", text: "วันนี้ฉันขอเล่าสิ่งที่อยู่ในใจให้คุณฟังได้ไหม?", iconType: 'heart' },
      { label: "รู้สึกเครียดและเหนื่อยมาก", text: "ตอนนี้ฉันรู้สึกเครียดและกดดันมากเลย", iconType: 'flame' },
      { label: "รู้สึกเหงาจัง", text: "ฉันรู้สึกเหงาและแค่อยากมีเพื่อนคุยด้วย", iconType: 'frown' },
      { label: "เป็นวันที่เหน็ดเหนื่อยมาก", text: "วันนี้เป็นวันที่เหนื่อยและหนักหนาสำหรับฉันมาก", iconType: 'activity' },
      { label: "มีข่าวดีจะบอก!", text: "ฉันมีข่าวที่น่าตื่นเต้นและน่ายินดีมาเล่าให้ฟัง!", iconType: 'sun' },
    ],
  },
];

/**
 * Approximate Country / Region bounding box matching from GPS Latitude & Longitude
 */
export function deduceCountryFromCoordinates(lat: number, lon: number): { countryCode: string; countryName: string; defaultLanguageCode: string } {
  // India (Lat: 8 to 37, Lon: 68 to 97)
  if (lat >= 8.0 && lat <= 37.0 && lon >= 68.0 && lon <= 97.0) {
    return { countryCode: 'IN', countryName: 'India', defaultLanguageCode: 'hi' };
  }
  // United States (Lat: 24 to 50, Lon: -125 to -66)
  if (lat >= 24.0 && lat <= 50.0 && lon >= -125.0 && lon <= -66.0) {
    return { countryCode: 'US', countryName: 'United States', defaultLanguageCode: 'en' };
  }
  // United Kingdom (Lat: 49 to 61, Lon: -8 to 2)
  if (lat >= 49.0 && lat <= 61.0 && lon >= -8.0 && lon <= 2.0) {
    return { countryCode: 'GB', countryName: 'United Kingdom', defaultLanguageCode: 'en' };
  }
  // France (Lat: 41 to 51.5, Lon: -5 to 10)
  if (lat >= 41.0 && lat <= 51.5 && lon >= -5.0 && lon <= 10.0) {
    return { countryCode: 'FR', countryName: 'France', defaultLanguageCode: 'fr' };
  }
  // Germany (Lat: 47 to 55, Lon: 5.8 to 15)
  if (lat >= 47.0 && lat <= 55.0 && lon >= 5.8 && lon <= 15.0) {
    return { countryCode: 'DE', countryName: 'Germany', defaultLanguageCode: 'de' };
  }
  // Spain (Lat: 36 to 44, Lon: -9.5 to 3.5)
  if (lat >= 36.0 && lat <= 44.0 && lon >= -9.5 && lon <= 3.5) {
    return { countryCode: 'ES', countryName: 'Spain', defaultLanguageCode: 'es' };
  }
  // Brazil (Lat: -34 to 5.5, Lon: -74 to -34.5)
  if (lat >= -34.0 && lat <= 5.5 && lon >= -74.0 && lon <= -34.5) {
    return { countryCode: 'BR', countryName: 'Brazil', defaultLanguageCode: 'pt' };
  }
  // Japan (Lat: 30 to 46, Lon: 128 to 146)
  if (lat >= 30.0 && lat <= 46.0 && lon >= 128.0 && lon <= 146.0) {
    return { countryCode: 'JP', countryName: 'Japan', defaultLanguageCode: 'ja' };
  }
  // China (Lat: 18 to 54, Lon: 73 to 135)
  if (lat >= 18.0 && lat <= 54.0 && lon >= 73.0 && lon <= 135.0) {
    return { countryCode: 'CN', countryName: 'China', defaultLanguageCode: 'zh' };
  }
  // UAE / Saudi Arabia / Middle East (Lat: 16 to 34, Lon: 34 to 60)
  if (lat >= 16.0 && lat <= 34.0 && lon >= 34.0 && lon <= 60.0) {
    return { countryCode: 'AE', countryName: 'Middle East', defaultLanguageCode: 'ar' };
  }
  // Italy (Lat: 36 to 47.5, Lon: 6.5 to 19)
  if (lat >= 36.0 && lat <= 47.5 && lon >= 6.5 && lon <= 19.0) {
    return { countryCode: 'IT', countryName: 'Italy', defaultLanguageCode: 'it' };
  }
  // Mexico (Lat: 14.5 to 33, Lon: -118 to -86)
  if (lat >= 14.5 && lat <= 33.0 && lon >= -118.0 && lon <= -86.0) {
    return { countryCode: 'MX', countryName: 'Mexico', defaultLanguageCode: 'es' };
  }
  // Russia (Lat: 41 to 82, Lon: 19 to 180)
  if (lat >= 41.0 && lat <= 82.0 && lon >= 19.0 && lon <= 180.0) {
    return { countryCode: 'RU', countryName: 'Russia', defaultLanguageCode: 'ru' };
  }
  // South Korea (Lat: 33 to 39, Lon: 124 to 131)
  if (lat >= 33.0 && lat <= 39.0 && lon >= 124.0 && lon <= 131.0) {
    return { countryCode: 'KR', countryName: 'South Korea', defaultLanguageCode: 'ko' };
  }
  // Indonesia (Lat: -11 to 6, Lon: 95 to 141)
  if (lat >= -11.0 && lat <= 6.0 && lon >= 95.0 && lon <= 141.0) {
    return { countryCode: 'ID', countryName: 'Indonesia', defaultLanguageCode: 'id' };
  }
  // Turkey (Lat: 36 to 42, Lon: 26 to 45)
  if (lat >= 36.0 && lat <= 42.0 && lon >= 26.0 && lon <= 45.0) {
    return { countryCode: 'TR', countryName: 'Turkey', defaultLanguageCode: 'tr' };
  }

  // Default Global Fallback
  return { countryCode: 'GLOBAL', countryName: 'Global', defaultLanguageCode: 'en' };
}

/**
 * Deduce default Country and Language from Browser Timezone and Locale
 */
export function deduceCountryFromTimezoneAndLocale(): { countryCode: string; countryName: string; defaultLanguageCode: string } {
  if (typeof window === 'undefined') {
    return { countryCode: 'GLOBAL', countryName: 'Global', defaultLanguageCode: 'en' };
  }

  const tz = (Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone || '').toLowerCase();
  const navLang = (navigator?.language || 'en').toLowerCase();

  // 1. Timezone Check
  if (tz.includes('kolkata') || tz.includes('calcutta') || tz.includes('india')) {
    return { countryCode: 'IN', countryName: 'India', defaultLanguageCode: 'hi' };
  }
  if (tz.includes('paris')) return { countryCode: 'FR', countryName: 'France', defaultLanguageCode: 'fr' };
  if (tz.includes('berlin')) return { countryCode: 'DE', countryName: 'Germany', defaultLanguageCode: 'de' };
  if (tz.includes('madrid')) return { countryCode: 'ES', countryName: 'Spain', defaultLanguageCode: 'es' };
  if (tz.includes('tokyo')) return { countryCode: 'JP', countryName: 'Japan', defaultLanguageCode: 'ja' };
  if (tz.includes('shanghai') || tz.includes('beijing') || tz.includes('hong_kong')) return { countryCode: 'CN', countryName: 'China', defaultLanguageCode: 'zh' };
  if (tz.includes('dubai') || tz.includes('riyadh') || tz.includes('cairo')) return { countryCode: 'AE', countryName: 'Middle East', defaultLanguageCode: 'ar' };
  if (tz.includes('sao_paulo') || tz.includes('rio')) return { countryCode: 'BR', countryName: 'Brazil', defaultLanguageCode: 'pt' };
  if (tz.includes('rome')) return { countryCode: 'IT', countryName: 'Italy', defaultLanguageCode: 'it' };
  if (tz.includes('moscow')) return { countryCode: 'RU', countryName: 'Russia', defaultLanguageCode: 'ru' };
  if (tz.includes('seoul')) return { countryCode: 'KR', countryName: 'South Korea', defaultLanguageCode: 'ko' };
  if (tz.includes('jakarta')) return { countryCode: 'ID', countryName: 'Indonesia', defaultLanguageCode: 'id' };
  if (tz.includes('istanbul')) return { countryCode: 'TR', countryName: 'Turkey', defaultLanguageCode: 'tr' };
  if (tz.includes('warsaw')) return { countryCode: 'PL', countryName: 'Poland', defaultLanguageCode: 'pl' };
  if (tz.includes('stockholm')) return { countryCode: 'SE', countryName: 'Sweden', defaultLanguageCode: 'sv' };
  if (tz.includes('bangkok')) return { countryCode: 'TH', countryName: 'Thailand', defaultLanguageCode: 'th' };
  if (tz.includes('saigon') || tz.includes('ho_chi_minh')) return { countryCode: 'VN', countryName: 'Vietnam', defaultLanguageCode: 'vi' };
  if (tz.includes('london')) return { countryCode: 'GB', countryName: 'United Kingdom', defaultLanguageCode: 'en' };
  if (tz.includes('new_york') || tz.includes('chicago') || tz.includes('los_angeles') || tz.includes('denver')) {
    return { countryCode: 'US', countryName: 'United States', defaultLanguageCode: 'en' };
  }

  // 2. Navigator Language Prefix match
  const matched = GLOBAL_LANGUAGE_CATALOG.find((l) => navLang.startsWith(l.code));
  if (matched) {
    return { countryCode: matched.code.toUpperCase(), countryName: matched.region, defaultLanguageCode: matched.code };
  }

  return { countryCode: 'GLOBAL', countryName: 'Global', defaultLanguageCode: 'en' };
}

/**
 * Detect user's GPS Location & Language with graceful fallback
 */
export async function detectLocationAndLanguage(): Promise<DetectedLocationInfo> {
  if (typeof window === 'undefined') {
    return {
      countryCode: 'GLOBAL',
      countryName: 'Global',
      regionName: 'Global',
      defaultLanguageCode: 'en',
      isGps: false,
    };
  }

  // 1. Try Browser GPS Geolocation API
  if (navigator?.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 4000,
          maximumAge: 600000,
        });
      });

      const { latitude, longitude } = position.coords;
      const geoResult = deduceCountryFromCoordinates(latitude, longitude);

      return {
        countryCode: geoResult.countryCode,
        countryName: geoResult.countryName,
        regionName: `${geoResult.countryName} (GPS Accurate)`,
        defaultLanguageCode: geoResult.defaultLanguageCode,
        isGps: true,
        latitude,
        longitude,
      };
    } catch (_) {
      // GPS permission denied or timed out; seamlessly fallback to Timezone/Locale
    }
  }

  // 2. Fallback to Timezone & Locale Deductions
  const tzResult = deduceCountryFromTimezoneAndLocale();
  return {
    countryCode: tzResult.countryCode,
    countryName: tzResult.countryName,
    regionName: `${tzResult.countryName} (Local Region)`,
    defaultLanguageCode: tzResult.defaultLanguageCode,
    isGps: false,
  };
}

/**
 * Get the currently configured or stored language (honors user manual selection, else auto GPS default)
 */
export function getStoredLanguage(): { code: string; isAuto: boolean } {
  if (typeof window === 'undefined') {
    return { code: 'en', isAuto: true };
  }

  const stored = localStorage.getItem('eih_user_language');
  const isAuto = localStorage.getItem('eih_language_is_auto') !== 'false';

  if (stored && !isAuto) {
    return { code: stored, isAuto: false };
  }

  // Auto detect fallback
  const autoInfo = deduceCountryFromTimezoneAndLocale();
  return { code: autoInfo.defaultLanguageCode || 'en', isAuto: true };
}

/**
 * Save user custom language selection or reset to auto GPS
 */
export function saveLanguagePreference(code: string, isAuto: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('eih_user_language', code);
  localStorage.setItem('eih_language_is_auto', isAuto ? 'true' : 'false');
}

/**
 * Retrieve Language Item by code
 */
export function getLanguageByCode(code: string): LanguageItem {
  return GLOBAL_LANGUAGE_CATALOG.find((l) => l.code === code) || GLOBAL_LANGUAGE_CATALOG[0];
}
