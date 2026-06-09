require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const REFERENCE_VIDEO_PATH = 'C:\\Users\\Edward\\Videos\\NVIDIA\\Desktop\\Desktop 2026.06.08 - 12.55.40.01.mp4';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/reference-video', (req, res) => {
  res.sendFile(REFERENCE_VIDEO_PATH);
});

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function decodeHtmlEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(value) {
  return decodeHtmlEntities(
    String(value || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+/g, ' ').trim();
}

function truncateText(value, maxLength) {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function extractMetaContent(html, key) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${key}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${key}["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return stripHtml(match[1]);
  }

  return '';
}

function absolutizeUrl(rawUrl, baseUrl) {
  try {
    return new URL(rawUrl, baseUrl).toString();
  } catch (error) {
    return '';
  }
}

function extractTitle(html) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch?.[1]) return stripHtml(titleMatch[1]);

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return h1Match?.[1] ? stripHtml(h1Match[1]) : '';
}

function extractTextBlocks(html) {
  const blocks = [];
  const regex = /<(h1|h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match = regex.exec(html);

  while (match) {
    const text = stripHtml(match[2]);
    if (text.length >= 14 && text.length <= 220 && !blocks.includes(text)) {
      blocks.push(text);
    }
    if (blocks.length >= 8) break;
    match = regex.exec(html);
  }

  return blocks;
}

function extractImageCandidates(html, baseUrl) {
  const urls = [];
  const pushUrl = (value) => {
    const absolute = absolutizeUrl(value, baseUrl);
    if (!absolute || urls.includes(absolute)) return;
    urls.push(absolute);
  };

  const ogImage = extractMetaContent(html, 'og:image');
  if (ogImage) pushUrl(ogImage);

  const imageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match = imageRegex.exec(html);

  while (match) {
    pushUrl(match[1]);
    if (urls.length >= 6) break;
    match = imageRegex.exec(html);
  }

  return urls;
}

function buildDetailPageReadResult(pageUrl, finalUrl, html, contentType) {
  const title = extractTitle(html);
  const description = extractMetaContent(html, 'description') || extractMetaContent(html, 'og:description');
  const textBlocks = extractTextBlocks(html);
  const imageCandidates = extractImageCandidates(html, finalUrl || pageUrl);
  const plainText = stripHtml(html);

  return {
    requestedUrl: pageUrl,
    finalUrl: finalUrl || pageUrl,
    contentType,
    title: truncateText(title, 120),
    description: truncateText(description, 180),
    textPreview: truncateText(plainText, 300),
    textBlocks,
    imageCandidates,
    readable: Boolean(title || description || textBlocks.length),
  };
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

function extractJsonObject(value) {
  const direct = safeJsonParse(value);
  if (direct) return direct;

  const fencedMatch = String(value || '').match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const parsed = safeJsonParse(fencedMatch[1].trim());
    if (parsed) return parsed;
  }

  const braceStart = String(value || '').indexOf('{');
  const braceEnd = String(value || '').lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    return safeJsonParse(String(value || '').slice(braceStart, braceEnd + 1));
  }

  return null;
}

function toArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  if (!value) return fallback;
  return String(value)
    .split(/[\n,，、;；|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function toModuleArray(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => ({
      name: String(item?.name || '').trim(),
      purpose: String(item?.purpose || '').trim(),
    }))
    .filter((item) => item.name || item.purpose);
}

function toModuleBlueprintArray(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value
    .map((item) => ({
      name: String(item?.name || '').trim(),
      purpose: String(item?.purpose || '').trim(),
      visualFocus: String(item?.visualFocus || '').trim(),
      copyAngle: String(item?.copyAngle || '').trim(),
    }))
    .filter((item) => item.name || item.purpose || item.visualFocus || item.copyAngle);
}

function normalizeRevisionTags(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 6);
}

