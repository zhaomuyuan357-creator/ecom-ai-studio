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
const IMAGE_PROVIDER = process.env.IMAGE_PROVIDER || 'dashscope';
const DASHSCOPE_IMAGE_MODEL = process.env.DASHSCOPE_IMAGE_MODEL || 'wan2.5-i2i-preview';

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

const DETAIL_MODULE_LIBRARY = [
  {
    key: 'hero',
    group: 'required',
    name: '首屏海报',
    order: 1,
    lockedWithHero: true,
    aliases: ['hero', '首图', '首屏', '海报'],
    purpose: '延续第 6 步已确认的首图方向，作为整套详情页的第一屏基线。',
    visualFocus: '沿用 hero 主体、第一卖点和当前风格基线',
    copyAngle: '第一屏先把商品身份和用户第一眼能感知到的好处讲清楚',
    startAction: '直接沿用已确认 hero，不重复出图，从下一屏开始继续扩展',
    requiredInputs: [],
    optionalInputs: ['productName', 'sellingPoints', 'heroImageUrl'],
  },
  {
    key: 'selling-points',
    group: 'required',
    name: '核心卖点',
    order: 2,
    aliases: ['卖点', '核心卖点', '优势'],
    purpose: '把核心优势拆成更适合电商浏览的卖点模块，避免只堆一段文案。',
    visualFocus: '主卖点图标、局部特写和关键信息分层',
    copyAngle: '把 2 到 3 个最值得讲的理由拆开讲清楚',
    startAction: '建议先从这块开始进入正式生成，最容易承接首图后的转化节奏',
    requiredInputs: ['sellingPoints'],
    optionalInputs: ['productName', 'audience', 'scenes', 'extra'],
  },
  {
    key: 'params',
    group: 'required',
    name: '产品参数',
    order: 3,
    aliases: ['参数', '规格', '尺寸'],
    purpose: '整理规格、材质和适用信息，补齐购买决策所需的基础说明。',
    visualFocus: '参数表、尺寸结构和材质信息的清晰排布',
    copyAngle: '用最低理解成本把购买前必须确认的信息说明白',
    startAction: '放在卖点后面承接理性决策信息，避免过早打断首屏节奏',
    requiredInputs: ['paramSpecs'],
    optionalInputs: ['extra', 'readResult'],
  },
  {
    key: 'details',
    group: 'required',
    name: '细节图',
    order: 4,
    aliases: ['细节', '特写', '做工', '材质'],
    purpose: '强化局部特写、做工和质感，支持卖点可信度。',
    visualFocus: '局部放大、材质纹理和结构细节',
    copyAngle: '把“为什么值得买”落到可感知的细节证据上',
    startAction: '适合在核心卖点之后进入，强化真实感和品质感',
    requiredInputs: [],
    optionalInputs: ['sellingPoints', 'productImage', 'extra'],
  },
  {
    key: 'scenes',
    group: 'required',
    name: '场景使用图',
    order: 5,
    aliases: ['场景', '使用场景', '实拍场景'],
    purpose: '说明商品适合在什么场景下使用，帮助买家建立代入感。',
    visualFocus: '真实使用环境、人物关系或生活化陈列',
    copyAngle: '告诉买家它适合在哪些时刻出现，而不只是长什么样',
    startAction: '在理性信息后补生活化画面，更接近真实电商详情页节奏',
    requiredInputs: ['scenes'],
    optionalInputs: ['audience', 'sellingPoints'],
  },
  {
    key: 'variants',
    group: 'required',
    name: '款式/颜色分类',
    order: 6,
    aliases: ['颜色', '款式', '变体', '分类'],
    purpose: '把可选款式、颜色或组合关系讲清楚，减少下单前反复确认。',
    visualFocus: '不同配色、规格或组合的并列展示',
    copyAngle: '把选择差异说明白，减少用户理解成本',
    startAction: '适合放在中后段，帮助用户快速完成版本选择',
    requiredInputs: ['variantInfo'],
    optionalInputs: ['extra', 'readResult'],
  },
  {
    key: 'trust',
    group: 'required',
    name: '资质/品牌保障',
    order: 7,
    aliases: ['资质', '品牌', '保障', '认证', '信任'],
    purpose: '补强平台信任感、品牌说明或合规背书。',
    visualFocus: '证书、品牌说明、检测或保障信息',
    copyAngle: '把用户最后的顾虑收掉，增强下单安心感',
    startAction: '通常适合在中后段补强信任，不需要压到第一屏前面',
    requiredInputs: ['trustInfo'],
    optionalInputs: ['extra', 'readResult'],
  },
  {
    key: 'after-sales',
    group: 'required',
    name: '售后说明',
    order: 8,
    aliases: ['售后', '配送', '退换', '服务'],
    purpose: '把配送、退换和售后边界讲清楚，作为详情页收口保障。',
    visualFocus: '服务说明、承诺条目和履约信息',
    copyAngle: '降低购买风险感，给用户明确预期',
    startAction: '建议作为后段收口模块，和 CTA 信息一起整理',
    requiredInputs: ['afterSalesInfo'],
    optionalInputs: ['extra'],
  },
  {
    key: 'demo',
    group: 'optional',
    name: '功能演示图',
    order: 9,
    aliases: ['演示', '功能', '步骤'],
    purpose: '适合有明确使用动作、步骤或功能效果的商品。',
    visualFocus: '动作拆解、功能前后变化或步骤流程',
    copyAngle: '让用户一眼看懂怎么用，以及用了会怎样',
    startAction: '如果商品依赖功能理解，这块适合优先提前到卖点之后',
    requiredInputs: ['sellingPoints'],
    optionalInputs: ['scenes', 'extra', 'readResult'],
  },
  {
    key: 'comparison',
    group: 'optional',
    name: '对比图',
    order: 10,
    aliases: ['对比', '升级', '差异'],
    purpose: '适合需要突出升级点、差异点或替代关系的商品。',
    visualFocus: '新旧对比、竞品对比或版本差异',
    copyAngle: '明确说明为什么这款更值得选',
    startAction: '适合在核心卖点之后加入，用来拉开差异感',
    requiredInputs: ['comparisonBasis'],
    optionalInputs: ['sellingPoints', 'readResult'],
  },
  {
    key: 'size-guide',
    group: 'optional',
    name: '尺码选购指南',
    order: 11,
    aliases: ['尺码', '选购指南', '穿着'],
    purpose: '服饰鞋包专属，帮助用户完成尺码或规格选择。',
    visualFocus: '尺码表、测量方式和适配建议',
    copyAngle: '降低尺寸不确定感，减少售后咨询',
    startAction: '如果当前品类需要尺码判断，建议作为参数模块的增强版一起进入',
    requiredInputs: ['sizeGuideInfo'],
    optionalInputs: ['audience', 'extra'],
  },
  {
    key: 'bundle',
    group: 'optional',
    name: '搭配推荐',
    order: 12,
    aliases: ['搭配', '组合', '连带'],
    purpose: '适合组合销售、连带购买或提升客单价的商品。',
    visualFocus: '组合陈列、关联商品和使用搭配',
    copyAngle: '把单件商品放进更完整的购买场景里',
    startAction: '适合作为后段的加购模块，不需要和主卖点抢第一波注意力',
    requiredInputs: ['bundleInfo'],
    optionalInputs: ['scenes', 'sellingPoints', 'extra'],
  },
  {
    key: 'reviews',
    group: 'optional',
    name: '买家秀/口碑',
    order: 13,
    aliases: ['买家秀', '口碑', '评价', '反馈'],
    purpose: '适合补真实反馈、使用感受和口碑证明。',
    visualFocus: '真实反馈截图、用户评价摘录和场景返图',
    copyAngle: '用第三方视角补可信度，而不是自己反复自夸',
    startAction: '适合靠后补强信任，在资质保障之后自然衔接',
    requiredInputs: ['reviewProof'],
    optionalInputs: ['readResult', 'extra'],
  },
];

