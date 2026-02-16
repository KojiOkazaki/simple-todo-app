import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiProvider {
  constructor(apiKey, model = 'gemini-2.0-flash') {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model });
    this.modelName = model;
  }

  get name() {
    return 'gemini';
  }

  async generateInterviewerResponse(persona, question, candidateResponse, conversationHistory, config) {
    const historyText = conversationHistory
      .slice(-8)
      .map(m => `${m.speakerName}: ${m.content}`)
      .join('\n');

    const styleDesc = {
      friendly: '温和で親しみやすい',
      strict: '厳格で論理的',
      pressure: '圧迫面接スタイル',
      neutral: '中立的で冷静',
    };

    const prompt = `あなたは日本企業の面接官「${persona.name}」（${persona.role}）をロールプレイしてください。

## 面接官のキャラクター
- 名前: ${persona.name}
- 役職: ${persona.role}
- スタイル: ${styleDesc[persona.style] || '中立的で冷静'}
- 特徴: ${persona.description}

## 面接状況
- 候補者名: ${config.candidateName}
- 志望企業: ${config.targetCompany}
- 志望職種: ${config.targetPosition}
- 現在のフェーズ: ${question.phase}

## 直前の会話
${historyText}

## 質問
${question.text}

## 候補者の回答
${candidateResponse}

## 指示
候補者の回答に対して、以下のJSON形式で応答してください。

1. "reaction": 候補者の回答への短い反応（1〜2文。面接官のキャラクターに合った自然な日本語で）
2. "followUp": 候補者の回答内容に基づいた深掘り質問（1文。回答が十分な場合はnull）

必ず以下のJSON形式のみで回答してください。他のテキストは含めないでください:
{"reaction": "...", "followUp": "..." or null}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          reaction: parsed.reaction || '',
          followUp: parsed.followUp || null,
        };
      }
    } catch (e) {
      console.warn('[Gemini] Response generation failed:', e.message);
    }

    return { reaction: '', followUp: null };
  }

  async evaluateResponse(question, candidateResponse, config) {
    const prompt = `あなたは就活面接の評価エキスパートです。候補者の回答を詳しく評価してください。

## 質問
${question.text}
カテゴリ: ${question.category}
フェーズ: ${question.phase}

## 候補者の回答
${candidateResponse}

## 面接の文脈
- 志望企業: ${config.targetCompany}
- 志望職種: ${config.targetPosition}

## 評価基準
各項目を0〜5で評価してください:
- relevance: 質問への関連性・的確さ
- structure: 論理構成（STAR法など）
- specificity: 具体的なエピソード・数字の使用
- enthusiasm: 熱意・意欲の伝わり方
- communication: 簡潔さ・分かりやすさ

必ず以下のJSON形式のみで回答してください:
{
  "scores": {"relevance": 0, "structure": 0, "specificity": 0, "enthusiasm": 0, "communication": 0},
  "feedback": "総合的な一言フィードバック",
  "strengths": ["良かった点1", "良かった点2"],
  "improvements": ["改善点1", "改善点2"]
}`;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionId: question.id,
          question: question.text,
          response: candidateResponse,
          scores: {
            relevance: Math.min(5, Math.max(0, parsed.scores?.relevance || 0)),
            structure: Math.min(5, Math.max(0, parsed.scores?.structure || 0)),
            specificity: Math.min(5, Math.max(0, parsed.scores?.specificity || 0)),
            enthusiasm: Math.min(5, Math.max(0, parsed.scores?.enthusiasm || 0)),
            communication: Math.min(5, Math.max(0, parsed.scores?.communication || 0)),
          },
          feedback: parsed.feedback || '',
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
        };
      }
    } catch (e) {
      console.warn('[Gemini] Evaluation failed:', e.message);
    }

    return null;
  }

  async generateClosingResponse(persona, config, messageCount) {
    const styleDesc = {
      friendly: '温和',
      strict: '厳格',
      pressure: '圧迫',
      neutral: '中立',
    };

    const prompt = `あなたは面接官「${persona.name}」（${persona.role}、${styleDesc[persona.style] || '中立'}なスタイル）です。

面接を終了する挨拶を1〜2文で述べてください。候補者の名前は「${config.candidateName}」です。
${messageCount}回のやり取りがありました。面接官のキャラクターに合った自然な日本語で返してください。
挨拶のテキストのみを返してください。`;

    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (e) {
      console.warn('[Gemini] Closing failed:', e.message);
      return '';
    }
  }

  async generateTTSSpeech(text, voice = 'ja-JP-Neural2-B') {
    // TTS is handled separately via Google Cloud TTS API
    return null;
  }
}