function buildRevisionMeta(input = {}) {
  const feedbackText = String(input.revisionFeedback || '').trim();
  const selectedTags = normalizeRevisionTags(input.revisionTags);
  const rules = [
    { keywords: ['首图', '头图', '第一屏'], category: '首图方向' },
    { keywords: ['颜色', '色', '外观', '主体', '蓝', '黑', '白', '红', '绿'], category: '商品识别' },
    { keywords: ['卖点', '亮点', '优势'], category: '卖点表达' },
    { keywords: ['模块', '结构', '顺序', '排版'], category: '模块结构' },
    { keywords: ['风格', '质感', '高级', '简约', '氛围'], category: '视觉风格' },
    { keywords: ['文案', '标题', '表达', '语气'], category: '文案语气' },
    { keywords: ['人群', '客户', '受众'], category: '目标人群' },
    { keywords: ['场景', '使用场景'], category: '使用场景' },
  ];

  const autoCategories = [];
  const addCategory = (value) => {
    if (!value || autoCategories.includes(value)) return;
    autoCategories.push(value);
  };

  selectedTags.forEach((tag) => {
    const matched = rules.find((rule) => rule.keywords.some((keyword) => tag.includes(keyword)));
    addCategory(matched?.category || tag);
  });

  rules.forEach((rule) => {
    if (rule.keywords.some((keyword) => feedbackText.includes(keyword))) {
      addCategory(rule.category);
    }
  });

  if (!autoCategories.length && feedbackText) {
    addCategory('细节补充');
  }

  const appliedChanges = autoCategories.map((category) => {
    switch (category) {
      case '首图方向':
        return '重新收紧首图重点，让第一屏表达更集中。';
      case '商品识别':
        return '重新按商品图校正颜色、主体和外观描述。';
      case '卖点表达':
        return '把核心卖点写得更具体，减少空泛说法。';
      case '模块结构':
        return '重新调整模块顺序，让整页更像真实电商详情页。';
      case '视觉风格':
        return '把视觉风格重新收口，保持同一套电商氛围。';
      case '文案语气':
        return '把文案改得更直接、更容易看懂。';
      case '目标人群':
        return '把表达重新贴近目标人群的购买理由。';
      case '使用场景':
        return '把使用场景补得更明确，方便后面继续出图。';
      default:
        return `已根据“${category}”这个方向重新整理这一版方案。`;
    }
  });

  return {
    feedbackText,
    selectedTags,
    autoCategories,
    appliedChanges,
  };
}