const DETAIL_INPUT_REQUIREMENT_COPY = {
  productName: {
    label: '商品名称',
    missingLabel: '补商品名称',
    description: '先明确这块在讲哪一款商品。',
  },
  sellingPoints: {
    label: '核心卖点',
    missingLabel: '补核心卖点',
    description: '没有明确卖点时，这块容易写空话。',
  },
  scenes: {
    label: '使用场景',
    missingLabel: '补使用场景',
    description: '需要明确商品适合什么使用情境，场景图才不会乱演。',
  },
  audience: {
    label: '目标人群',
    missingLabel: '补目标人群',
    description: '补充给谁买，有助于收紧文案语气和表达重点。',
  },
  extra: {
    label: '补充说明',
    missingLabel: '补充业务说明',
    description: '如果有特殊业务口径，建议先写进补充说明。',
  },
  readResult: {
    label: '参考详情页摘要',
    missingLabel: '补参考页摘要',
    description: '参考页读到的结构信息可以帮助这块更贴近真实详情页。',
  },
  heroImageUrl: {
    label: '首图基线',
    missingLabel: '先确认首图',
    description: '这一块需要沿用已确认的首图基线。',
  },
  productImage: {
    label: '商品图',
    missingLabel: '先上传商品图',
    description: '细节类板块需要以真实商品图为准，而不是靠脑补。',
  },
  paramSpecs: {
    label: '规格/参数信息',
    missingLabel: '补规格参数',
    description: '没有尺寸、材质、规格这类明确数据时，不能正式生成参数板块。',
  },
  variantInfo: {
    label: '款式/颜色信息',
    missingLabel: '补款式颜色',
    description: '需要先说明有哪些颜色、款式或组合，AI 不能自己编变体。',
  },
  trustInfo: {
    label: '资质/品牌/背书信息',
    missingLabel: '补资质或品牌信息',
    description: '没有品牌、证书或背书资料时，不能自动生成信任证明。',
  },
  afterSalesInfo: {
    label: '售后政策',
    missingLabel: '补售后政策',
    description: '退换、配送、保修这类规则必须由用户给出，不能让 AI 乱写。',
  },
  comparisonBasis: {
    label: '对比依据',
    missingLabel: '补对比依据',
    description: '需要明确是和旧款、竞品还是基础款对比，避免凭空制造差异。',
  },
  sizeGuideInfo: {
    label: '尺码/选购依据',
    missingLabel: '补尺码信息',
    description: '没有尺码表、测量方式或选购建议时，不应该生成尺码模块。',
  },
  bundleInfo: {
    label: '搭配/组合信息',
    missingLabel: '补搭配方案',
    description: '要先告诉系统搭配什么卖、怎么组合，才能做连带推荐。',
  },
  reviewProof: {
    label: '买家反馈/口碑素材',
    missingLabel: '补评价素材',
    description: '买家秀和口碑模块必须依赖真实反馈，不能凭空生成评价。',
  },
};

function normalizeSelectedDetailModules(value) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      key: String(item?.key || '').trim(),
      group: item?.group === 'optional' ? 'optional' : 'required',
      selected: item?.selected !== false,
    }))
    .filter((item) => item.key && item.selected);
}

function includesModuleAlias(text, aliases = []) {
  return aliases.some((alias) => text.includes(alias));
}

function findModuleInsight(summary, moduleDef) {
  const blueprint = (summary?.moduleBlueprints || []).find((item) => {
    const haystack = `${item?.name || ''} ${item?.purpose || ''} ${item?.visualFocus || ''} ${item?.copyAngle || ''}`;
    return includesModuleAlias(haystack, moduleDef.aliases);
  });

  if (blueprint) {
    return {
      sourceName: String(blueprint.name || '').trim(),
      purpose: String(blueprint.purpose || '').trim(),
      visualFocus: String(blueprint.visualFocus || '').trim(),
      copyAngle: String(blueprint.copyAngle || '').trim(),
    };
  }

  const pageModule = (summary?.pageModules || []).find((item) => {
    const haystack = `${item?.name || ''} ${item?.purpose || ''}`;
    return includesModuleAlias(haystack, moduleDef.aliases);
  });

  if (pageModule) {
    return {
      sourceName: String(pageModule.name || '').trim(),
      purpose: String(pageModule.purpose || '').trim(),
      visualFocus: '',
      copyAngle: '',
    };
  }

  return null;
}

function findModulePlanHint(summary, moduleDef) {
  return (summary?.modulePlan || []).find((item) => includesModuleAlias(String(item || ''), moduleDef.aliases)) || '';
}

