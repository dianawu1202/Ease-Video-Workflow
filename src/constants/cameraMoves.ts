export const NO_CAMERA_MOVE_PRESET_ID = 'none';

export type CameraMovePreset = {
  id: string;
  name: string;
  intent: string;
  prompt: string;
};

export const CAMERA_MOVE_PRESETS: CameraMovePreset[] = [
  {
    id: 'locked-off',
    name: '\u56fa\u5b9a\u955c\u5934',
    intent: '\u7a33\u5b9a\u3001\u514b\u5236\uff0c\u7a81\u51fa\u8868\u6f14\u4e0e\u573a\u9762\u8c03\u5ea6\u3002',
    prompt: 'Camera movement: locked-off tripod shot, perfectly stable framing, no camera shake, cinematic composition, let the subject movement carry the scene.'
  },
  {
    id: 'tracking-follow',
    name: '\u8ddf\u968f\u62cd\u6444',
    intent: '\u8ddf\u968f\u89d2\u8272\u884c\u52a8\uff0c\u589e\u5f3a\u4e34\u573a\u611f\u3002',
    prompt: 'Camera movement: smooth tracking follow shot, the camera follows behind and slightly beside the subject at walking speed, natural parallax, immersive cinematic motion.'
  },
  {
    id: 'slow-push-in',
    name: '\u7f13\u6162\u63a8\u8fdb',
    intent: '\u538b\u8fdb\u4eba\u7269\u60c5\u7eea\uff0c\u5236\u9020\u4e13\u6ce8\u548c\u5f20\u529b\u3002',
    prompt: 'Camera movement: slow dolly push-in toward the subject, gradually tightening the frame, subtle cinematic tension, shallow depth of field, emotionally focused.'
  },
  {
    id: 'slow-pull-back',
    name: '\u7f13\u6162\u62c9\u8fdc',
    intent: '\u63ed\u793a\u73af\u5883\uff0c\u8868\u73b0\u5b64\u72ec\u3001\u5b8f\u5927\u6216\u8f6c\u6298\u3002',
    prompt: 'Camera movement: slow dolly pull-back, gradually revealing the surrounding environment around the subject, cinematic scale, controlled and elegant movement.'
  },
  {
    id: 'orbit-left',
    name: '\u5de6\u73af\u7ed5',
    intent: '\u5c55\u793a\u4eba\u7269\u4f53\u79ef\u4e0e\u7a7a\u95f4\u5173\u7cfb\u3002',
    prompt: 'Camera movement: smooth leftward orbit around the subject, 30 to 60 degree arc, stable gimbal motion, strong parallax between foreground and background.'
  },
  {
    id: 'orbit-right',
    name: '\u53f3\u73af\u7ed5',
    intent: '\u5236\u9020\u52a8\u529b\uff0c\u9002\u5408\u4eba\u7269\u5c55\u793a\u548c\u4ea7\u54c1\u611f\u955c\u5934\u3002',
    prompt: 'Camera movement: smooth rightward orbit around the subject, cinematic gimbal arc, keep the subject centered while the background shifts with rich parallax.'
  },
  {
    id: 'crane-up',
    name: '\u5347\u955c\u5934',
    intent: '\u4ece\u4eba\u7269\u5347\u5230\u573a\u666f\uff0c\u5236\u9020\u5f00\u9614\u548c\u53f2\u8bd7\u611f\u3002',
    prompt: 'Camera movement: crane up shot, camera rises vertically while keeping the subject in frame, slowly revealing the scale of the location, epic cinematic reveal.'
  },
  {
    id: 'crane-down',
    name: '\u964d\u955c\u5934',
    intent: '\u4ece\u73af\u5883\u843d\u5230\u89d2\u8272\uff0c\u5efa\u7acb\u5730\u70b9\u540e\u805a\u7126\u4eba\u7269\u3002',
    prompt: 'Camera movement: crane down shot, camera descends from a high establishing angle toward the subject, elegant cinematic reveal, controlled vertical motion.'
  },
  {
    id: 'tilt-up',
    name: '\u955c\u5934\u4e0a\u6447',
    intent: '\u4ece\u4f4e\u5904\u626b\u5230\u9ad8\u5904\uff0c\u5f3a\u8c03\u9ad8\u5ea6\u3001\u656c\u754f\u6216\u767b\u573a\u3002',
    prompt: 'Camera movement: slow tilt up, starting from the lower body or foreground and tilting upward to reveal the subject and towering environment, dramatic cinematic emphasis.'
  },
  {
    id: 'tilt-down',
    name: '\u955c\u5934\u4e0b\u6447',
    intent: '\u4ece\u5929\u7a7a\u6216\u5efa\u7b51\u843d\u5230\u4e3b\u4f53\uff0c\u5efa\u7acb\u7a7a\u95f4\u538b\u8feb\u611f\u3002',
    prompt: 'Camera movement: slow tilt down, starting high above the scene and tilting downward to reveal the subject, atmospheric cinematic composition.'
  },
  {
    id: 'pan-left',
    name: '\u955c\u5934\u5de6\u6447',
    intent: '\u6a2a\u5411\u63ed\u793a\u4fe1\u606f\uff0c\u9002\u5408\u7a7a\u95f4\u626b\u63cf\u3002',
    prompt: 'Camera movement: slow pan left, scanning across the scene with controlled cinematic pacing, revealing new visual information while maintaining stable composition.'
  },
  {
    id: 'pan-right',
    name: '\u955c\u5934\u53f3\u6447',
    intent: '\u6a2a\u5411\u8ddf\u968f\u6216\u63ed\u793a\uff0c\u9002\u5408\u8857\u666f\u4e0e\u7fa4\u50cf\u3002',
    prompt: 'Camera movement: slow pan right, smooth lateral camera rotation, reveal the environment step by step, cinematic pacing and stable horizon.'
  },
  {
    id: 'handheld',
    name: '\u624b\u6301\u7eaa\u5b9e',
    intent: '\u7d27\u5f20\u3001\u771f\u5b9e\u3001\u65b0\u95fb\u611f\u6216\u8ffd\u9010\u611f\u3002',
    prompt: 'Camera movement: subtle handheld camera motion, realistic micro-shake, documentary immediacy, keep the subject readable, cinematic but grounded.'
  },
  {
    id: 'whip-pan',
    name: '\u5feb\u901f\u7529\u955c',
    intent: '\u52a8\u4f5c\u8f6c\u573a\u3001\u7a81\u7136\u53d1\u73b0\u6216\u8282\u594f\u52a0\u901f\u3002',
    prompt: 'Camera movement: fast whip pan transition, rapid horizontal camera sweep with motion blur, energetic cinematic timing, landing cleanly on the next subject.'
  },
  {
    id: 'dutch-roll',
    name: '\u503e\u659c\u65cb\u8f6c',
    intent: '\u4e0d\u5b89\u3001\u7729\u6655\u3001\u68a6\u5883\u6216\u5fc3\u7406\u5931\u8861\u3002',
    prompt: 'Camera movement: subtle dutch angle roll, slight rotating camera tilt, unsettling cinematic mood, controlled motion without losing subject clarity.'
  },
  {
    id: 'fpv-flythrough',
    name: 'FPV\u7a7f\u8d8a',
    intent: '\u7a7a\u95f4\u7a7f\u68ad\u3001\u901f\u5ea6\u611f\u3001\u6c89\u6d78\u5f0f\u63a2\u7d22\u3002',
    prompt: 'Camera movement: FPV fly-through shot, camera glides forward through the environment with dynamic depth, passing foreground elements, immersive cinematic speed.'
  }
];

export function getCameraMovePreset(cameraMovePresetId?: string): CameraMovePreset | null {
  if (!cameraMovePresetId || cameraMovePresetId === NO_CAMERA_MOVE_PRESET_ID) return null;
  return CAMERA_MOVE_PRESETS.find(preset => preset.id === cameraMovePresetId) || null;
}

export function removeCameraMoveFromPrompt(basePrompt: string): string {
  return (basePrompt || '')
    .replace(/\n*\[(?:Camera move|运镜|杩愰暅):[^\]]+\]\s*\n+Camera movement:[\s\S]*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function composePromptWithCameraMove(basePrompt: string, cameraMovePresetId?: string): string {
  const strippedPrompt = removeCameraMoveFromPrompt(basePrompt);
  const preset = getCameraMovePreset(cameraMovePresetId);

  if (!preset) return strippedPrompt;

  return [
    strippedPrompt,
    `[Camera move: ${preset.id}]`,
    preset.prompt
  ].filter(Boolean).join('\n\n');
}