function normalizeSummary(raw, fallback) {
  const fallbackRevision = fallback.revision || {};
  return {
    sourceMode: raw?.sourceMode === 'description' ? 'description' : fallback.sourceMode,
    productName: String(raw?.productName || fallback.productName || '').trim(),
    productType: String(raw?.productType || fallback.productType || '').trim(),
    productVisualSummary: String(raw?.productVisualSummary || fallback.productVisualSummary || '').trim(),
    coreSellingPoints: toArray(raw?.coreSellingPoints, fallback.coreSellingPoints).slice(0, 4),
    referenceTakeaways: toArray(raw?.referenceTakeaways, fallback.referenceTakeaways).slice(0, 4),
    pageModules: toModuleArray(raw?.pageModules, fallback.pageModules).slice(0, 7),
    heroDirection: {
      headline: String(raw?.heroDirection?.headline || fallback.heroDirection.headline || '').trim(),
      visualFocus: String(raw?.heroDirection?.visualFocus || fallback.heroDirection.visualFocus || '').trim(),
      reason: String(raw?.heroDirection?.reason || fallback.heroDirection.reason || '').trim(),
    },
    audienceInsight: String(raw?.audienceInsight || fallback.audienceInsight || '').trim(),
    emotionalHook: String(raw?.emotionalHook || fallback.emotionalHook || '').trim(),
    visualKeywords: toArray(raw?.visualKeywords, fallback.visualKeywords).slice(0, 6),
    trustSignals: toArray(raw?.trustSignals, fallback.trustSignals).slice(0, 5),
    moduleBlueprints: toModuleBlueprintArray(raw?.moduleBlueprints, fallback.moduleBlueprints).slice(0, 6),
    ctaDirection: {
      headline: String(raw?.ctaDirection?.headline || fallback.ctaDirection?.headline || '').trim(),
      support: String(raw?.ctaDirection?.support || fallback.ctaDirection?.support || '').trim(),
    },
    modulePlan: toArray(raw?.modulePlan, fallback.modulePlan).slice(0, 6),
    imagePromptDraft: String(raw?.imagePromptDraft || fallback.imagePromptDraft || '').trim(),
    missingInfo: toArray(raw?.missingInfo, fallback.missingInfo).slice(0, 4),
    riskWarnings: toArray(raw?.riskWarnings, fallback.riskWarnings).slice(0, 4),
    revision: {
      feedbackText: String(raw?.revision?.feedbackText || fallbackRevision.feedbackText || '').trim(),
      selectedTags: normalizeRevisionTags(raw?.revision?.selectedTags?.length ? raw.revision.selectedTags : fallbackRevision.selectedTags),
      autoCategories: toArray(raw?.revision?.autoCategories, fallbackRevision.autoCategories).slice(0, 5),
      appliedChanges: toArray(raw?.revision?.appliedChanges, fallbackRevision.appliedChanges).slice(0, 5),
      revisionRound: Number(raw?.revision?.revisionRound || fallbackRevision.revisionRound || 0),
    },
  };
}