function normalizeWorkbenchContext(input = {}) {
  const supplementalInfo = input.supplementalInfo && typeof input.supplementalInfo === 'object'
    ? input.supplementalInfo
    : {};
  const supplementalText = Object.values(supplementalInfo).map((value) => String(value || '').trim()).join(' ').toLowerCase();
  const textFields = {
    productName: String(input.productName || '').trim(),
    sellingPoints: String(input.sellingPoints || '').trim(),
    scenes: String(input.scenes || '').trim(),
    audience: String(input.audience || '').trim(),
    extra: String(input.extra || '').trim(),
  };

  const readResult = input.readResult && typeof input.readResult === 'object' ? input.readResult : null;
  const extraText = textFields.extra.toLowerCase();
  const readText = JSON.stringify(readResult || {}).toLowerCase();
  const nameAndSceneText = `${textFields.productName} ${textFields.scenes} ${textFields.extra}`.toLowerCase();

  return {
    ...textFields,
    heroImageUrl: String(input.heroImageUrl || '').trim(),
    readResult,
    productImage: Boolean(input.hasProductImage),
    supplementalInfo,
    paramSpecs: String(supplementalInfo.paramSpecs || '').trim() || /尺寸|尺码|规格|参数|材质|容量|重量|长宽高|面料|克重|功率|续航/.test(`${extraText} ${supplementalText}`) || /尺寸|规格|参数/.test(readText),
    variantInfo: String(supplementalInfo.variantInfo || '').trim() || /颜色|色号|款式|套装|组合|规格可选|版本/.test(`${extraText} ${supplementalText}`) || /颜色|款式|套餐/.test(readText),
    trustInfo: String(supplementalInfo.trustInfo || '').trim() || /品牌|资质|认证|检测|质保|正品|专利|背书|授权/.test(`${extraText} ${supplementalText}`) || /品牌|认证|质保|授权/.test(readText),
    afterSalesInfo: String(supplementalInfo.afterSalesInfo || '').trim() || /售后|退换|运费险|保修|发货|配送|包邮|换货/.test(`${extraText} ${supplementalText}`),
    comparisonBasis: String(supplementalInfo.comparisonBasis || '').trim() || /对比|竞品|升级|旧款|新版|前后/.test(`${extraText} ${supplementalText}`) || /对比|升级/.test(readText),
    sizeGuideInfo: String(supplementalInfo.sizeGuideInfo || '').trim() || /尺码|胸围|衣长|鞋码|脚长|选码|试穿/.test(`${extraText} ${supplementalText}`) || /shoe|apparel|fashion|服|鞋|裤|裙|包/.test(nameAndSceneText),
    bundleInfo: String(supplementalInfo.bundleInfo || '').trim() || /搭配|组合|加购|套餐|连带|推荐搭配/.test(`${extraText} ${supplementalText}`),
    reviewProof: String(supplementalInfo.reviewProof || '').trim() || /评价|口碑|买家秀|反馈|晒单/.test(`${extraText} ${supplementalText}`) || /评价|口碑|买家/.test(readText),
  };
}

function getRequirementInfo(key) {
  return DETAIL_INPUT_REQUIREMENT_COPY[key] || {
    label: key,
    missingLabel: `补${key}`,
    description: '需要先补充这项信息。',
  };
}

function evaluateModuleReadiness(moduleDef, context) {
  const requiredInputs = Array.isArray(moduleDef.requiredInputs) ? moduleDef.requiredInputs : [];
  const optionalInputs = Array.isArray(moduleDef.optionalInputs) ? moduleDef.optionalInputs : [];
  const missingRequiredInputs = requiredInputs.filter((key) => {
    const value = context[key];
    return !(Array.isArray(value) ? value.length : value);
  });

  const ready = missingRequiredInputs.length === 0;
  const missingInputBadges = missingRequiredInputs.map((key) => {
    const info = getRequirementInfo(key);
    return {
      key,
      label: info.missingLabel,
      description: info.description,
    };
  });

  const suggestedInputBadges = optionalInputs
    .filter((key) => {
      const value = context[key];
      return Array.isArray(value) ? value.length : value;
    })
    .map((key) => {
      const info = getRequirementInfo(key);
      return {
        key,
        label: info.label,
      };
    });

  let status = 'ready';
  let statusLabel = '可进入正式生成';
  let readinessNote = '当前信息足够进入这一块的正式生成。';

  if (moduleDef.lockedWithHero && context.heroImageUrl) {
    status = 'locked';
    statusLabel = '已由第 6 步首图锁定';
    readinessNote = '这一块直接沿用已确认首图，不需要重复出图。';
  } else if (!ready) {
    status = 'needs_input';
    statusLabel = '需先补信息';
    readinessNote = `缺少${missingRequiredInputs.map((key) => getRequirementInfo(key).label).join('、')}，先补完再生成更稳。`;
  }

  return {
    status,
    statusLabel,
    readinessNote,
    ready,
    requiredInputs,
    missingRequiredInputs,
    missingInputBadges,
    suggestedInputBadges,
  };
}

