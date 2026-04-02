export async function recognizeCard(imageBase64: string): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'This is a Magic: The Gathering card. What is the exact card name? Reply with ONLY the card name, nothing else.',
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message ?? 'OpenAI request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

export interface DeckAISuggestion {
  name: string;
  reason: string;
  quantity?: number;
  section?: 'main' | 'side';
}

export interface DeckAIResult {
  reply: string;
  suggestions: DeckAISuggestion[];
}

interface DeckForAI {
  name: string;
  isCommander?: boolean;
  cards: Array<{
    name: string;
    quantity: number;
    isSideboard: boolean;
    type_line: string;
    mana_cost?: string;
    cmc: number;
    colors: string[];
  }>;
}

async function runOpenAIJson(prompt: string): Promise<DeckAIResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an MTG deckbuilding assistant. Return strict JSON only with keys: reply (string), suggestions (array). Suggestion items need: name (string), reason (string), quantity (number 1-4), section ("main" or "side"). Keep suggestions practical and legal-aware if Commander is enabled.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message ?? 'OpenAI request failed');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI response was empty');

  const parsed = JSON.parse(content) as DeckAIResult;
  return {
    reply: parsed.reply || 'No summary provided.',
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

function summarizeDeck(deck: DeckForAI): string {
  const main = deck.cards.filter((c) => !c.isSideboard);
  const side = deck.cards.filter((c) => c.isSideboard);
  const mainCount = main.reduce((sum, c) => sum + c.quantity, 0);
  const sideCount = side.reduce((sum, c) => sum + c.quantity, 0);

  const lines = deck.cards
    .slice(0, 120)
    .map((c) => `${c.quantity}x ${c.name} | ${c.type_line} | CMC ${c.cmc}`)
    .join('\n');

  return [
    `Deck: ${deck.name}`,
    `Format: ${deck.isCommander ? 'Commander' : 'Constructed/Custom'}`,
    `Main count: ${mainCount}`,
    `Side count: ${sideCount}`,
    'Current cards:',
    lines,
  ].join('\n');
}

export async function chatWithDeckAssistant(deck: DeckForAI, userMessage: string): Promise<DeckAIResult> {
  const prompt = `${summarizeDeck(deck)}\n\nUser request: ${userMessage}\n\nReturn targeted improvements and up to 12 suggestions.`;
  return runOpenAIJson(prompt);
}

export async function optimizeDeck(deck: DeckForAI): Promise<DeckAIResult> {
  const focus = deck.isCommander
    ? 'Optimize for Commander: mana base consistency, ramp, interaction, card draw, and win conditions while respecting singleton norms.'
    : 'Optimize for consistency: mana curve, removal package, threat density, and sideboard plan.';
  const prompt = `${summarizeDeck(deck)}\n\nTask: ${focus}\n\nReturn an actionable summary and up to 15 suggestions.`;
  return runOpenAIJson(prompt);
}
