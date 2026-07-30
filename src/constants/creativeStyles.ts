export const NO_STYLE_PRESET_ID = 'none';

export type CreativeStylePreset = {
  id: string;
  name: string;
  description: string;
  prompt: string;
};

export const CREATIVE_STYLE_PRESETS: CreativeStylePreset[] = [
  {
    id: NO_STYLE_PRESET_ID,
    name: '\u9ed8\u8ba4',
    description: '\u4e0d\u989d\u5916\u6dfb\u52a0\u98ce\u683c\uff0c\u5b8c\u5168\u6309\u7167\u4f60\u7684\u63d0\u793a\u8bcd\u751f\u6210\u3002',
    prompt: ''
  },
  {
    id: 'cinematic-realism',
    name: '\u7535\u5f71\u5199\u5b9e',
    description: '\u771f\u5b9e\u5149\u5f71\u3001\u6d45\u666f\u6df1\u3001\u5267\u60c5\u7247\u8d28\u611f\u3002',
    prompt: 'Visual style: cinematic photorealism, natural skin texture, motivated lighting, shallow depth of field, rich but restrained color grade, high dynamic range, movie still composition.'
  },
  {
    id: 'commercial-beauty',
    name: '\u5e7f\u544a\u7cbe\u4fee',
    description: '\u5e72\u51c0\u9ad8\u7ea7\u3001\u5546\u4e1a\u5927\u7247\u3001\u4ea7\u54c1\u5ba3\u4f20\u611f\u3002',
    prompt: 'Visual style: premium commercial campaign, polished lighting, clean composition, refined surfaces, aspirational mood, crisp details, elegant highlights, brand-film finish.'
  },
  {
    id: 'film-noir',
    name: '\u9ed1\u8272\u7535\u5f71',
    description: '\u9ad8\u53cd\u5dee\u5149\u5f71\u3001\u60ac\u7591\u3001\u590d\u53e4\u80f6\u7247\u6c1b\u56f4\u3002',
    prompt: 'Visual style: film noir, high contrast chiaroscuro lighting, deep shadows, dramatic silhouettes, rain-slick reflections, classic cinematic mystery mood.'
  },
  {
    id: 'vintage-film',
    name: '\u590d\u53e4\u80f6\u7247',
    description: '\u80f6\u7247\u9897\u7c92\u3001\u67d4\u548c\u8272\u8c03\u3001\u6000\u65e7\u751f\u6d3b\u611f\u3002',
    prompt: 'Visual style: vintage film photography, subtle grain, warm faded colors, soft halation, analog texture, natural imperfections, nostalgic cinematic atmosphere.'
  },
  {
    id: 'cyberpunk',
    name: '\u8d5b\u535a\u9732\u8679',
    description: '\u9713\u8679\u3001\u96e8\u591c\u3001\u672a\u6765\u57ce\u5e02\u3001\u5f3a\u89c6\u89c9\u51b2\u51fb\u3002',
    prompt: 'Visual style: cyberpunk neon city, rain reflections, saturated magenta and cyan lighting, futuristic street texture, dense atmosphere, cinematic sci-fi contrast.'
  },
  {
    id: 'sci-fi-epic',
    name: '\u79d1\u5e7b\u53f2\u8bd7',
    description: '\u5b8f\u5927\u573a\u666f\u3001\u672a\u6765\u79d1\u6280\u3001\u5927\u5c3a\u5ea6\u5947\u89c2\u3002',
    prompt: 'Visual style: epic science fiction, monumental scale, advanced technology, atmospheric volumetric light, clean futuristic materials, awe-inspiring cinematic worldbuilding.'
  },
  {
    id: 'anime-film',
    name: '\u52a8\u753b\u7535\u5f71',
    description: '\u65e5\u7cfb\u52a8\u753b\u5149\u5f71\u3001\u60c5\u7eea\u5316\u8272\u5f69\u3001\u7ec6\u817b\u80cc\u666f\u3002',
    prompt: 'Visual style: animated feature film, expressive character design, painterly backgrounds, delicate lighting, emotional color palette, clean linework, cinematic anime atmosphere.'
  },
  {
    id: 'storybook-watercolor',
    name: '\u6c34\u5f69\u7ed8\u672c',
    description: '\u67d4\u548c\u7ae5\u8bdd\u3001\u624b\u7ed8\u7eb8\u611f\u3001\u6e29\u6696\u6cbb\u6108\u3002',
    prompt: 'Visual style: watercolor storybook illustration, handmade paper texture, soft edges, gentle pastel palette, warm whimsical mood, charming handcrafted details.'
  },
  {
    id: 'fashion-editorial',
    name: '\u65f6\u5c1a\u6742\u5fd7',
    description: '\u5927\u7247\u6784\u56fe\u3001\u9020\u578b\u7a81\u51fa\u3001\u68da\u62cd\u6216\u8857\u62cd\u8d28\u611f\u3002',
    prompt: 'Visual style: high fashion editorial, strong posing, refined wardrobe styling, sculpted light, confident composition, magazine cover quality, sophisticated color grade.'
  },
  {
    id: 'documentary-natural',
    name: '\u7eaa\u5f55\u7247\u81ea\u7136',
    description: '\u771f\u5b9e\u73b0\u573a\u611f\u3001\u81ea\u7136\u5149\u3001\u4eba\u6587\u6545\u4e8b\u6c14\u8d28\u3002',
    prompt: 'Visual style: natural documentary realism, available light, grounded colors, candid framing, authentic textures, humanistic atmosphere, believable real-world detail.'
  },
  {
    id: 'chinese-fantasy',
    name: '\u4e1c\u65b9\u5947\u5e7b',
    description: '\u56fd\u98ce\u7f8e\u5b66\u3001\u4e91\u96fe\u3001\u4ed9\u4fa0\u3001\u8bd7\u610f\u573a\u666f\u3002',
    prompt: 'Visual style: Chinese fantasy cinema, elegant traditional aesthetics, misty atmosphere, poetic composition, flowing fabric, refined gold and ink tones, mythic cinematic scale.'
  },
  {
    id: 'minimal-japanese',
    name: '\u65e5\u7cfb\u6e05\u65b0',
    description: '\u7b80\u6d01\u3001\u660e\u4eae\u3001\u7a7a\u6c14\u611f\u3001\u751f\u6d3b\u65b9\u5f0f\u6444\u5f71\u3002',
    prompt: 'Visual style: clean Japanese lifestyle photography, airy composition, soft daylight, gentle neutral colors, minimal clutter, calm everyday beauty, subtle emotional warmth.'
  },
  {
    id: 'clay-3d',
    name: '3D\u9ecf\u571f',
    description: '\u6f6e\u73a9\u611f\u3001\u5fae\u7f29\u573a\u666f\u3001\u53ef\u7231\u4f46\u6709\u8d28\u611f\u3002',
    prompt: 'Visual style: stylized 3D clay render, tactile handmade surfaces, soft studio lighting, miniature set design, playful proportions, polished yet handcrafted look.'
  }
];

