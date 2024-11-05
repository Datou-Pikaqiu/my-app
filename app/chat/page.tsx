'use client';

import { useState } from 'react';
import { ChatMessage, ZhipuResponse, ErrorResponse } from '@/types/chat';

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
    };

    try {
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      console.log('发送请求到API...');
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      console.log('收到API响应:', response.status);
      const text = await response.text();
      console.log('响应内容:', text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('JSON解析错误:', e);
        throw new Error('服务器返回了无效的数据格式');
      }

      if (!response.ok) {
        console.error('API错误:', data);
        throw new Error((data as ErrorResponse).error || '请求失败');
      }

      // 检查是否是成功的响应
      if ('error' in data) {
        throw new Error((data as ErrorResponse).error);
      }

      // 检查响应数据结构
      const zhipuResponse = data as ZhipuResponse;
      if (!zhipuResponse.choices?.[0]?.message?.content) {
        console.error('无效的响应数据结构:', zhipuResponse);
        throw new Error('API返回的数据格式无效');
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: zhipuResponse.choices[0].message.content,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : '发生未知错误';
      setError(errorMessage);
      // 移除用户最后发送的消息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen flex flex-col">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong className="font-bold">错误：</strong>
          <span className="block sm:inline">{error}</span>
          <button
            className="absolute top-0 right-0 px-4 py-3"
            onClick={() => setError(null)}
            aria-label="关闭错误提示"
          >
            <span className="text-red-500">&times;</span>
          </button>
        </div>
      )}
      
      <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            开始你的对话吧...
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-blue-100 ml-auto max-w-[80%]' 
                  : 'bg-gray-100 mr-auto max-w-[80%]'
              }`}
            >
              <pre className="whitespace-pre-wrap break-words">{message.content}</pre>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center justify-center">
            <div className="animate-pulse text-gray-500">
              AI正在思考...
            </div>
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="sticky bottom-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入您的问题..."
            className="flex-1 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 disabled:bg-gray-400"
          >
            {isLoading ? '发送中...' : '发送'}
          </button>
        </div>
      </form>
    </div>
  )
} 