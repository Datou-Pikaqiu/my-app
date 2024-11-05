import { ChatRequestBody, ZhipuResponse } from '@/types/chat';
import { generateToken } from '@/utils/auth';

const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY;
const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 系统提示语，指导AI以适合中学生的方式回答
const SYSTEM_PROMPT = {
  role: "system",
  content: `你是一位有耐心、善于引导的中学老师。在回答学生问题时，请遵循以下原则：
1. 使用适合中学生认知水平的语言
2. 不直接给出答案，而是通过提问引导学生思考
3. 鼓励学生独立思考和探索
4. 在学生遇到困难时给予适当的提示
5. 用生活中的例子来解释抽象概念
6. 肯定学生的思考过程
7. 培养学生的批判性思维
8. 如果涉及解题，引导学生理解解题思路而不是记忆答案

记住：你的目标是培养学生的学习能力和思维方式，而不是简单地提供答案。`
};

export async function POST(request: Request) {
  if (!ZHIPU_API_KEY) {
    console.error('API密钥未配置');
    return Response.json(
      { error: 'API密钥未配置，请检查环境变量' },
      { status: 500 }
    );
  }

  try {
    const body: ChatRequestBody = await request.json();
    console.log('收到请求体:', JSON.stringify(body, null, 2));

    if (!body.messages || body.messages.length === 0) {
      console.error('消息内容为空');
      return Response.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 在每次对话开始时添加系统提示语
    const messages = [SYSTEM_PROMPT, ...body.messages];

    const token = generateToken(ZHIPU_API_KEY);
    console.log('Generated token:', token);

    console.log('正在发送请求到智谱API...');
    const requestBody = {
      model: "glm-4",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
    };
    
    console.log('请求体:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('智谱API响应状态:', response.status);
    const responseText = await response.text();
    console.log('智谱API原始响应:', responseText);

    if (!response.ok) {
      const errorMessage = `API请求失败: ${response.status} ${response.statusText}\n响应内容: ${responseText}`;
      console.error(errorMessage);
      return Response.json({ error: errorMessage }, { status: response.status });
    }

    let data: ZhipuResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('JSON解析失败:', e);
      return Response.json({ error: 'API返回的数据格式无效' }, { status: 500 });
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error('无效的响应数据结构:', data);
      return Response.json({ error: '无效的API响应格式' }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json(
      { 
        error: error instanceof Error ? error.message : '处理请求时发生错误',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}