function buildFallbackDetailAnalysis(input) {
  const {
    productName,
    sellingPoints,
    scenes,
    audience,
    extra,
    style,
    readResult,
    hasReferenceScreenshot,
    hasProductImage,
    revisionFeedback,
    revisionTags,
    revisionRound,
  } = input;
  const revisionMeta = buildRevisionMeta({ revisionFeedback, revisionTags });

  const sellingPointList = toArray(sellingPoints, ['突出核心卖点', '补充使用场景', '强化下单理由']);
  const readBlocks = readResult?.textBlocks || [];
  const referenceTakeaways = readResult
    ? [
        readResult.title ? `参考页标题方向：${readResult.title}` : '',
        readResult.description ? `参考页描述重点：${readResult.description}` : '',
        readBlocks[0] ? `参考页正文强调：${readBlocks[0]}` : '',
        hasReferenceScreenshot ? '已补充参考截图，可继续结合视觉布局判断模块顺序。' : '',
      ].filter(Boolean)
    : [
        '当前没有参考链接，先按商家描述整理默认详情页结构。',
        style ? `视觉风格先按“${style}”方向收敛。` : '',
      ].filter(Boolean);

  const defaultModules = [
    { name: '首图模块', purpose: '先把产品身份和第一卖点讲清楚。' },
    { name: '卖点模块', purpose: '把 3 个最值得讲的理由拆开讲。' },
    { name: '细节模块', purpose: '补材质、做工、结构细节。' },
    { name: '参数模块', purpose: '放尺寸、规格或使用信息。' },
    { name: '场景模块', purpose: '告诉买家适合什么使用情境。' },
    { name: '收口模块', purpose: '收拢下单理由和最终行动点。' },
  ];

  const modulePlan = [
    `第一屏先主打“${sellingPointList[0] || '核心卖点'}”，不要一开始堆太多信息。`,
    `第二屏拆开讲 ${sellingPointList.slice(0, 3).join(' / ') || '核心卖点'}。`,
    scenes ? `场景模块优先围绕“${scenes}”去组织画面。` : '场景模块优先补使用情境和代入感。',
    audience ? `文案表达尽量贴近“${audience}”的决策方式。` : '文案表达尽量贴近日常电商成交语境。',
    extra ? `补充要求记得纳入：${extra}` : '最后补参数、细节和收口模块。',
    ...revisionMeta.appliedChanges.slice(0, 2),
  ].filter(Boolean);

  return {
    sourceMode: readResult ? 'reference' : 'description',
    productName: productName || '未命名商品',
    productType: scenes ? `适合${scenes}的商品` : '待确认商品类型',
    productVisualSummary: hasProductImage
      ? '已上传商品图，后续文案和生图说明必须以商品图主体颜色、外观和类型为准，不能自行改色。'
      : '当前没有商品图视觉识别结果，商品外观信息仍需人工确认。',
    coreSellingPoints: sellingPointList.slice(0, 4),
    referenceTakeaways,
    pageModules: defaultModules,
    heroDirection: {
      headline: `${productName || '这款商品'}先主打${sellingPointList[0] || '核心卖点'}`,
      visualFocus: style ? `整体风格先按“${style}”推进` : '整体画面先突出主体商品和第一卖点',
      reason: readResult
        ? '当前先根据参考页读到的标题、正文片段和结构线索整理方向。'
        : '当前没有参考页，先按商家描述和默认电商结构整理方向。',
    },
    audienceInsight: audience
      ? `当前主要围绕“${audience}”的购买决策去组织表达，重点要让对方快速感到适合自己。`
      : '当前用户人群信息偏少，建议先按大众电商成交语境去组织表达。',
    emotionalHook: sellingPointList[0]
      ? `先把“${sellingPointList[0]}”包装成用户第一眼就能感受到的好处，而不是只讲功能词。`
      : '首屏先让用户快速感受到“这件商品会给我带来什么好处”。',
    visualKeywords: [style || '电商高转化', scenes ? `${scenes}感` : '生活感', '主体清晰', '留白干净', '重点卖点突出'].filter(Boolean),
    trustSignals: [
      '局部细节放大',
      '材质或做工说明',
      '参数规格清晰',
      audience ? `表达贴近${audience}` : '表达贴近日常成交语境',
    ].filter(Boolean),
    moduleBlueprints: [
      { name: '首图模块', purpose: '第一眼建立吸引力', visualFocus: '商品主体 + 第一卖点', copyAngle: '先讲用户最容易感知到的好处' },
      { name: '核心卖点模块', purpose: '拆开讲清楚理由', visualFocus: '卖点图标或局部细节', copyAngle: `围绕${sellingPointList.slice(0, 3).join(' / ') || '核心卖点'}展开` },
      { name: '细节模块', purpose: '补可信度', visualFocus: '材质、结构、做工特写', copyAngle: '把“为什么值得买”讲实' },
      { name: '场景模块', purpose: '增强代入感', visualFocus: scenes || '生活化使用情境', copyAngle: '告诉用户适合在什么场景使用' },
      { name: '收口模块', purpose: '推动成交', visualFocus: '行动提示 + 关键信息回收', copyAngle: '把前面卖点收拢成下单理由' },
    ],
    ctaDirection: {
      headline: `${productName || '这款商品'}适合先用一句短促有记忆点的话收口`,
      support: 'CTA 不要只写“立即购买”，最好回收前面最强卖点或场景理由。',
    },
    modulePlan,
    imagePromptDraft: `${productName || '商品'}，突出${sellingPointList.slice(0, 3).join('、') || '核心卖点'}，整体风格${style || '电商高转化'}，适合${scenes || '日常使用'}场景，画面干净清晰，方便后续延展成详情页首图。`,
    missingInfo: [
      !readResult && !scenes ? '建议补一个主要使用场景。' : '',
      !readResult && !audience ? '建议补一个目标人群。' : '',
      hasReferenceScreenshot ? '后续可以再结合参考截图做更细的模块判断。' : '',
      !hasProductImage ? '建议上传商品图，不然颜色和主体外观无法锁定。' : '',
    ].filter(Boolean),
    riskWarnings: [
      !readResult ? '当前没有参考页，摘要更依赖商家描述，风格判断会更主观。': '',
      sellingPointList.length < 2 ? '卖点信息偏少，后续首图和模块会更容易泛。' : '',
      !audience ? '目标人群未明确，文案语气可能不够聚焦。' : '',
      !hasProductImage ? '没有商品图时，模型更容易脑补颜色和外观。' : '',
    ].filter(Boolean),
    revision: {
      feedbackText: revisionMeta.feedbackText,
      selectedTags: revisionMeta.selectedTags,
      autoCategories: revisionMeta.autoCategories,
      appliedChanges: revisionMeta.appliedChanges,
      revisionRound: revisionMeta.feedbackText || revisionMeta.selectedTags.length ? Math.max(Number(revisionRound) || 0, 1) : 0,
    },
  };
}

