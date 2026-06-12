function buildScenePromptOptimizationFallback(input = {}) {
  const originalPrompt = String(input.originalPrompt || '').trim();
  const productName = String(input.productName || '').trim();
  const productVisualSummary = String(input.productVisualSummary || '').trim();
  const style = String(input.style || '').trim();
  const referenceSummary = String(input.referenceSummary || '').trim();

  const parts = [];

  if (originalPrompt) {
    parts.push(originalPrompt.replace(/\s+/g, ' ').trim());
  }

  if (productName && !parts.join(' ').includes(productName)) {
    parts.push(`主体商品为${productName}`);
  }

  if (productVisualSummary) {
    parts.push(`严格保持商品主体外观、颜色、材质和比例与原图一致，当前商品特征：${productVisualSummary}`);
  } else {
    parts.push('严格保持商品主体外观、颜色、材质和比例与原图一致');
  }

  if (style) {
    parts.push(`整体视觉风格偏${style}`);
  }

  if (referenceSummary) {
    parts.push(`参考图只继承这些构图/氛围信号：${referenceSummary}`);
  }

  parts.push('画面像真实电商商业摄影，不做夸张海报，不改商品结构，不乱加无关元素，光线自然，主体清晰，适合作为高转化商品场景图');

  return parts.join('，');
}

function buildScenePromptOptimizationPrompt(input = {}) {
  return `
你是电商商品图提示词优化助手。你的任务不是机械堆词，而是把用户当前的场景描述，改写成更适合图像生成的高质量中文提示词。

输出要求：
1. 只输出严格 JSON，不要 markdown，不要解释，不要额外客套话。
2. improvedPrompt 必须明显优于原文，但不能改掉商品事实，也不能变成套话堆砌。
3. 如果用户原文已经有明确场景、氛围、构图，就保留其核心意图，只补足缺失的拍摄与电商表达。
4. 如果用户原文过短或过空，就主动补齐真实电商场景所需的构图、光线、镜头、材质、氛围约束。
5. 绝不能重复输出“高级、真实、商业摄影”这一类空泛词很多次；每个补充都要服务最终画面。
6. 如果有商品视觉信息，必须强调不能改商品主体外观、颜色、结构、材质和比例。
7. 如果有参考图摘要，只能继承版式/氛围/镜头信号，不能把参考图里的别的商品写成主角。

输出 JSON：
{
  "improvedPrompt": "优化后的中文提示词",
  "strategy": [
    "这次具体补强了什么，最多4条"
  ]
}

输入信息：
${JSON.stringify({
  mode: input.mode || 'scene',
  originalPrompt: input.originalPrompt || '',
  productName: input.productName || '',
  productVisualSummary: input.productVisualSummary || '',
  style: input.style || '',
  referenceSummary: input.referenceSummary || '',
}, null, 2)}
  `.trim();
}

module.exports = {
  buildScenePromptOptimizationFallback,
  buildScenePromptOptimizationPrompt,
};
