// Stub Finnish lipsync module for TalkingHead
// Provides basic viseme mapping for Finnish text

const rules_fi = {
  'a': 'aa', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
  'ä': 'aa', 'ö': 'O', 'y': 'U',
  'b': 'PP', 'p': 'PP', 'm': 'PP',
  'f': 'FF', 'v': 'FF',
  't': 'DD', 'd': 'DD', 'n': 'nn', 'l': 'nn',
  'k': 'kk', 'g': 'kk',
  'r': 'RR',
  's': 'SS', 'z': 'SS',
  'j': 'CH', 'h': 'CH',
};

class LipsyncFi {
  preProcessText(s) {
    return s.replace(/[^\w\sÄäÖöÅå]/g, '').toLowerCase();
  }

  wordsToVisemes(word) {
    const visemes = [];
    let t = 0;
    const duration = 0.1;
    for (const ch of word.toLowerCase()) {
      const v = rules_fi[ch] || 'sil';
      visemes.push({ viseme: v, time: t });
      t += duration;
    }
    if (visemes.length === 0) {
      visemes.push({ viseme: 'sil', time: 0 });
    }
    return { visemes, duration: t || 0.1 };
  }
}

export { LipsyncFi };
