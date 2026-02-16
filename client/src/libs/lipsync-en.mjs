// Stub English lipsync module for TalkingHead
// Provides basic viseme mapping for English text

const defined_visemes = {
  'aa': 'aa', 'E': 'E', 'I': 'I', 'O': 'O', 'U': 'U',
  'PP': 'PP', 'FF': 'FF', 'TH': 'TH', 'DD': 'DD',
  'kk': 'kk', 'CH': 'CH', 'SS': 'SS', 'nn': 'nn',
  'RR': 'RR', 'sil': 'sil'
};

const rules_en = {
  'a': 'aa', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
  'b': 'PP', 'p': 'PP', 'm': 'PP',
  'f': 'FF', 'v': 'FF',
  't': 'DD', 'd': 'DD', 'n': 'nn', 'l': 'nn',
  'k': 'kk', 'g': 'kk',
  'c': 'kk', 'q': 'kk',
  'r': 'RR',
  's': 'SS', 'z': 'SS', 'x': 'SS',
  'j': 'CH', 'h': 'CH',
  'w': 'U', 'y': 'I',
};

class LipsyncEn {
  preProcessText(s) {
    return s.replace(/[^\w\s]/g, '').toLowerCase();
  }

  wordsToVisemes(word) {
    const visemes = [];
    let t = 0;
    const duration = 0.1;
    for (const ch of word.toLowerCase()) {
      const v = rules_en[ch] || 'sil';
      visemes.push({ viseme: v, time: t });
      t += duration;
    }
    if (visemes.length === 0) {
      visemes.push({ viseme: 'sil', time: 0 });
    }
    return { visemes, duration: t || 0.1 };
  }
}

export { LipsyncEn };
