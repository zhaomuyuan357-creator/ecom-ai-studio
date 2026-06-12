const DEFAULT_TIMEOUT_MS = Number(process.env.EXTERNAL_REQUEST_TIMEOUT_MS || 20000);

const DASHSCOPE_BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const TEXT_PROVIDER = String(process.env.TEXT_PROVIDER || 'qwen').trim().toLowerCase();
const VISION_PROVIDER = String(process.env.VISION_PROVIDER || 'qwen').trim().toLowerCase();
const IMAGE_PROVIDER = String(process.env.IMAGE_PROVIDER || 'dashscope').trim().toLowerCase();
const QWEN_TEXT_MODEL = process.env.QWEN_TEXT_MODEL || 'qwen-plus';
const QWEN_VISION_MODEL = process.env.QWEN_VISION_MODEL || 'qwen-vl-max';
const QWEN_IMAGE_MODEL = process.env.QWEN_IMAGE_MODEL || process.env.DASHSCOPE_IMAGE_MODEL || 'wan2.5-i2i-preview';

const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

function hasUsableKey(value) {
  const text = String(value || '').trim();
  return Boolean(text && !/your-api-key/i.test(text));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function toImageDataUrl(base64) {
  const text = String(base64 || '').trim();
  if (!text) return '';
  if (text.startsWith('data:image/')) return text;
  const mime = text.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${text}`;
}

function guessImageMime(base64) {
  return String(base64 || '').trim().startsWith('/9j/') ? 'image/jpeg' : 'image/png';
}

function extractMessageText(data) {
  const choice = data?.choices?.[0]?.message?.content;
  if (Array.isArray(choice)) {
    return choice.map((item) => item?.text || '').join('\n').trim();
  }
  return String(choice || '').trim();
}

function normalizeOpenAIImageSize(size) {
  const value = String(size || '').trim().replace('*', 'x');
  if (['1024x1024', '1024x1536', '1536x1024', 'auto'].includes(value)) {
    return value;
  }
  return '1024x1024';
}

function normalizeDashScopeImageSize(size) {
  const value = String(size || '').trim().replace('x', '*');
  if (['1024*1024', '1024*1536', '1536*1024'].includes(value)) {
    return value;
  }
  return '1024*1024';
}

function ensureProviderReady(capability) {
  if (capability === 'text') {
    if (TEXT_PROVIDER !== 'qwen') {
      throw new Error(`暂不支持的文本模型供应商: ${TEXT_PROVIDER}`);
    }
    if (!hasUsableKey(DASHSCOPE_API_KEY)) {
      throw new Error('请先配置 DASHSCOPE_API_KEY 以启用千问文本能力');
    }
    return;
  }

  if (capability === 'vision') {
    if (VISION_PROVIDER !== 'qwen') {
      throw new Error(`暂不支持的视觉模型供应商: ${VISION_PROVIDER}`);
    }
    if (!hasUsableKey(DASHSCOPE_API_KEY)) {
      throw new Error('请先配置 DASHSCOPE_API_KEY 以启用千问视觉能力');
    }
    return;
  }

  if (capability === 'image') {
    if (IMAGE_PROVIDER === 'openai') {
      if (!hasUsableKey(OPENAI_API_KEY)) {
        throw new Error('请先配置 OPENAI_API_KEY 以启用 OpenAI 生图能力');
      }
      return;
    }

    if (IMAGE_PROVIDER === 'dashscope') {
      if (!hasUsableKey(DASHSCOPE_API_KEY)) {
        throw new Error('请先配置 DASHSCOPE_API_KEY 以启用 DashScope 生图能力');
      }
      return;
    }

    throw new Error(`暂不支持的生图供应商: ${IMAGE_PROVIDER}`);
  }

  throw new Error(`未知能力类型: ${capability}`);
}

async function runQwenChat({ prompt, imagesBase64 = [], temperature = 0.2, model }) {
  ensureProviderReady(imagesBase64.length ? 'vision' : 'text');

  const content = [
    ...imagesBase64
      .map((item) => toImageDataUrl(item))
      .filter(Boolean)
      .map((url) => ({
        type: 'image_url',
        image_url: { url },
      })),
    {
      type: 'text',
      text: String(prompt || '').trim(),
    },
  ];

  const response = await fetchWithTimeout(`${DASHSCOPE_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
    },
    body: JSON.stringify({
      model: model || (imagesBase64.length ? QWEN_VISION_MODEL : QWEN_TEXT_MODEL),
      temperature,
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    }),
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(rawText || `Qwen API 调用失败: ${response.status}`);
  }

  const data = JSON.parse(rawText);
  return {
    provider: imagesBase64.length ? VISION_PROVIDER : TEXT_PROVIDER,
    model: model || (imagesBase64.length ? QWEN_VISION_MODEL : QWEN_TEXT_MODEL),
    text: extractMessageText(data),
    raw: data,
  };
}