export function getCreativeStylePreset(stylePresetId?: string): CreativeStylePreset {
  return CREATIVE_STYLE_PRESETS.find(preset => preset.id === stylePresetId) || CREATIVE_STYLE_PRESETS[0];
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanPromptSpacing(prompt: string): string {
  return prompt
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export function getCreativeStylePromptBlock(stylePresetId?: string): string {
  const preset = getCreativeStylePreset(stylePresetId);

  if (!preset.prompt) return '';

  return `[Creative style: ${preset.id}]\n${preset.prompt}`;
}

export function removeCreativeStyleFromPrompt(basePrompt: string): string {
  let nextPrompt = basePrompt || '';

  CREATIVE_STYLE_PRESETS.forEach(preset => {
    if (!preset.prompt) return;

    const marker = `\\[Creative style:\\s*${escapeRegExp(preset.id)}\\]`;
    const prompt = escapeRegExp(preset.prompt);
    const markedBlock = new RegExp(`\\n*${marker}\\s*\\n+${prompt}`, 'g');

    nextPrompt = nextPrompt.replace(markedBlock, '');
  });

  return cleanPromptSpacing(nextPrompt);
}

export function fillPromptWithCreativeStyle(basePrompt: string, stylePresetId?: string): string {
  const strippedPrompt = removeCreativeStyleFromPrompt(basePrompt);
  const styleBlock = getCreativeStylePromptBlock(stylePresetId);

  return cleanPromptSpacing([strippedPrompt, styleBlock].filter(Boolean).join('\n\n'));
}

export function composePromptWithCreativeStyle(basePrompt: string, stylePresetId?: string): string {
  const preset = getCreativeStylePreset(stylePresetId);
  const strippedPrompt = removeCreativeStyleFromPrompt(basePrompt);

  if (!preset.prompt) return cleanPromptSpacing(strippedPrompt);

  return fillPromptWithCreativeStyle(strippedPrompt, stylePresetId);
}
