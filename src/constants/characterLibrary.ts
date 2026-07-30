export const NO_CHARACTER_PRESET_ID = 'none';

export type CharacterCategoryId = 'fruit-characters' | 'global-models';

export type CharacterPreset = {
  id: string;
  categoryId: CharacterCategoryId;
  name: string;
  description: string;
  prompt: string;
};

export type CharacterCategory = {
  id: CharacterCategoryId;
  name: string;
};

export const CHARACTER_CATEGORIES: CharacterCategory[] = [
  { id: 'fruit-characters', name: '\u6c34\u679c\u89d2\u8272' },
  { id: 'global-models', name: '\u591a\u56fd\u6a21\u7279' }
];

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'fruit-strawberry',
    categoryId: 'fruit-characters',
    name: '\u8349\u8393',
    description: '\u53ef\u7231\u3001\u5143\u6c14\u3001\u9c9c\u7ea2\u8349\u8393\u4eba\u8bbe\u3002',
    prompt: 'Character: a charming anthropomorphic strawberry character, glossy red strawberry body, tiny green leaf cap, expressive eyes, cute limbs, friendly optimistic personality. Keep the same character identity, colors, proportions, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-banana',
    categoryId: 'fruit-characters',
    name: '\u9999\u8549',
    description: '\u6d3b\u6cfc\u3001\u641e\u602a\u3001\u91d1\u9ec4\u9999\u8549\u4eba\u8bbe\u3002',
    prompt: 'Character: a playful anthropomorphic banana character, warm yellow banana body, simple friendly face, expressive arms and legs, humorous confident personality. Keep the same character identity, silhouette, colors, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-grape',
    categoryId: 'fruit-characters',
    name: '\u8461\u8404',
    description: '\u7075\u52a8\u3001\u806a\u660e\u3001\u7d2b\u8272\u8461\u8404\u4e32\u4eba\u8bbe\u3002',
    prompt: 'Character: a clever anthropomorphic grape cluster character, rounded purple grape body made of several glossy grapes, small vine detail, bright expressive eyes, nimble cheerful personality. Keep the same character identity, color palette, grape-cluster silhouette, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-apple',
    categoryId: 'fruit-characters',
    name: '\u82f9\u679c',
    description: '\u6b63\u76f4\u3001\u53ef\u4fe1\u3001\u5706\u6da6\u7ea2\u82f9\u679c\u4eba\u8bbe\u3002',
    prompt: 'Character: a dependable anthropomorphic red apple character, glossy rounded apple body, small leaf and stem, warm trustworthy eyes, steady optimistic personality. Keep the same character identity, round silhouette, red color palette, leaf detail, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-orange',
    categoryId: 'fruit-characters',
    name: '\u6a59\u5b50',
    description: '\u9633\u5149\u3001\u70ed\u60c5\u3001\u6a59\u8272\u6d3b\u529b\u89d2\u8272\u3002',
    prompt: 'Character: a sunny anthropomorphic orange character, bright orange peel texture, round compact body, cheerful eyes, energetic welcoming personality. Keep the same character identity, citrus texture, orange color, rounded proportions, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-watermelon',
    categoryId: 'fruit-characters',
    name: '\u897f\u74dc',
    description: '\u723d\u6717\u3001\u590f\u65e5\u611f\u3001\u7eff\u76ae\u7ea2\u74e4\u897f\u74dc\u4eba\u8bbe\u3002',
    prompt: 'Character: a refreshing anthropomorphic watermelon character, green striped rind body with red melon accent, seed freckles, big relaxed smile, easygoing summer personality. Keep the same character identity, striped rind pattern, red-and-green palette, seed details, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-pineapple',
    categoryId: 'fruit-characters',
    name: '\u83e0\u841d',
    description: '\u9177\u611f\u3001\u70ed\u5e26\u3001\u5e26\u51a0\u53f6\u7684\u83e0\u841d\u4eba\u8bbe\u3002',
    prompt: 'Character: a cool anthropomorphic pineapple character, golden diamond-pattern pineapple body, spiky green crown leaves, confident grin, tropical adventurous personality. Keep the same character identity, crown-leaf silhouette, pineapple texture, gold-green palette, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-mango',
    categoryId: 'fruit-characters',
    name: '\u8292\u679c',
    description: '\u6e29\u67d4\u3001\u751c\u7f8e\u3001\u9ec4\u6a59\u6e10\u53d8\u8292\u679c\u4eba\u8bbe\u3002',
    prompt: 'Character: a gentle anthropomorphic mango character, soft yellow-orange mango body with subtle blush gradient, kind eyes, graceful hands, sweet thoughtful personality. Keep the same character identity, mango shape, warm gradient colors, soft expression, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-peach',
    categoryId: 'fruit-characters',
    name: '\u6843\u5b50',
    description: '\u67d4\u548c\u3001\u6d6a\u6f2b\u3001\u7c89\u6a59\u6843\u5b50\u4eba\u8bbe\u3002',
    prompt: 'Character: a soft anthropomorphic peach character, velvety pink-orange peach body, tiny leaf detail, gentle blush, dreamy romantic personality. Keep the same character identity, peach silhouette, velvety texture, pastel peach palette, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-kiwi',
    categoryId: 'fruit-characters',
    name: '\u5947\u5f02\u679c',
    description: '\u597d\u5947\u3001\u673a\u7075\u3001\u7eff\u8272\u5947\u5f02\u679c\u5207\u9762\u4eba\u8bbe\u3002',
    prompt: 'Character: a curious anthropomorphic kiwi character, fuzzy brown outer edge with bright green kiwi-slice face, small black seed freckles, alert eyes, quick clever personality. Keep the same character identity, kiwi-slice face, seed pattern, fuzzy rim, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-lemon',
    categoryId: 'fruit-characters',
    name: '\u67e0\u6aac',
    description: '\u4fcf\u76ae\u3001\u654f\u9510\u3001\u660e\u9ec4\u67e0\u6aac\u4eba\u8bbe\u3002',
    prompt: 'Character: a witty anthropomorphic lemon character, bright yellow lemon body, pointed oval silhouette, sharp playful eyes, fast-talking clever personality. Keep the same character identity, lemon shape, vivid yellow palette, playful expression, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-blueberry',
    categoryId: 'fruit-characters',
    name: '\u84dd\u8393',
    description: '\u5b89\u9759\u3001\u6cbb\u6108\u3001\u6df1\u84dd\u84dd\u8393\u4eba\u8bbe\u3002',
    prompt: 'Character: a calm anthropomorphic blueberry character, deep blue round berry body, tiny crown blossom mark, soft luminous eyes, gentle healing personality. Keep the same character identity, compact round shape, blue-purple palette, blossom detail, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-cherry',
    categoryId: 'fruit-characters',
    name: '\u6a31\u6843',
    description: '\u4fd0\u76ae\u3001\u7075\u5de7\u3001\u53cc\u6a31\u6843\u6d3b\u529b\u89d2\u8272\u3002',
    prompt: 'Character: a lively anthropomorphic cherry character, twin glossy red cherry body with joined stems, mischievous eyes, quick nimble limbs, playful energetic personality. Keep the same character identity, paired-cherry silhouette, red glossy surface, stem detail, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-coconut',
    categoryId: 'fruit-characters',
    name: '\u6930\u5b50',
    description: '\u7a33\u91cd\u3001\u6e29\u6696\u3001\u70ed\u5e26\u6930\u5b50\u4eba\u8bbe\u3002',
    prompt: 'Character: a warm anthropomorphic coconut character, textured brown coconut shell body with small white coconut accent, relaxed eyes, sturdy limbs, protective island personality. Keep the same character identity, coconut shell texture, brown-and-white palette, sturdy silhouette, and personality across all generated images or videos.'
  },
  {
    id: 'fruit-dragonfruit',
    categoryId: 'fruit-characters',
    name: '\u706b\u9f99\u679c',
    description: '\u5947\u5e7b\u3001\u5927\u80c6\u3001\u7c89\u7ea2\u706b\u9f99\u679c\u4eba\u8bbe\u3002',
    prompt: 'Character: a bold anthropomorphic dragon fruit character, vivid magenta dragon-fruit body with green scale-like tips, speckled white accent, dramatic eyes, imaginative fearless personality. Keep the same character identity, magenta-green silhouette, scale-tip details, speckled fruit motif, and personality across all generated images or videos.'
  },
  {
    id: 'model-japan',
    categoryId: 'global-models',
    name: '\u65e5\u672c\u6a21\u7279',
    description: '\u51b7\u9759\u3001\u7b80\u7ea6\u3001\u4e1c\u4eac\u65f6\u5c1a\u611f\u3002',
    prompt: 'Character: an adult professional fashion model from Japan, calm confident presence, refined minimalist styling, contemporary Tokyo fashion sensibility, natural expression. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-brazil',
    categoryId: 'global-models',
    name: '\u5df4\u897f\u6a21\u7279',
    description: '\u9633\u5149\u3001\u5065\u5eb7\u3001\u9ad8\u80fd\u91cf\u955c\u5934\u8868\u73b0\u3002',
    prompt: 'Character: an adult professional fashion model from Brazil, athletic elegant presence, warm expressive smile, vibrant editorial styling, confident camera energy. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-france',
    categoryId: 'global-models',
    name: '\u6cd5\u56fd\u6a21\u7279',
    description: '\u4f18\u96c5\u3001\u677e\u5f1b\u3001\u9ad8\u7ea7\u65f6\u88c5\u7247\u6c14\u8d28\u3002',
    prompt: 'Character: an adult professional fashion model from France, effortless elegance, understated luxury styling, poised expression, refined editorial attitude. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-nigeria',
    categoryId: 'global-models',
    name: '\u5c3c\u65e5\u5229\u4e9a\u6a21\u7279',
    description: '\u5f3a\u5927\u3001\u660e\u4eae\u3001\u65f6\u5c1a\u5927\u7247\u611f\u3002',
    prompt: 'Character: an adult professional fashion model from Nigeria, deep brown skin tone, sculptural styling, strong confident gaze, bold contemporary fashion presence. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-india',
    categoryId: 'global-models',
    name: '\u5370\u5ea6\u6a21\u7279',
    description: '\u660e\u8273\u3001\u7cbe\u81f4\u3001\u5bcc\u6709\u8272\u5f69\u5c42\u6b21\u3002',
    prompt: 'Character: an adult professional fashion model from India, warm brown skin tone, expressive eyes, refined colorful styling, elegant posture, cinematic fashion portrait presence. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-mexico',
    categoryId: 'global-models',
    name: '\u58a8\u897f\u54e5\u6a21\u7279',
    description: '\u70ed\u60c5\u3001\u81ea\u7136\u3001\u8857\u62cd\u4e0e\u65f6\u88c5\u5e73\u8861\u3002',
    prompt: 'Character: an adult professional fashion model from Mexico, warm expressive presence, modern street-fashion styling, natural charisma, relaxed editorial confidence. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-korea',
    categoryId: 'global-models',
    name: '\u97e9\u56fd\u6a21\u7279',
    description: 'K-fashion\u3001\u90fd\u5e02\u3001\u5e72\u51c0\u7cbe\u4fee\u611f\u3002',
    prompt: 'Character: an adult professional fashion model from South Korea, polished K-fashion styling, clean modern beauty look, composed gaze, urban editorial mood. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-egypt',
    categoryId: 'global-models',
    name: '\u57c3\u53ca\u6a21\u7279',
    description: '\u6df1\u9083\u3001\u51e0\u4f55\u611f\u3001\u5f3a\u8f6e\u5ed3\u65f6\u5c1a\u3002',
    prompt: 'Character: an adult professional fashion model from Egypt, olive to warm brown skin tone, striking profile, architectural styling, poised cinematic presence. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-sweden',
    categoryId: 'global-models',
    name: '\u745e\u5178\u6a21\u7279',
    description: '\u51b7\u8272\u6781\u7b80\u3001\u9ad8\u7ea7\u5e72\u51c0\u3001\u5317\u6b27\u6c14\u8d28\u3002',
    prompt: 'Character: an adult professional fashion model from Sweden, clean Scandinavian styling, cool minimalist palette, calm gaze, refined high-fashion posture. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-morocco',
    categoryId: 'global-models',
    name: '\u6469\u6d1b\u54e5\u6a21\u7279',
    description: '\u6e29\u6696\u3001\u7eb9\u7406\u611f\u3001\u5f02\u57df\u65f6\u88c5\u7247\u3002',
    prompt: 'Character: an adult professional fashion model from Morocco, warm olive skin tone, textured contemporary styling, expressive eyes, elegant desert-light editorial presence. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-usa',
    categoryId: 'global-models',
    name: '\u7f8e\u56fd\u6a21\u7279',
    description: '\u73b0\u4ee3\u3001\u81ea\u4fe1\u3001\u5546\u4e1a\u4e0e\u8857\u5934\u98ce\u878d\u5408\u3002',
    prompt: 'Character: an adult professional fashion model from the United States, confident modern presence, polished street-luxury styling, direct camera connection, versatile commercial editorial energy. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-kenya',
    categoryId: 'global-models',
    name: '\u80af\u5c3c\u4e9a\u6a21\u7279',
    description: '\u9ad8\u6311\u3001\u6709\u529b\u3001\u81ea\u7136\u5149\u4eba\u50cf\u611f\u3002',
    prompt: 'Character: an adult professional fashion model from Kenya, deep brown skin tone, graceful tall posture, natural-light editorial styling, strong serene expression. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-italy',
    categoryId: 'global-models',
    name: '\u610f\u5927\u5229\u6a21\u7279',
    description: '\u620f\u5267\u611f\u3001\u590d\u53e4\u65f6\u88c5\u3001\u9ad8\u7ea7\u4eba\u50cf\u3002',
    prompt: 'Character: an adult professional fashion model from Italy, expressive cinematic face, tailored fashion styling, confident romantic attitude, refined editorial drama. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-indonesia',
    categoryId: 'global-models',
    name: '\u5370\u5c3c\u6a21\u7279',
    description: '\u6e05\u65b0\u3001\u70ed\u5e26\u5149\u611f\u3001\u81ea\u7136\u65f6\u5c1a\u3002',
    prompt: 'Character: an adult professional fashion model from Indonesia, warm medium skin tone, natural tropical-light styling, graceful relaxed expression, contemporary lifestyle fashion mood. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  },
  {
    id: 'model-turkey',
    categoryId: 'global-models',
    name: '\u571f\u8033\u5176\u6a21\u7279',
    description: '\u53e4\u5178\u4e0e\u73b0\u4ee3\u5e76\u7f6e\u3001\u57ce\u5e02\u7535\u5f71\u611f\u3002',
    prompt: 'Character: an adult professional fashion model from Turkey, refined urban styling, expressive eyes, poised cinematic attitude, blend of classic and contemporary fashion presence. Keep facial identity, hairstyle, body proportions, wardrobe direction, and demeanor consistent across all generated images or videos.'
  }
];

export function getCharacterPreset(characterPresetId?: string): CharacterPreset | null {
  if (!characterPresetId || characterPresetId === NO_CHARACTER_PRESET_ID) return null;
  return CHARACTER_PRESETS.find(preset => preset.id === characterPresetId) || null;
}

export function composePromptWithCharacter(basePrompt: string, characterPresetId?: string): string {
  const preset = getCharacterPreset(characterPresetId);
  const trimmedPrompt = (basePrompt || '').trim();

  if (!preset) return trimmedPrompt;

  return [
    trimmedPrompt,
    `[Character library: ${preset.id}]`,
    preset.prompt
  ].filter(Boolean).join('\n\n');
}