async function runOpenAIImageEdit(task) {
  ensureProviderReady('image');

  const imageBase64List = [
    String(task.imageBase64 || '').trim(),
    ...(Array.isArray(task.referenceImagesBase64)
      ? task.referenceImagesBase64.map((item) => String(item || '').trim()).filter(Boolean)
      : []),
  ].filter(Boolean);

  if (!imageBase64List.length) {
    throw new Error('OpenAI 图像编辑至少需要一张输入图片');
  }

  const formData = new FormData();
  formData.append('model', task.model || OPENAI_IMAGE_MODEL);
  formData.append('prompt', String(task.prompt || '').trim());
  formData.append('size', normalizeOpenAIImageSize(task.size));
  formData.append('n', '1');
  formData.append('response_format', 'b64_json');

  if (imageBase64List.length === 1) {
    const mime = guessImageMime(imageBase64List[0]);
    const ext = mime === 'image/jpeg' ? 'jpg' : 'png';
    formData.append(
      'image',
      new Blob([Buffer.from(imageBase64List[0], 'base64')], { type: mime }),
      `product.${ext}`
    );
  } else {
    imageBase64List.forEach((imageBase64, index) => {
      const mime = guessImageMime(imageBase64);
      const ext = mime === 'image/jpeg' ? 'jpg' : 'png';
      formData.append(
        'image[]',
        new Blob([Buffer.from(imageBase64, 'base64')], { type: mime }),
        index === 0 ? `product.${ext}` : `reference-${index}.${ext}`
      );
    });
  }

  const response = await fetchWithTimeout(`${OPENAI_BASE_URL}/images/edits`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  }, Math.max(DEFAULT_TIMEOUT_MS, 60000));

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(rawText || `OpenAI 图像编辑失败: ${response.status}`);
  }

  return JSON.parse(rawText);
}

async function runDashScopeImageTask(task) {
  ensureProviderReady('image');

  const imageDataUrls = [
    toImageDataUrl(task.imageBase64),
    ...(Array.isArray(task.referenceImagesBase64)
      ? task.referenceImagesBase64.map((item) => toImageDataUrl(item))
      : []),
  ].filter(Boolean);

  const generateResponse = await fetchWithTimeout('https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: task.model || QWEN_IMAGE_MODEL,
      input: {
        prompt: String(task.prompt || '').trim(),
        images: imageDataUrls,
      },
      parameters: {
        n: 1,
        size: normalizeDashScopeImageSize(task.size),
        prompt_extend: true,
      },
    }),
  }, Math.max(DEFAULT_TIMEOUT_MS, 60000));

  const rawText = await generateResponse.text();
  if (!generateResponse.ok) {
    throw new Error(rawText || `DashScope 图生图失败: ${generateResponse.status}`);
  }

  const data = JSON.parse(rawText);

  if (data.output?.task_status === 'PENDING' || data.output?.task_status === 'RUNNING') {
    const taskId = data.output.task_id;
    let result = null;

    for (let i = 0; i < 8; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const pollRes = await fetchWithTimeout(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
        headers: {
          Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
        },
      }, Math.max(DEFAULT_TIMEOUT_MS, 60000));
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

    return result;
  }

  return data;
}

async function generateImage(task) {
  if (IMAGE_PROVIDER === 'openai') {
    return runOpenAIImageEdit(task);
  }

  if (IMAGE_PROVIDER === 'dashscope') {
    return runDashScopeImageTask(task);
  }

  throw new Error(`暂不支持的生图供应商: ${IMAGE_PROVIDER}`);
}

function getProviderSummary() {
  return {
    text: {
      provider: TEXT_PROVIDER,
      model: QWEN_TEXT_MODEL,
      configured: TEXT_PROVIDER === 'qwen' ? hasUsableKey(DASHSCOPE_API_KEY) : false,
    },
    vision: {
      provider: VISION_PROVIDER,
      model: QWEN_VISION_MODEL,
      configured: VISION_PROVIDER === 'qwen' ? hasUsableKey(DASHSCOPE_API_KEY) : false,
    },
    image: {
      provider: IMAGE_PROVIDER,
      model: IMAGE_PROVIDER === 'openai' ? OPENAI_IMAGE_MODEL : QWEN_IMAGE_MODEL,
      configured: IMAGE_PROVIDER === 'openai'
        ? hasUsableKey(OPENAI_API_KEY)
        : hasUsableKey(DASHSCOPE_API_KEY),
    },
  };
}

module.exports = {
  getProviderSummary,
  runTextModel: (input) => runQwenChat({ ...input, imagesBase64: [] }),
  runVisionModel: (input) => runQwenChat(input),
  generateImage,
};
