import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes will be defined before static file serving

// In-memory transaction store (will be swapped for Firestore later).
let transactions = [];

// Cache the last working model to try it first next time
let lastWorkingModel = null;

// Debug: Check if API key is loaded (don't log the actual key)
const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE';
console.log(`[CashWise] Gemini API key loaded: ${hasApiKey ? 'YES' : 'NO'}`);

const gemini = hasApiKey
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Try gemini-1.5-pro which is commonly available
// If this doesn't work, check /api/models endpoint to see available models
const MODEL_NAME = 'gemini-1.5-pro';

const computeSummary = () => {
  const totals = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'income') acc.income += tx.amount;
      if (tx.type === 'expense') acc.expense += tx.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const netCashFlow = totals.income - totals.expense;

  return {
    totalIncome: totals.income,
    totalExpense: totals.expense,
    netCashFlow,
    balance: totals.income - totals.expense,
    count: transactions.length,
  };
};

app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CashWise API running',
    geminiConfigured: hasApiKey 
  });
});

app.get('/api/transactions', (_req, res) => {
  res.json({ transactions });
});

app.post('/api/transactions', (req, res) => {
  const { type, amount, description = '', date } = req.body || {};

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be "income" or "expense"' });
  }

  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }

  const tx = {
    id: randomUUID(),
    type,
    amount: Number(numericAmount.toFixed(2)),
    description: description?.trim() || '',
    date: date || new Date().toISOString().slice(0, 10),
  };

  // Newest first for convenience.
  transactions = [tx, ...transactions];

  res.status(201).json({ transaction: tx, summary: computeSummary() });
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const before = transactions.length;
  transactions = transactions.filter((tx) => tx.id !== id);
  const removed = before !== transactions.length;

  if (!removed) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.json({ deleted: id, summary: computeSummary() });
});

app.get('/api/summary', (_req, res) => {
  res.json(computeSummary());
});

// Function to fetch available models from Google API
async function fetchAvailableModels() {
  if (!process.env.GEMINI_API_KEY) return [];
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    if (!response.ok) {
      console.error('[CashWise] Failed to fetch models:', response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    const models = data.models
      ?.filter(m => m.supportedGenerationMethods?.includes('generateContent'))
      ?.map(m => m.name.replace('models/', ''))
      || [];
    return models;
  } catch (err) {
    console.error('[CashWise] Error fetching models:', err.message);
    return [];
  }
}

// Debug endpoint to list available models
app.get('/api/models', async (_req, res) => {
  if (!gemini) {
    return res.status(400).json({ error: 'GEMINI_API_KEY not set' });
  }
  try {
    const availableModels = await fetchAvailableModels();
    res.json({ 
      availableModels,
      currentModel: MODEL_NAME,
      note: availableModels.length > 0 
        ? 'These are the models available for your API key'
        : 'Could not fetch models. Check your API key permissions.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const parseGeminiJson = (text) => {
  if (!text) return { raw: '' };
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const candidate = jsonMatch ? jsonMatch[0] : text;

  try {
    return JSON.parse(candidate);
  } catch {
    return { raw: text.trim() };
  }
};

app.post('/api/analyze', async (req, res) => {
  if (!gemini) {
    return res
      .status(400)
      .json({ error: 'GEMINI_API_KEY not set. Add it to your .env file to enable analysis.' });
  }

  const horizonDays = Number(req.body?.horizonDays) || 30;
  const summary = computeSummary();
  const recentTransactions = transactions.slice(0, 50); // keep prompt compact

  const prompt = `
You are CashWise, a concise AI cash-flow advisor for small businesses.
Assess whether the business risks running short on cash within the next ${horizonDays} days.
Return valid JSON only, no markdown, in the following shape:
{
  "summary": "1-2 sentence overview",
  "shortageRisk": {
    "riskLevel": "Low" | "Medium" | "High",
    "daysUntilShortage": number | null,
    "reason": "why"
  },
  "cashRunwayDays": number | null,
  "actions": ["bullet 1", "bullet 2", "bullet 3?"],
  "insights": ["short observation 1", "short observation 2"]
}

Business snapshot:
Summary: ${JSON.stringify(summary)}
Recent transactions (most recent first, max 50):
${JSON.stringify(recentTransactions)}
`.trim();

  // Fetch available models, fallback to common ones if API call fails
  let allModels = await fetchAvailableModels();
  if (allModels.length === 0) {
    console.log('[CashWise] Could not fetch available models, using fallback list');
    allModels = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro',
      'gemini-1.5-pro-002',
      'gemini-1.5-flash-002',
    ];
  } else {
    console.log(`[CashWise] Found ${allModels.length} available models`);
  }

  // Prioritize models that are likely to work:
  // 1. Gemma models (smaller, more likely to have free tier access)
  // 2. Skip TTS models (need AUDIO, not TEXT)
  // 3. Skip image-generation models
  // 4. Skip preview/experimental models that might have quota issues
  const gemmaModels = allModels.filter(m => m.startsWith('gemma-'));
  const textModels = allModels.filter(m => 
    !m.includes('tts') && 
    !m.includes('image') && 
    !m.includes('preview') &&
    !m.includes('exp') &&
    !m.startsWith('gemma-') // Already in gemmaModels
  );
  
  // Combine: Last working model first (if exists), then Gemma, then text models
  let modelsToTry = [];
  if (lastWorkingModel && allModels.includes(lastWorkingModel)) {
    modelsToTry.push(lastWorkingModel);
    console.log(`[CashWise] Prioritizing last working model: ${lastWorkingModel}`);
  }
  
  // Add Gemma models (they worked!), then text models
  const remainingGemma = gemmaModels.filter(m => m !== lastWorkingModel);
  const remainingText = textModels.filter(m => m !== lastWorkingModel);
  modelsToTry.push(...remainingGemma, ...remainingText);
  
  if (modelsToTry.length === 0) {
    // Fallback to all models if filtering removed everything
    modelsToTry = allModels;
  }
  
  console.log(`[CashWise] Trying ${modelsToTry.length} prioritized models`);

  let lastError = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[CashWise] Trying model: ${modelName}`);
      const model = gemini.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = parseGeminiJson(text);

      console.log(`[CashWise] Success with model: ${modelName}`);
      // Cache the working model for next time
      lastWorkingModel = modelName;
      return res.json({
        horizonDays,
        summary,
        analysis: parsed,
        raw: text,
        modelUsed: modelName,
      });
    } catch (err) {
      console.log(`[CashWise] Model ${modelName} failed:`, err.message);
      lastError = err;
      // Continue to next model
    }
  }

  // All models failed
  console.error('Gemini analysis error: All models failed', lastError);
  const errorMessage = lastError?.message || 'Unknown error';
  res.status(500).json({ 
    error: 'Failed to generate analysis - no available models',
    details: `Tried models: ${modelsToTry.join(', ')}. Last error: ${errorMessage}`,
    suggestion: 'Visit /api/models to see available models for your API key, or check your API key permissions'
  });
});

// Serve React build if available, otherwise serve HTML version
// This must be AFTER all API routes
const reactBuildPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(reactBuildPath) && fs.existsSync(path.join(reactBuildPath, 'index.html'))) {
  console.log('[CashWise] Serving React build');
  app.use(express.static(reactBuildPath));
  // Fallback to index.html for React Router (must be last, excludes API routes)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(reactBuildPath, 'index.html'));
  });
} else {
  console.log('[CashWise] Serving HTML version');
  app.use(express.static(publicPath));
}

app.listen(PORT, () => {
  console.log(`CashWise server listening on http://localhost:${PORT}`);
});

