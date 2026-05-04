// test-agent.js  →  now using MiniMax
import { ToolLoopAgent, tool } from 'ai';
import { minimax } from 'vercel-minimax-ai-provider';
import { z } from 'zod';

const addNumbers = tool({
  description: 'Add two numbers together',
  parameters: z.object({
    a: z.number().describe('First number'),
    b: z.number().describe('Second number'),
  }),
  execute: async ({ a, b }) => {
    const sum = a + b;
    return { result: sum, explanation: `${a} + ${b} = ${sum}` };
  },
});

const agent = new ToolLoopAgent({
  model: minimax('MiniMax-M2'),          // ← best for agents right now
  // model: minimax('MiniMax-M2-Stable'), // alternative if you want more stability
  instructions: 'You are a precise math assistant. Always use tools when numbers are involved. Explain your reasoning step by step.',
  tools: { addNumbers },
});

async function main() {
  try {
    const result = await agent.generate({
      prompt: 'What is 47 plus 128? Then add 19 more to the result.',
    });

    console.log('Final answer:', result.text);
    console.log('\nSteps taken:', result.steps.length);
    console.log('Tool calls made:', result.steps.filter(s => s.toolCalls?.length > 0).length);
  } catch (err) {
    console.error('Agent failed:', err.message || err);
  }
}

main();