function buildDetailAnalysisPrompt(input) {
  const sourceMode = input.readResult ? 'reference' : 'description';
  return `
你是电商详情页策划顾问。你的任务不是出图，而是把参考页信息或商家描述整理成“出图前方案摘要”。

请严格输出 JSON，不要输出 markdown，不要解释，不要加多余文字。

输出 JSON 结构：
{
  "sourceMode": "reference 或 description",
  "productName": "用户自己的商品名",
  "productType": "商品类型判断",
  "productVisualSummary": "先明确我从商品图里看到的主体、颜色、外观特征，如果看不清就写待确认，不能乱猜",
  "coreSellingPoints": ["最多4条"],
  "referenceTakeaways": ["最多4条，说明参考页值得学什么；如果没有参考页，就写描述型模式下该怎么定方向"],
  "pageModules": [
    { "name": "模块名", "purpose": "这个模块主要讲什么" }
  ],
  "heroDirection": {
    "headline": "首图建议主打什么",
    "visualFocus": "首图视觉重点",
    "reason": "为什么这样安排"
  },
  "audienceInsight": "这个商品当前更应该打给谁，为什么",
  "emotionalHook": "首屏最该抓住用户什么感觉",
  "visualKeywords": ["最多6条视觉关键词"],
  "trustSignals": ["最多5条，后续详情页里要补哪些信任信息"],
  "moduleBlueprints": [
    {
      "name": "模块名",
      "purpose": "这屏主要完成什么任务",
      "visualFocus": "画面重点放哪里",
      "copyAngle": "文案应该从什么角度讲"
    }
  ],
  "ctaDirection": {
    "headline": "收口区建议怎么喊",
    "support": "收口区还要补什么辅助说明"
  },
  "modulePlan": ["后续模块建议顺序，最多6条"],
  "imagePromptDraft": "后续可交给 image2 的首图说明草稿",
  "missingInfo": ["缺什么信息会让后面更准，最多4条"],
  "riskWarnings": ["当前这版方案最容易偏掉的地方，最多4条"]
}

规则：
1. 用户自己的商品永远是主角，不要把参考页商品当成要出图的商品。
2. 如果上传了商品图，必须先以商品图为准识别商品主体、颜色、外观、拍摄角度。后面所有描述都不能和商品图冲突。
3. 如果商品图里是蓝色车，就不能写成黑色车；如果看不清颜色，就明确写“颜色待确认”，不要脑补。
4. 如果有参考页，重点总结“它的表达方式和模块结构值得学什么”。
5. 如果没有参考页，就按商家描述整理一个合理的电商详情页方案。
6. 用语直接、好懂，不要空话，不要写泛泛而谈的营销套话。
7. pageModules、moduleBlueprints 和 modulePlan 要能直接指导下一步出图。
8. 输出要更像电商策划案，而不是只给抽象结论。

下面是输入信息：
${input.revisionFeedback ? `本轮还有一段必须优先处理的修改意见：${input.revisionFeedback}\n如果有 revisionTags，请把这些标签也一起参考：${normalizeRevisionTags(input.revisionTags).join('、') || '无'}\n` : ''}${JSON.stringify({
  sourceMode,
  productName: input.productName,
  sellingPoints: input.sellingPoints,
  scenes: input.scenes,
  audience: input.audience,
  extra: input.extra,
  style: input.style,
  url: input.url,
  productVisualFacts: input.productVisualFacts || null,
  readResult: input.readResult || null,
  revisionFeedback: input.revisionFeedback || '',
  revisionTags: normalizeRevisionTags(input.revisionTags),
  revisionRound: Number(input.revisionRound) || 0,
  hasProductImage: input.hasProductImage,
  productColorHint: input.productColorHint || '',
  hasReferenceScreenshot: input.hasReferenceScreenshot,
}, null, 2)}
  `.trim();
}