function buildDetailModuleWorkbench(input = {}) {
  const summary = input.summary || {};
  const context = normalizeWorkbenchContext(input);
  const selectedModules = normalizeSelectedDetailModules(input.selectedModules);
  const selectedDefs = selectedModules
    .map((item) => {
      const moduleDef = DETAIL_MODULE_LIBRARY.find((candidate) => candidate.key === item.key);
      if (!moduleDef) return null;
      return { ...moduleDef, group: item.group || moduleDef.group };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);

  const modules = selectedDefs.map((moduleDef, index) => {
    const insight = findModuleInsight(summary, moduleDef);
    const planHint = findModulePlanHint(summary, moduleDef);
    const readiness = evaluateModuleReadiness(moduleDef, context);
    const isHeroLocked = readiness.status === 'locked';

    return {
      key: moduleDef.key,
      group: moduleDef.group,
      name: moduleDef.name,
      queueIndex: index + 1,
      lockedWithHero: isHeroLocked,
      ready: readiness.ready,
      status: readiness.status,
      statusLabel: readiness.statusLabel,
      readinessNote: readiness.readinessNote,
      requiredInputs: readiness.requiredInputs,
      missingRequiredInputs: readiness.missingRequiredInputs,
      missingInputBadges: readiness.missingInputBadges,
      suggestedInputBadges: readiness.suggestedInputBadges,
      generationGoal: insight?.purpose || moduleDef.purpose,
      visualFocus: insight?.visualFocus || moduleDef.visualFocus,
      copyAngle: insight?.copyAngle || moduleDef.copyAngle,
      sourceHint: insight?.sourceName || '',
      planHint: readiness.status === 'needs_input'
        ? readiness.readinessNote
        : (planHint || moduleDef.startAction),
      startAction: moduleDef.startAction,
    };
  });

  const firstReadyModule = modules.find((item) => item.status === 'ready') || null;
  const needsInputCount = modules.filter((item) => item.status === 'needs_input').length;

  return {
    productName: String(input.productName || summary.productName || '').trim(),
    style: String(input.style || '').trim(),
    heroImageUrl: String(input.heroImageUrl || '').trim(),
    totalSelected: modules.length,
    requiredSelected: modules.filter((item) => item.group === 'required').length,
    optionalSelected: modules.filter((item) => item.group === 'optional').length,
    readyCount: modules.filter((item) => item.status === 'ready').length,
    lockedCount: modules.filter((item) => item.status === 'locked').length,
    needsInputCount,
    nextRecommendedModule: firstReadyModule
      ? {
          key: firstReadyModule.key,
          name: firstReadyModule.name,
          queueIndex: firstReadyModule.queueIndex,
        }
      : null,
    stageSummary: firstReadyModule
      ? `已进入详情页板块工作台，建议先从「${firstReadyModule.name}」开始正式生成。`
      : needsInputCount
        ? '当前已选板块里有信息不足的部分，建议先补资料，再继续往下生成。'
        : '当前已选板块都已完成基础锁定，可继续确认是否还要补充新的模块。',
    modules,
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

function buildSupplementalImagePrompt(fieldKey) {
  const fieldPrompts = {
    paramSpecs: '这是一张商品参数、规格或材质相关图片。请只提取图片里明确可读的尺寸、规格、材质、容量、重量、适用信息。',
    variantInfo: '这是一张商品颜色、款式、版本或组合相关图片。请只提取图片里明确出现的颜色、款式、规格、套装关系。',
    trustInfo: '这是一张品牌、资质、认证、检测或背书相关图片。请只提取图片里能明确识别出的品牌、认证、质检、授权、保障信息。',
    afterSalesInfo: '这是一张售后、配送、退换或保修相关图片。请只提取图片里明确写出的发货、退换、运费险、保修、服务政策。',
    comparisonBasis: '这是一张商品对比、升级点或差异说明相关图片。请只提取图片里明确写出的对比对象和差异点。',
    sizeGuideInfo: '这是一张尺码表或选购指南相关图片。请只提取图片里明确写出的尺码、测量方式、身高体重建议或选购建议。',
    bundleInfo: '这是一张搭配推荐、套餐组合或关联销售相关图片。请只提取图片里明确写出的搭配关系、套餐组成和组合卖点。',
    reviewProof: '这是一张买家评价、口碑反馈或晒单相关图片。请只提取图片里明确出现的真实评价、反馈关键词和使用感受。',
  };

  return `
你是电商详情页资料识别助手。你的任务不是创作，而是从图片里提取可以直接用于详情页板块补资料的文字信息。

当前字段：${fieldKey}
识别重点：${fieldPrompts[fieldKey] || '请提取图片里与当前详情页资料补充最相关的文字信息。'}

输出要求：
1. 只输出严格 JSON，不要输出 markdown，不要解释。
2. 只能提取图片里明确可见或可读的内容，不要脑补，不要扩写。
3. 如果图片里信息不清楚，就忽略那部分，不要编造。
4. 把结果压缩成适合直接回填输入框的一段中文。

输出 JSON 结构：
{
  "text": "提取后的简洁中文，适合直接回填到补充输入框"
}
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

function buildDetailHeroPrompt(input = {}) {
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join('、');
  return `
你是电商首图生成助手。现在不是生成整套详情页，只生成第 6 步的首图。
请严格以用户上传的商品图为准，不要改商品主体颜色、外观、材质、比例和主要结构。

这次首图的目标：
1. 先把商品主体讲清楚
2. 先把第一卖点讲清楚
3. 画面要像真实电商首图，不要像泛创意海报
4. 风格、文案气质和构图都要服务后续详情页延展

已确认的首图方向：
- 商品名称：${input.productName || '待确认商品'}
- 首图主打：${input.heroHeadline || '待补充'}
- 视觉重点：${input.heroVisualFocus || '待补充'}
- 情绪钩子：${input.emotionalHook || '待补充'}
- 目标人群：${input.audienceInsight || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}
- 商品识别摘要：${input.productVisualSummary || '待补充'}
- 风格方向：${input.style || '电商高转化'}

可直接参考的首图草稿：
${input.imagePromptDraft || ''}

生成要求：
1. 商品必须仍然是这张商品图里的同一件商品
2. 如果商品图里已经能看清颜色，就绝对不能改色
3. 首图优先突出主体和第一卖点，不要堆太多装饰元素
4. 保持干净、可信、适合电商转化的画面
5. 构图适合做详情页第一屏，方便后续继续扩展卖点图和长图模块
6. 如果有场景，只做轻量辅助，不要喧宾夺主
  `.trim();
}

function buildDetailSellingPointsPrompt(input = {}) {
  const sellingPoints = toArray(input.coreSellingPoints).slice(0, 4).join('、');
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join('、');

  return `
你是电商详情页模块生成助手。现在不要生成整套详情页，只生成“核心卖点模块”这一张图。
请严格以用户上传的商品图为准，不要改商品主体颜色、外观、材质、比例和主要结构。

这次只做第一个正式进入生成的详情页板块：
- 模块名称：核心卖点
- 商品名称：${input.productName || '待确认商品'}
- 当前风格：${input.style || '电商高转化'}
- 首图基线：${input.heroHeadline || '待补充'}
- 首图视觉重点：${input.heroVisualFocus || '待补充'}
- 商品视觉摘要：${input.productVisualSummary || '待补充'}
- 核心卖点：${sellingPoints || '待补充'}
- 目标人群：${input.audienceInsight || '待补充'}
- 使用场景：${input.scenes || '待补充'}
- 情绪钩子：${input.emotionalHook || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}

生成要求：
1. 这是详情页里的“卖点模块”，不是重新做首图。
2. 画面要延续第 6 步首图的风格基线，但更聚焦卖点表达。
3. 允许加入轻量文案编排感、图标感、局部特写感，但不要做成杂乱海报。
4. 优先突出 2 到 3 个最值得讲的卖点，不要堆过多信息。
5. 适合放在首图之后，作为详情页第二屏或第三屏。
6. 商品主体仍然要真实、清晰、可信，不能为了卖点夸张变形。
  `.trim();
}

function buildDetailDetailsPrompt(input = {}) {
  const sellingPoints = toArray(input.coreSellingPoints).slice(0, 4).join('、');
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join('、');

  return `
你是电商详情页模块生成助手。现在不要生成整套详情页，只生成“细节图模块”这一张图。
请严格以用户上传的商品图为准，不要改商品主体颜色、外观、材质、比例和主要结构。

当前模块信息：
- 模块名称：细节图
- 商品名称：${input.productName || '待确认商品'}
- 当前风格：${input.style || '电商高转化'}
- 首图基线：${input.heroHeadline || '待补充'}
- 首图视觉重点：${input.heroVisualFocus || '待补充'}
- 商品视觉摘要：${input.productVisualSummary || '待补充'}
- 核心卖点：${sellingPoints || '待补充'}
- 目标人群：${input.audienceInsight || '待补充'}
- 使用场景：${input.scenes || '待补充'}
- 情绪钩子：${input.emotionalHook || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}

生成要求：
1. 这是详情页里的“细节图模块”，重点是局部特写、材质、做工、真实痕迹，不是重新做首图。
2. 画面要延续第 6 步首图基线，但更聚焦可验证的细节证据。
3. 尽量用近景、局部放大、结构特写来支撑卖点可信度。
4. 如果商品有真实使用痕迹、材质纹理、反光、缝线、接口、边角等，可适度强化这些内容。
5. 整体仍要保持电商感、真实感和清晰度，不要做成抽象广告图。
6. 适合放在卖点模块后，作为用户进一步确认品质的那一屏。
  `.trim();
}

function buildDetailParamsPrompt(input = {}) {
  const paramSpecs = String(input.paramSpecs || '').trim();
  const variantInfo = String(input.variantInfo || '').trim();
  const sizeGuideInfo = String(input.sizeGuideInfo || '').trim();
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join('、');

  return `
你是电商详情页模块生成助手。现在不要生成整套详情页，只生成“产品参数模块”这一张图。
请严格以用户上传的商品图为准，不要改商品主体颜色、外观、材质、比例和主要结构。

当前模块信息：
- 模块名称：产品参数
- 商品名称：${input.productName || '待确认商品'}
- 当前风格：${input.style || '电商高转化'}
- 首图基线：${input.heroHeadline || '待补充'}
- 首图视觉重点：${input.heroVisualFocus || '待补充'}
- 商品视觉摘要：${input.productVisualSummary || '待补充'}
- 规格/参数信息：${paramSpecs || '待补充'}
- 款式/颜色信息：${variantInfo || '待补充'}
- 尺码/选购依据：${sizeGuideInfo || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}

生成要求：
1. 这是详情页里的“参数模块”，重点是把用户已经给出的尺寸、规格、材质、容量、年份、排量、配置等信息整理清楚。
2. 不能新增用户没有提供的数据，不能编参数。
3. 画面可以做成清晰的信息分栏、参数卡片、结构化表格感，但仍要延续当前详情页风格。
4. 如果同时给了款式/颜色或尺码信息，可以轻量并入这一屏，但主重点仍是参数清晰展示。
5. 参数信息必须可读、整齐、低理解成本，适合放在卖点模块之后承接理性决策。
6. 仍然保留商品主体或局部辅助视觉，不要只做纯文字海报。
  `.trim();
}

function buildDetailScenesPrompt(input = {}) {
  const sellingPoints = toArray(input.coreSellingPoints).slice(0, 4).join(' / ');
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join(' / ');

  return `
你是电商详情页模块生成助手。现在只生成“场景使用图模块”这一张图，不是重做首图，也不是整套详情页批量出图。
请严格以用户上传的商品图为准，不要改商品主体颜色、外形和结构。

当前模块信息：
- 模块名称：场景使用图
- 商品名称：${input.productName || '待确认商品'}
- 当前风格：${input.style || '电商高转化'}
- 首图基线：${input.heroHeadline || '待补充'}
- 首图视觉重点：${input.heroVisualFocus || '待补充'}
- 商品视觉摘要：${input.productVisualSummary || '待补充'}
- 核心卖点：${sellingPoints || '待补充'}
- 使用场景：${input.scenes || '待补充'}
- 目标人群：${input.audienceInsight || '待补充'}
- 情绪钩子：${input.emotionalHook || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}

生成要求：
1. 这一屏要让用户看懂“这个商品会在什么真实情境中被使用”。
2. 画面是详情页里的场景化展示，不是泛创意海报。
3. 优先突出环境、动作关系、生活化代入感，不要空泛摆拍。
4. 如需人物或手部入镜，只能作为轻辅助，不能喧宾夺主。
5. 场景必须以用户提供的信息为准，不能擅自编造新的用途。
6. 风格继续沿用 Step 06 首图基线，但更像详情页中后段的生活化模块。`.trim();
}

function buildDetailVariantsPrompt(input = {}) {
  const variantInfo = String(input.variantInfo || '').trim();
  const sizeGuideInfo = String(input.sizeGuideInfo || '').trim();
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join(' / ');

  return `
你是电商详情页模块生成助手。现在只生成“款式/颜色分类模块”这一张图。
这块内容只能基于用户明确提供的款式、颜色、组合、版本信息，不能自行补写不存在的变体。

当前模块信息：
- 模块名称：款式/颜色分类
- 商品名称：${input.productName || '待确认商品'}
- 当前风格：${input.style || '电商高转化'}
- 首图基线：${input.heroHeadline || '待补充'}
- 商品视觉摘要：${input.productVisualSummary || '待补充'}
- 变体信息：${variantInfo || '待补充'}
- 尺码/选购依据：${sizeGuideInfo || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}

生成要求：
1. 把不同版本、颜色、款式或组合关系展示清楚，降低下单前反复确认。
2. 不能新增用户没提供的颜色、规格或套餐。
3. 画面可用并列卡片、标签、分栏或样机对比，但必须一眼看懂差异。
4. 如果有尺码或选购建议，可以轻量带入，但主重点仍是变体差异。
5. 商品主体要真实，不能为了排版把商品改成不存在的样子。
6. 风格继续沿用当前详情页基线，适合放在参数模块之后作为选购辅助。`.trim();
}

function buildDetailTrustPrompt(input = {}) {
  const trustInfo = String(input.trustInfo || '').trim();
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join(' / ');

  return `
你是电商详情页模块生成助手。现在只生成“资质/品牌保障模块”这一张图。
这一块只能基于用户提供的品牌、资质、认证、授权、检测或质保信息来生成，不能虚构任何背书。

当前模块信息：
- 模块名称：资质/品牌保障
- 商品名称：${input.productName || '待确认商品'}
- 当前风格：${input.style || '电商高转化'}
- 首图基线：${input.heroHeadline || '待补充'}
- 商品视觉摘要：${input.productVisualSummary || '待补充'}
- 信任/资质信息：${trustInfo || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}

生成要求：
1. 用已经提供的证据支撑“为什么可信”，不能编资质。
2. 画面可以包含证书、品牌说明、授权信息、检测摘要，但必须正式、克制、可信。
3. 如果素材不够支撑复杂背书画面，就采用保守排版，不要做成假证书墙。
4. 这是中后段的信任提升模块，不要做成主卖点海报。
5. 风格要与当前详情页一致，但语气更偏权威、安心、合规。
6. 商品主体可以轻量露出，核心仍是信任证据的清晰展示。`.trim();
}

function buildDetailAfterSalesPrompt(input = {}) {
  const afterSalesInfo = String(input.afterSalesInfo || '').trim();
  const visualKeywords = toArray(input.visualKeywords).slice(0, 6).join(' / ');

  return `
你是电商详情页模块生成助手。现在只生成“售后说明模块”这一张图。
这一块只能依据用户明确提供的退换、发货、配送、保修、客服承诺等政策信息，不能自行补写售后规则。

当前模块信息：
- 模块名称：售后说明
- 商品名称：${input.productName || '待确认商品'}
- 当前风格：${input.style || '电商高转化'}
- 首图基线：${input.heroHeadline || '待补充'}
- 商品视觉摘要：${input.productVisualSummary || '待补充'}
- 售后政策：${afterSalesInfo || '待补充'}
- 视觉关键词：${visualKeywords || '待补充'}

生成要求：
1. 目标是降低购买前风险感，让售后承诺和边界清楚好读。
2. 不能新增用户没有提供的退换时效、保修年限、运费规则或其他条款。
3. 画面可以做成卡片式说明、清单式承诺、服务标签或流程化表达，但必须易读。
4. 它属于详情页尾段的收口保障，不要过度花哨。
5. 如政策信息较多，优先做清晰层级，不要堆满小字。
6. 风格继续沿用当前详情页基线，但语气更稳定、更让人安心。`.trim();
}

function ensureImageProviderReady() {
  if (IMAGE_PROVIDER !== 'dashscope') {
    throw new Error(`暂不支持的生图供应商: ${IMAGE_PROVIDER}`);
  }

  if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
    throw new Error('请在 .env 文件中配置 DASHSCOPE_API_KEY');
  }
}

function toDashScopeImageDataUrl(imageBase64) {
  const mime = String(imageBase64 || '').trim().startsWith('/9j/') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${imageBase64}`;
}

function createImageGenerationTask(input = {}) {
  return {
    provider: IMAGE_PROVIDER,
    model: input.model || DASHSCOPE_IMAGE_MODEL,
    prompt: String(input.prompt || '').trim(),
    imageBase64: String(input.imageBase64 || '').trim(),
    size: input.size || '1024*1024',
    useCase: input.useCase || 'generic',
  };
}

function normalizeGeneratedImages(result) {
  const mapImageItem = (item) => {
    const imageUrl = String(
      item?.url ||
      item?.image ||
      item?.image_url ||
      item?.imageUrl ||
      ''
    ).trim();
    const imageB64 = String(
      item?.b64_json ||
      item?.b64 ||
      item?.image_base64 ||
      item?.imageBase64 ||
      ''
    ).trim();

    return {
      url: imageUrl,
      b64: imageB64,
    };
  };

  const collectNestedImageItems = (value, depth = 0, bucket = []) => {
    if (!value || depth > 6) return bucket;

    if (Array.isArray(value)) {
      value.forEach((item) => collectNestedImageItems(item, depth + 1, bucket));
      return bucket;
    }

    if (typeof value !== 'object') {
      return bucket;
    }

    const normalized = mapImageItem(value);
    if (normalized.url || normalized.b64) {
      bucket.push(normalized);
    }

    Object.keys(value).forEach((key) => {
      const child = value[key];
      if (child && (Array.isArray(child) || typeof child === 'object')) {
        collectNestedImageItems(child, depth + 1, bucket);
      }
    });

    return bucket;
  };

  const uniqueImageItems = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const signature = `${item.url}::${item.b64}`;
      if ((!item.url && !item.b64) || seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  };

  if (Array.isArray(result?.data)) {
    return result.data
      .map(mapImageItem)
      .filter((item) => item.url || item.b64);
  }

  if (Array.isArray(result?.output?.results)) {
    return result.output.results
      .map(mapImageItem)
      .filter((item) => item.url || item.b64);
  }

  if (Array.isArray(result?.output?.image_url)) {
    return result.output.image_url
      .map((item) => mapImageItem(typeof item === 'string' ? { image_url: item } : item))
      .filter((item) => item.url || item.b64);
  }

  if (result?.output?.image_url || result?.output?.image) {
    const normalized = mapImageItem(result.output);
    return normalized.url || normalized.b64 ? [normalized] : [];
  }

  const nestedMatches = uniqueImageItems(collectNestedImageItems(result));
  if (nestedMatches.length) {
    return nestedMatches;
  }

  return [];
}

function normalizeImageGenerationResponse(task, rawResult, meta = {}) {
  return {
    success: true,
    result: {
      provider: task.provider,
      model: task.model,
      useCase: task.useCase,
      images: normalizeGeneratedImages(rawResult),
    },
    meta,
  };
}

function getSceneImageTaskInput(body = {}) {
  return {
    prompt: String(body.sceneDesc || body.prompt || '').trim(),
    imageBase64: String(body.imageBase64 || body.image || '').trim(),
  };
}

async function generateSceneImageResult(body = {}) {
  const { prompt, imageBase64 } = getSceneImageTaskInput(body);

  if (!prompt || !imageBase64) {
    const error = new Error('璇蜂笂浼犲晢鍝佸浘鐗囧苟濉啓鍦烘櫙鎻忚堪');
    error.statusCode = 400;
    throw error;
  }

  const task = createImageGenerationTask({
    useCase: 'scene_fusion',
    prompt,
    imageBase64,
  });
  const rawResult = await runImageGenerationTask(task);
  return normalizeImageGenerationResponse(task, rawResult);
}

async function runDashScopeImageTask(task) {
  const imageDataUrl = toDashScopeImageDataUrl(task.imageBase64);

  const generateResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: task.model,
      input: {
        prompt: task.prompt,
        images: [imageDataUrl],
      },
      parameters: {
        n: 1,
        size: task.size,
        prompt_extend: true,
      },
    }),
  });

  const rawText = await generateResponse.text();

  if (!generateResponse.ok) {
    throw new Error(rawText || `API 调用失败: ${generateResponse.status}`);
  }

  const data = JSON.parse(rawText);

  if (data.output?.task_status === 'PENDING' || data.output?.task_status === 'RUNNING') {
    const taskId = data.output.task_id;
    let result = null;

    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const pollRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${DASHSCOPE_API_KEY}` },
      });
      const pollData = await pollRes.json();
      const status = pollData.output?.task_status;

      if (status === 'SUCCEEDED') {
        result = pollData;
        break;
      }

      if (status === 'FAILED') {
        throw new Error(pollData.output?.message || JSON.stringify(pollData));
      }
    }

    if (!result) {
      throw new Error('生成超时，请稍后重试');
    }

    return { data: normalizeGeneratedImages(result) };
  }

  return data;
}

async function runImageGenerationTask(task) {
  ensureImageProviderReady();

  if (!task.prompt) {
    throw new Error('请提供生成描述');
  }

  if (!task.imageBase64) {
    throw new Error('请先上传商品图片');
  }

  switch (task.provider) {
    case 'dashscope':
      return runDashScopeImageTask(task);
    default:
      throw new Error(`暂不支持的生图供应商: ${task.provider}`);
  }
}

app.post('/api/generate-scene', async (req, res) => {
  try {
    const { image, sceneDesc } = req.body;

    if (!image || !sceneDesc) {
      return res.status(400).json({ error: '请上传商品图片并填写场景描述' });
    }

    {
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

app.use('/api/generate-scene-image', async (req, res, next) => {
  if (req.method !== 'POST') return next();

  try {
    const data = await generateSceneImageResult(req.body);
    return res.json(data);
  } catch (err) {
    console.error('[scene-image-route]', err);
    return res.status(err.statusCode || 500).json({
      error: err.statusCode ? err.message : '鏈嶅姟鍣ㄥ唴閮ㄩ敊璇?',
      detail: err.message,
    });
  }
});

app.use('/api/generate-scene-fusion', async (req, res, next) => {
  if (req.method !== 'POST') return next();

  try {
    const data = await generateSceneImageResult(req.body);
    return res.json(data);
  } catch (err) {
    console.error('[scene-fusion-route]', err);
    return res.status(err.statusCode || 500).json({
      error: err.statusCode ? err.message : '鏈嶅姟鍣ㄥ唴閮ㄩ敊璇?',
      detail: err.message,
    });
  }
});

app.post('/api/generate-scene-image', async (req, res) => {
  try {
    const { prompt, imageBase64 } = getSceneImageTaskInput(req.body);
    const sceneDesc = prompt;

    if (!prompt || !imageBase64) {
      return res.status(400).json({ error: '请上传商品图片并填写场景描述' });
    }

    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
      return res.status(500).json({ error: '请在 .env 文件中配置 DASHSCOPE_API_KEY' });
    }

    const task = createImageGenerationTask({
      useCase: 'scene_fusion',
      prompt,
      imageBase64,
    });
    const rawResult = await runImageGenerationTask(task);
    return res.json(normalizeImageGenerationResponse(task, rawResult));

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

app.post('/api/generate-detail-hero', async (req, res) => {
  try {
    const {
      productImageBase64,
      productName,
      style,
      imagePromptDraft,
      heroDirection,
      emotionalHook,
      audienceInsight,
      visualKeywords,
      productVisualSummary,
    } = req.body || {};

    if (!productImageBase64 || !String(productImageBase64).trim()) {
      return res.status(400).json({ error: '请先上传商品白底图' });
    }

    if (!String(imagePromptDraft || '').trim()) {
      return res.status(400).json({ error: '请先完成第 5 步方案确认，再进入首图生成' });
    }

    const prompt = buildDetailHeroPrompt({
      productName,
      style,
      imagePromptDraft,
      heroHeadline: heroDirection?.headline,
      heroVisualFocus: heroDirection?.visualFocus,
      emotionalHook,
      audienceInsight,
      visualKeywords,
      productVisualSummary,
    });

    const task = createImageGenerationTask({
      useCase: 'detail_hero',
      prompt,
      imageBase64: String(productImageBase64).trim(),
    });
    const rawResult = await runImageGenerationTask(task);
    res.json(normalizeImageGenerationResponse(task, rawResult, { prompt }));
  } catch (err) {
    console.error('[详情页首图生成失败]', err);
    res.status(500).json({ error: '首图生成失败，请稍后重试', detail: err.message });
  }
});

app.post('/api/generate-detail-module', async (req, res) => {
  try {
    const {
      moduleKey,
      productImageBase64,
      productName,
      style,
      summary,
      scenes,
      supplementalInfo,
    } = req.body || {};

    const normalizedModuleKey = String(moduleKey || '').trim();
    if (!productImageBase64 || !String(productImageBase64).trim()) {
      return res.status(400).json({ error: '请先上传商品白底图，再生成详情页板块' });
    }

    if (!summary || typeof summary !== 'object') {
      return res.status(400).json({ error: '请先完成前面的详情页摘要和首图确认' });
    }

    const promptInput = {
      productName,
      style,
      scenes,
      coreSellingPoints: summary.coreSellingPoints || [],
      visualKeywords: summary.visualKeywords || [],
      heroHeadline: summary.heroDirection?.headline || '',
      heroVisualFocus: summary.heroDirection?.visualFocus || '',
      productVisualSummary: summary.productVisualSummary || '',
      audienceInsight: summary.audienceInsight || '',
      emotionalHook: summary.emotionalHook || '',
      paramSpecs: supplementalInfo?.paramSpecs || '',
      variantInfo: supplementalInfo?.variantInfo || '',
      trustInfo: supplementalInfo?.trustInfo || '',
      afterSalesInfo: supplementalInfo?.afterSalesInfo || '',
      sizeGuideInfo: supplementalInfo?.sizeGuideInfo || '',
    };

    let prompt = '';
    let useCase = '';
    if (normalizedModuleKey === 'selling-points') {
      prompt = buildDetailSellingPointsPrompt(promptInput);
      useCase = 'detail_selling_points';
    } else if (normalizedModuleKey === 'details') {
      prompt = buildDetailDetailsPrompt(promptInput);
      useCase = 'detail_details';
    } else if (normalizedModuleKey === 'params') {
      if (!String(promptInput.paramSpecs || '').trim()) {
        return res.status(400).json({ error: '产品参数板块必须先补充规格/参数信息，再进入正式生成' });
      }
      prompt = buildDetailParamsPrompt(promptInput);
      useCase = 'detail_params';
    } else if (normalizedModuleKey === 'scenes') {
      if (!String(promptInput.scenes || '').trim()) {
        return res.status(400).json({ error: '场景使用图需要先补充明确的使用场景，再进入正式生成' });
      }
      prompt = buildDetailScenesPrompt(promptInput);
      useCase = 'detail_scenes';
    } else if (normalizedModuleKey === 'variants') {
      if (!String(promptInput.variantInfo || '').trim()) {
        return res.status(400).json({ error: '款式/颜色分类模块需要先补充变体信息，再进入正式生成' });
      }
      prompt = buildDetailVariantsPrompt(promptInput);
      useCase = 'detail_variants';
    } else if (normalizedModuleKey === 'trust') {
      if (!String(promptInput.trustInfo || '').trim()) {
        return res.status(400).json({ error: '资质/品牌保障模块需要先补充品牌或资质信息，再进入正式生成' });
      }
      prompt = buildDetailTrustPrompt(promptInput);
      useCase = 'detail_trust';
    } else if (normalizedModuleKey === 'after-sales') {
      if (!String(promptInput.afterSalesInfo || '').trim()) {
        return res.status(400).json({ error: '售后说明模块需要先补充售后政策，再进入正式生成' });
      }
      prompt = buildDetailAfterSalesPrompt(promptInput);
      useCase = 'detail_after_sales';
    } else {
      return res.status(400).json({ error: '当前只接入了核心卖点、细节图和产品参数板块的正式生成' });
    }

    const task = createImageGenerationTask({
      useCase,
      prompt,
      imageBase64: String(productImageBase64).trim(),
    });
    const rawResult = await runImageGenerationTask(task);
    res.json(normalizeImageGenerationResponse(task, rawResult, {
      prompt,
      moduleKey: normalizedModuleKey,
    }));
  } catch (err) {
    console.error('[detail-module-generation]', err);
    res.status(500).json({
      error: '详情页板块生成失败，请稍后重试',
      detail: err.message,
    });
  }
});

app.post('/api/prepare-detail-modules', async (req, res) => {
  try {
    const {
      productName,
      style,
      summary,
      selectedModules,
      heroImageUrl,
      sellingPoints,
      scenes,
      audience,
      extra,
      readResult,
      hasProductImage,
      supplementalInfo,
    } = req.body || {};

    if (!summary || typeof summary !== 'object') {
      return res.status(400).json({ error: '请先完成第 5 步方案摘要确认，再进入详情页板块工作台' });
    }

    const normalizedModules = normalizeSelectedDetailModules(selectedModules);
    if (!normalizedModules.length) {
      return res.status(400).json({ error: '请先确认本次要生成的详情页板块' });
    }

    const result = buildDetailModuleWorkbench({
      productName,
      style,
      summary,
      selectedModules: normalizedModules,
      heroImageUrl,
      sellingPoints,
      scenes,
      audience,
      extra,
      readResult,
      hasProductImage,
      supplementalInfo,
    });

    res.json({
      success: true,
      result,
      meta: { mode: 'planner' },
    });
  } catch (err) {
    console.error('[detail-module-workbench]', err);
    res.status(500).json({
      error: '整理详情页板块工作台失败，请稍后重试',
      detail: err.message,
    });
  }
});

app.post('/api/analyze-detail-module-asset', async (req, res) => {
  try {
    const { fieldKey, imageBase64 } = req.body || {};
    const normalizedFieldKey = String(fieldKey || '').trim();
    const normalizedImageBase64 = String(imageBase64 || '').trim();

    if (!normalizedFieldKey) {
      return res.status(400).json({ error: '请先说明当前要识别的是哪类板块资料' });
    }

    if (!normalizedImageBase64) {
      return res.status(400).json({ error: '请先上传要识别的图片' });
    }

    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
      return res.json({
        success: true,
        result: {
          text: '当前环境还没有配置图片识别能力，请先手动补充这项信息。',
        },
        meta: { mode: 'fallback', reason: 'missing_api_key' },
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
        temperature: 0.1,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: toImageDataUrl(normalizedImageBase64),
                },
              },
              {
                type: 'text',
                text: buildSupplementalImagePrompt(normalizedFieldKey),
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[detail-module-asset-recognition]', response.status, errText);
      return res.status(502).json({ error: '图片识别失败，请换一张更清晰的图再试', detail: errText });
    }

    const data = await response.json();
    const choice = data.choices?.[0]?.message?.content;
    const responseText = Array.isArray(choice)
      ? choice.map((item) => item?.text || '').join('\n')
      : String(choice || '');
    const parsed = extractJsonObject(responseText);
    const text = String(parsed?.text || responseText || '').trim();

    if (!text) {
      return res.status(422).json({ error: '暂时没有从图片里识别出可直接使用的信息' });
    }

    res.json({
      success: true,
      result: { text },
      meta: { mode: 'model' },
    });
  } catch (err) {
    console.error('[detail-module-asset-recognition]', err);
    res.status(500).json({
      error: '图片识别失败，请稍后重试',
      detail: err.message,
    });
  }
});

app.post('/api/generate-scene-fusion', async (req, res) => {
  try {
    const { prompt, imageBase64 } = getSceneImageTaskInput(req.body);
    const sceneDesc = prompt;

    if (!prompt || !imageBase64) {
      return res.status(400).json({ error: '请上传商品图片并填写场景描述' });
    }

    console.log('[生成] 场景描述:', sceneDesc.slice(0, 80));
    console.log(`[生成] 调用 ${IMAGE_PROVIDER} 图生图 API...`);

    const task = createImageGenerationTask({
      useCase: 'scene_fusion',
      prompt,
      imageBase64,
    });
    const rawResult = await runImageGenerationTask(task);
    res.json(normalizeImageGenerationResponse(task, rawResult));
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
