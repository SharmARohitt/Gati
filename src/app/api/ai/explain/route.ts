/**
 * GATI ML Explainability API Route
 * Fetches SHAP explanations from Python ML API
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelType, entityId, predictionValue, humanReadable = true } = body;
    
    if (!modelType) {
      return NextResponse.json({
        success: false,
        error: 'modelType is required (anomaly, risk, or forecast)'
      }, { status: 400 });
    }
    
    // Fetch SHAP explanation from Python ML API
    const response = await fetch(`${ML_API_URL}/api/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_type: modelType,
        entity_id: entityId,
        prediction_value: predictionValue
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ML API error: ${response.status} - ${errorText}`);
    }
    
    const explanation = await response.json();
    
    // If human-readable explanation is requested, use Gemini
    if (humanReadable && process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'models/gemini-1.0-pro' });
        
        const prompt = `Convert this technical ML model explanation into simple, clear language for a government official. 
Be specific about what each factor means and its impact.

Technical Explanation:
${JSON.stringify(explanation, null, 2)}

Provide a 3-4 sentence explanation that:
1. Summarizes what the prediction means
2. Lists the top 3 factors that influenced this prediction
3. Explains why these factors matter
4. Suggests one action if applicable`;

        const result = await model.generateContent(prompt);
        const humanText = result.response.text();
        
        return NextResponse.json({
          success: true,
          technical: explanation,
          humanReadable: humanText,
          modelType,
          entityId,
          timestamp: new Date().toISOString()
        });
        
      } catch (geminiError) {
        console.error('[Explain API] Gemini error:', geminiError);
        // Fall through to return just technical explanation
      }
    }
    
    return NextResponse.json({
      success: true,
      technical: explanation,
      humanReadable: null,
      modelType,
      entityId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Explain API] Error:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        error: 'ML API is offline. Please start the Python ML server.',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/explain',
    description: 'Get human-readable explanations for ML predictions',
    usage: {
      method: 'POST',
      body: {
        modelType: 'anomaly | risk | forecast',
        entityId: 'State or region identifier (optional)',
        predictionValue: 'The prediction value to explain (optional)',
        humanReadable: 'true | false (default: true)'
      }
    },
    timestamp: new Date().toISOString()
  });
}
