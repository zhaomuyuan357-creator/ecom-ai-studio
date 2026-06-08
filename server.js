require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const REFERENCE_VIDEO_PATH = 'C:\\Users\\Edward\\Videos\\NVIDIA\\Desktop\\Desktop 2026.06.08 - 12.55.40.01.mp4';

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/reference-video', (req, res) => {
  res.sendFile(REFERENCE_VIDEO_PATH);
});

// 通义千问 API 配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

/**
 * 场景图生成 Prompt 模板
 * 将白底商品图与场景描述融合，保持商品外观不变
 */
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

/**
 * POST /api/generate-scene
 * 场景图生成接口
 * 接收：{ image: base64字符串, sceneDesc: 场景描述 }
 * 返回：{ image: base64生成结果 }
 */
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

    // 调用通义千问视觉模型，传入图片 + prompt
    const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
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

    // 从响应中提取生成的图片
    const choice = data.choices?.[0]?.message?.content;

    if (!choice) {
      return res.status(500).json({ error: 'API 未返回有效结果', detail: JSON.stringify(data) });
    }

    // 通义千问返回的可能是文本描述或图片URL
    // 如果返回的是图片URL，直接返回；如果是文本，说明模型不支持直接生图
    res.json({
      success: true,
      result: choice,
      usage: data.usage,
    });

  } catch (err) {
    console.error('服务端错误:', err);
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

/**
 * POST /api/generate-scene-image
 * 使用 qwen-image-2.0 纯图像生成接口
 * 接收：{ prompt: 生成描述 }
 * 返回：{ image: base64 / URL }
 */
app.post('/api/generate-scene-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: '请提供生成描述' });
    }

    if (!DASHSCOPE_API_KEY || DASHSCOPE_API_KEY === 'sk-your-api-key-here') {
      return res.status(500).json({ error: '请在 .env 文件中配置 DASHSCOPE_API_KEY' });
    }

    // 调用通义千问图像生成模型
    const response = await fetch(`${DASHSCOPE_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'wanx-v1',
        prompt: prompt,
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
    console.error('服务端错误:', err);
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

/**
 * POST /api/generate-scene-fusion
 * 场景融合接口：使用 wanx-v1 图生图能力，传入参考商品图 + 场景描述
 *
 * wanx-v1 支持 ref_image_url 参数，可以基于参考图生成新图
 * ref_strength 控制参考图影响程度（0-1），0.5 为平衡值
 */
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

    // 使用 wanx-v1 图生图：传入参考图 + 场景 prompt
    const generateResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/image2image/image-synthesis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
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

    // 异步轮询
    if (data.output?.task_status === 'PENDING' || data.output?.task_status === 'RUNNING') {
      const taskId = data.output.task_id;
      console.log('[生成] 异步任务:', taskId);

      let result = null;
      for (let i = 0; i < 60; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const pollRes = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
          headers: { 'Authorization': `Bearer ${DASHSCOPE_API_KEY}` },
        });
        const pollData = await pollRes.json();
        const status = pollData.output?.task_status;
        console.log(`[轮询 #${i + 1}] ${status}`);

        if (status === 'SUCCEEDED') { result = pollData; break; }
        if (status === 'FAILED') {
          console.error('[失败]', JSON.stringify(pollData, null, 2));
          return res.status(502).json({ error: '图像生成失败', detail: pollData.output?.message || JSON.stringify(pollData) });
        }
      }

      if (!result) return res.status(504).json({ error: '生成超时（120秒）' });

      return res.json({
        success: true,
        result: { data: result.output.results.map(r => ({ url: r.url })) },
      });
    }

    res.json({ success: true, result: data });

  } catch (err) {
    console.error('[服务端错误]', err);
    res.status(500).json({ error: '服务器内部错误', detail: err.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 Ecom AI Studio 已启动`);
  console.log(`   地址: http://localhost:${PORT}`);
  console.log(`   API Key: ${DASHSCOPE_API_KEY ? '已配置 ✓' : '❌ 未配置（请编辑 .env 文件）'}\n`);
});