function buildProductVisualPrompt() {
  return `
你是商品图识别助手。请只根据我上传的商品图，输出严格 JSON。

不要猜测看不清的信息。看不清就写“待确认”。
不要输出 markdown，不要解释，不要多余文字。

输出 JSON 结构：
{
  "subjectType": "商品主体类型，例如 轿车 / 水杯 / T恤",
  "primaryColor": "主体主颜色，例如 蓝色 / 黑色 / 白色",
  "secondaryColors": ["最多3条辅助颜色"],
  "angle": "拍摄角度，例如 左前45度 / 平拍 / 俯拍",
  "environment": "当前拍摄环境，例如 车库 / 白底棚拍 / 室内桌面",
  "conditionNotes": ["最多4条外观或状态备注"],
  "confidence": "high / medium / low"
}

规则：
1. 必须优先识别主体颜色，不能乱猜。
2. 如果图里是蓝色车，primaryColor 就必须写蓝色，不能写黑色。
3. 如果主体类型不确定，就写“待确认”。
4. conditionNotes 只写图里真的看得到的状态，例如 车身有水珠、引擎盖未完全合拢、背景有其他车辆。
  `.trim();
}

function toImageDataUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  if (text.startsWith('data:image/')) return text;
  return `data:image/png;base64,${text}`;
}

async function analyzeProductImage(productImageBase64) {
  if (!productImageBase64 || !DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
    return null;
  }

  const imageUrl = toImageDataUrl(productImageBase64);

  const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'qwen-vl-max',
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: buildProductVisualPrompt(),
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[商品图识别失败]', response.status, errText);
    return null;
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message?.content;
  const responseText = Array.isArray(choice)
    ? choice.map((item) => item?.text || '').join('\n')
    : String(choice || '');

  return extractJsonObject(responseText);
}

function buildScenePrompt(sceneDesc) {
  return `你是一位专业的电商产品摄影师。请将这个白底商品图完美融合到以下场景中：
场景描述：${sceneDesc}

要求：
1. 保持商品的外观、颜色、比例完全不变
2. 商品自然地放置在场景中，符合真实物理逻辑
3. 光影效果与场景环境一致
4. 整体画面美观、有质感，适合电商主图使用
5. 画面清晰，分辨率高`;
}

