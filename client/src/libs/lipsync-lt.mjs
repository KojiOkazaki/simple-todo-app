// Stub Lithuanian lipsync module for TalkingHead
// Provides basic viseme mapping for Lithuanian text

const rules_lt = {
  'a': 'aa', 'e': 'E', 'i': 'I', 'o': 'O', 'u': 'U',
  'ą': 'aa', 'ę': 'E', 'į': 'I', 'ų': 'U', 'ū': 'U',
  'ė': 'E', 'č': 'CH', 'š': 'SS', 'ž': 'SS',
  'b': 'PP', 'p': 'PP', 'm': 'PP',
  'f': 'FF', 'v': 'FF',
  't': 'DD', 'd': 'DD', 'n': 'nn', 'l': 'nn',
  'k': 'kk', 'g': 'kk',
  'r': 'RR',
  's': 'SS', 'z': 'SS',
  'j': 'CH', 'h': 'CH',
};

class LipsyncLt {
  preProcessText(s) {
    return s.replace(/[^\w\sąęįųūėčšž]/g, '').toLowerCase();
  }

  wordsToVisemes(word) {
    const visemes = [];
    let t = 0;
    const duration = 0.1;
    for (const ch of word.toLowerCase()) {
      const v = rules_lt[ch] || 'sil';
      visemes.push({ viseme: v, time: t });
      t += duration;
    }
    if (visemes.length === 0) {
      visemes.push({ viseme: 'sil', time: 0 });
    }
    return { visemes, duration: t || 0.1 };
  }
}

export { LipsyncLt };
