import OpenAI from 'openai';

export class OpenAIProvider {
  constructor(apiKey, model = 'gpt-4') {
    this.client = new OpenAI({ apiKey });
    this.modelName = model;
  }

  get name() {
    return 'openai';
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

    const systemPrompt = `あなたは日本企業の面接官「${persona.name}」（${persona.role}）です。
スタイル: ${styleDesc[persona.style] || '中立的で冷静'}
特徴: ${persona.description}
必ずJSON形式のみで応答してください。`;

    const userPrompt = `## 面接状況
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

以下のJSON形式で応答してください:
{"reaction": "候補者への短い反応（1〜2文）", "followUp": "深掘り質問（1文）またはnull"}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (text) {
        const parsed = JSON.parse(text);
        return {
          reaction: parsed.reaction || '',
          followUp: parsed.followUp || null,
        };
      }
    } catch (e) {
      console.warn('[OpenAI] Response generation failed:', e.message);
    }

    return { reaction: '', followUp: null };
  }

  async evaluateResponse(question, candidateResponse, config) {
    const systemPrompt = `あなたは就活面接の評価エキスパートです。必ずJSON形式のみで応答してください。`;

    const userPrompt = `## 質問
${question.text}
カテゴリ: ${question.category}
フェーズ: ${question.phase}

## 候補者の回答
${candidateResponse}

## 面接の文脈
- 志望企業: ${config.targetCompany}
- 志望職種: ${config.targetPosition}

## 評価基準（各0〜5）
- relevance: 質問への関連性・的確さ
- structure: 論理構成（STAR法など）
- specificity: 具体的なエピソード・数字の使用
- enthusiasm: 熱意・意欲の伝わり方
- communication: 簡潔さ・分かりやすさ

以下のJSON形式で回答:
{
  "scores": {"relevance": 0, "structure": 0, "specificity": 0, "enthusiasm": 0, "communication": 0},
  "feedback": "総合的な一言フィードバック",
  "strengths": ["良かった点1", "良かった点2"],
  "improvements": ["改善点1", "改善点2"]
}`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const text = response.choices[0]?.message?.content?.trim();
      if (text) {
        const parsed = JSON.parse(text);
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
      console.warn('[OpenAI] Evaluation failed:', e.message);
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

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          {
            role: 'system',
            content: `あなたは面接官「${persona.name}」（${persona.role}、${styleDesc[persona.style] || '中立'}なスタイル）です。`,
          },
          {
            role: 'user',
            content: `面接を終了する挨拶を1〜2文で述べてください。候補者の名前は「${config.candidateName}」です。${messageCount}回のやり取りがありました。挨拶のテキストのみを返してください。`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return response.choices[0]?.message?.content?.trim() || '';
    } catch (e) {
      console.warn('[OpenAI] Closing failed:', e.message);
      return '';
    }
  }
}
