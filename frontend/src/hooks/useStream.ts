import { useState, useCallback } from 'react';

export const useStream = () => {
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const startStream = useCallback(async (url: string, body: any, onChunk?: (text: string) => void) => {
    setIsStreaming(true);
    setStreamedText('');
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream, application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        const text = data.response || '';
        let current = '';
        const words = text.split(' ');
        
        // Simulating the streaming token output
        for (let i = 0; i < words.length; i++) {
          current += (i === 0 ? '' : ' ') + words[i];
          setStreamedText(current);
          if (onChunk) onChunk(current);
          await new Promise(r => setTimeout(r, 45));
        }
        setIsStreaming(false);
        return text;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No readable stream body');

      let done = false;
      let accumulated = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                done = true;
                break;
              }
              accumulated += data;
              setStreamedText(accumulated);
              if (onChunk) onChunk(accumulated);
            }
          }
        }
      }
      setIsStreaming(false);
      return accumulated;
    } catch (err) {
      console.error('Stream reader error:', err);
      setIsStreaming(false);
      throw err;
    }
  }, []);

  return { startStream, streamedText, isStreaming, setStreamedText };
};