app.post('/api/generate-scene', async (req, res) => {
  try {
    const { image, sceneDesc } = req.body;

    if (!image || !sceneDesc) {
      return res.status(400).json({ error: '请上传商品图片并填写场景描述' });
    }

    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
      return res.status(500).json({ error: '请在 .env 文件中配置 DASHSCOPE_API_KEY' });
    }

    const prompt = buildScenePrompt(sceneDesc);
    const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${image}`,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('API 调用失败:', response.status, errText);
      return res.status(502).json({ error: `API 调用失败: ${response.status}`, detail: errText });
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message?.content;

    if (!choice) {
      return res.status(500).json({ error: 'API 未返回有效结果', detail: JSON.stringify(data) });
    }

    res.json({
      success: true,
      result: choice,
      usage: data.usage,
    });
  } catch (err) {
    console.error('服务端错误', err);
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

app.post('/api/read-detail-page', async (req, res) => {
  try {
    const { url } = req.body || {};
    const targetUrl = String(url || '').trim();

    if (!targetUrl) {
      return res.status(400).json({ error: '请先填写参考详情页链接' });
    }

    if (!isHttpUrl(targetUrl)) {
      return res.status(400).json({ error: '链接格式不对，请填写 http 或 https 开头的完整链接' });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 15000,
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(502).json({ error: `页面读取失败：${response.status}` });
    }

    const contentType = response.headers.get('content-type') || '';
    const html = await response.text();
    const result = buildDetailPageReadResult(targetUrl, response.url, html, contentType);

    if (!result.readable) {
      return res.status(422).json({
        error: '页面已打开，但暂时没有读到清晰内容。可能是目标站点做了防抓取限制，建议改用参考截图。',
        result,
      });
    }

    res.json({
      success: true,
      result,
    });
  } catch (err) {
    console.error('[读取详情页失败]', err);
    res.status(500).json({
      error: '读取详情页失败，请换一个链接，或直接上传参考截图',
      detail: err.message,
    });
  }
});

app.post('/api/analyze-detail-page', async (req, res) => {
  try {
    const {
      productName,
      sellingPoints,
      scenes,
      audience,
      extra,
      style,
      url,
      readResult,
      revisionFeedback,
      revisionTags,
      revisionRound,
      productColorHint,
      productImageBase64,
      referenceScreenshotBase64,
    } = req.body || {};

    if (!String(productName || '').trim()) {
      return res.status(400).json({ error: '请先填写产品名称' });
    }

    if (!String(sellingPoints || '').trim()) {
      return res.status(400).json({ error: '请先填写核心卖点' });
    }

    const fallback = buildFallbackDetailAnalysis({
      productName,
      sellingPoints,
      scenes,
      audience,
      extra,
      style,
      readResult,
      hasProductImage: Boolean(productImageBase64),
      hasReferenceScreenshot: Boolean(referenceScreenshotBase64),
      revisionFeedback,
      revisionTags,
      revisionRound,
    });

    if (productColorHint) {
      fallback.productVisualSummary = `商品图颜色提示：当前主体更接近${productColorHint}，后续描述和生图说明不能改成别的颜色。`;
    }

    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
      return res.json({
        success: true,
        result: fallback,
        meta: { mode: 'fallback', reason: 'missing_api_key' },
      });
    }

    const productVisualFacts = await analyzeProductImage(productImageBase64);
    if (productVisualFacts?.primaryColor) {
      fallback.productVisualSummary = `商品图识别结果：主体看起来是${productVisualFacts.primaryColor}${productVisualFacts.subjectType ? `的${productVisualFacts.subjectType}` : ''}，拍摄环境偏${productVisualFacts.environment || '待确认'}，后续描述必须以这张商品图为准。`;
    }

    const content = [
      {
        type: 'text',
        text: buildDetailAnalysisPrompt({
          productName,
          sellingPoints,
          scenes,
          audience,
          extra,
          style,
          url,
          productColorHint,
          productVisualFacts,
          readResult,
          revisionFeedback,
          revisionTags,
          revisionRound,
          hasProductImage: Boolean(productImageBase64),
          hasReferenceScreenshot: Boolean(referenceScreenshotBase64),
        }),
      },
    ];

    if (productImageBase64) {
      content.unshift({
        type: 'image_url',
        image_url: {
          url: toImageDataUrl(productImageBase64),
        },
      });
    }

    if (referenceScreenshotBase64) {
      content.unshift({
        type: 'image_url',
        image_url: {
          url: toImageDataUrl(referenceScreenshotBase64),
        },
      });
    }

    const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[整理方案失败]', response.status, errText);
      return res.json({
        success: true,
        result: fallback,
        meta: { mode: 'fallback', reason: `api_error_${response.status}` },
      });
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message?.content;
    const responseText = Array.isArray(choice)
      ? choice.map((item) => item?.text || '').join('\n')
      : String(choice || '');
    const parsed = extractJsonObject(responseText);

    if (!parsed) {
      return res.json({
        success: true,
        result: fallback,
        meta: { mode: 'fallback', reason: 'model_output_not_json' },
      });
    }

    const normalized = normalizeSummary(parsed, fallback);
    res.json({
      success: true,
      result: normalized,
      meta: { mode: 'model' },
    });
  } catch (err) {
    console.error('[详情页方案整理失败]', err);
    res.status(500).json({
      error: '整理方案失败，请稍后重试',
      detail: err.message,
    });
  }
});

app.post('/api/generate-scene-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '请提供生成描述' });
    }

    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
      return res.status(500).json({ error: '请在 .env 文件中配置 DASHSCOPE_API_KEY' });
    }

    const response = await fetch(`${DASHSCOPE_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'wanx-v1',
        prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('图像生成 API 调用失败:', response.status, errText);
      return res.status(502).json({ error: `API 调用失败: ${response.status}`, detail: errText });
    }

    const data = await response.json();
    res.json({
      success: true,
      result: data,
    });
  } catch (err) {
    console.error('服务端错误', err);
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

app.post('/api/generate-scene-fusion', async (req, res) => {
  try {
    const { image, sceneDesc } = req.body;

    if (!image || !sceneDesc) {
      return res.status(400).json({ error: '请上传商品图片并填写场景描述' });
    }

    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
      return res.status(500).json({ error: '请在 .env 文件中配置 DASHSCOPE_API_KEY' });
    }

    console.log('[生成] 场景描述:', sceneDesc.slice(0, 80));
    console.log('[生成] 调用 wanx-v1 图生图 API...');

    const generateResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
        'X-DashScope-Async': 'enable',
      },
      body: JSON.stringify({
        model: 'wanx-v1',
        input: {
          ref_image_url: `data:image/png;base64,${image}`,
          prompt: sceneDesc,
        },
        parameters: {
          n: 1,
          size: '1024*1024',
          ref_strength: 0.55,
        },
      }),
    });

    const rawText = await generateResponse.text();
    console.log('[生成] API 响应状态:', generateResponse.status);
    console.log('[生成] API 响应:', rawText.slice(0, 500));

    if (!generateResponse.ok) {
      return res.status(502).json({ error: '图像生成失败', detail: rawText });
    }

    const data = JSON.parse(rawText);

    if (data.output?.task_status === 'PENDING' || data.output?.task_status === 'RUNNING') {
      const taskId = data.output.task_id;
      console.log('[生成] 异步任务:', taskId);

      let result = null;
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const pollRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { Authorization: `Bearer ${DASHSCOPE_API_KEY}` },
        });
        const pollData = await pollRes.json();
        const status = pollData.output?.task_status;
        console.log(`[轮询 #${i + 1}] ${status}`);

        if (status === 'SUCCEEDED') {
          result = pollData;
          break;
        }

        if (status === 'FAILED') {
          console.error('[失败]', JSON.stringify(pollData, null, 2));
          return res.status(502).json({
            error: '图像生成失败',
            detail: pollData.output?.message || JSON.stringify(pollData),
          });
        }
      }

      if (!result) {
        return res.status(504).json({ error: '生成超时（120秒）' });
      }

      return res.json({
        success: true,
        result: { data: result.output.results.map((item) => ({ url: item.url })) },
      });
    }

    res.json({ success: true, result: data });
  } catch (err) {
    console.error('[服务端错误]', err);
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log('\nEcom AI Studio started');
  console.log(`URL: http://localhost:${PORT}`);
  console.log(`API Key: ${DASHSCOPE_API_KEY ? 'configured' : 'missing'}`);
});
