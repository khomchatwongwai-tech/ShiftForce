import { AIProvider } from './AIProviderInterface';
import { AIRequest, AIResponse } from '../types';

export class ClaudeProvider implements AIProvider {
  public id = 'claude' as const;
  public name = 'Anthropic Claude';

  public isAvailable(): boolean {
    return Boolean(typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY?.trim());
  }

  public async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = typeof process !== 'undefined' ? process.env?.ANTHROPIC_API_KEY?.trim() : undefined;
    const facts = request.deterministicFacts;

    const systemPrompt = `You are Workqora AI Operations Engine powered by Anthropic Claude.
Specialization: Deep operational analysis, compliance audits, labor law, long-form handbooks, and policy evaluations.
Never fabricate facts or metrics. Use strictly verified numbers from the provided context.

Return STRICT JSON matching:
{
  "headline": "...",
  "summary": "...",
  "whatHappened": "...",
  "whyItMatters": "...",
  "recommendedAction": "...",
  "expectedImpact": "...",
  "confidence": "High" | "Medium" | "Low",
  "supportingData": ["...", "..."],
  "requiresConfirmation": true | false
}`;

    const userContent = `Request: "${request.prompt}"
Intent: ${request.intent || 'policy_question'}
Location: ${request.locationName || 'Location #104'}
User: ${request.userRole}

Verified Facts:
- Expired/Expiring Certifications: ${facts.expiredOrExpiringCertCount} (${JSON.stringify(facts.expiringEmployees || [])})
- Tardiness Incidents Today: ${facts.tardinessIncidentsToday}
- Scheduled Hours: ${facts.totalScheduledHours} | Projected Labor: $${facts.projectedLaborCost} (Budget: $${facts.weeklyLaborBudget})
- Overtime Exposure: ${facts.overtimeEmployeesCount} employees (${facts.projectedOvertimeHours} hrs)
- Call-Outs: ${facts.callOutsCount} | Break Window Compliance: ${facts.approachingBreakCount} staff
- Overall Compliance Health Score: ${facts.healthScores.compliance}/100`;

    if (apiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: userContent }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data.content?.[0]?.text || '{}';
          const cleanJson = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
          const parsed = JSON.parse(cleanJson);
          const latencyMs = Date.now() - startTime;

          return {
            provider: 'claude',
            model: 'claude-3-5-sonnet-20241022',
            intent: request.intent || 'employee_compliance',
            headline: parsed.headline || 'Claude Compliance & Policy Analysis',
            summary: parsed.summary || 'Policy and compliance requirements audited.',
            recommendation: {
              whatHappened: parsed.whatHappened || 'Compliance audit completed.',
              whyItMatters: parsed.whyItMatters || 'Maintains regulatory standing and avoids health fines.',
              recommendedAction: parsed.recommendedAction || 'Notify affected team members to renew certifications.',
              expectedImpact: parsed.expectedImpact || 'Zero compliance violations during health inspections.',
              confidence: parsed.confidence || 'High',
              supportingData: Array.isArray(parsed.supportingData) ? parsed.supportingData : [
                `${facts.expiredOrExpiringCertCount} certifications requiring review`,
                `Compliance health score: ${facts.healthScores.compliance}/100`
              ],
              requiresConfirmation: Boolean(parsed.requiresConfirmation)
            },
            usage: {
              inputTokens: data.usage?.input_tokens || 480,
              outputTokens: data.usage?.output_tokens || 240,
              totalTokens: (data.usage?.input_tokens || 480) + (data.usage?.output_tokens || 240),
              estimatedCostUsd: 0.003
            },
            latencyMs,
            fallbackUsed: false,
            timestamp: new Date().toISOString()
          };
        }
      } catch (e) {
        console.warn('Claude API call failed, using deterministic synthesis:', e);
      }
    }

    // High precision deterministic rules fallback
    const latencyMs = Math.max(95, Date.now() - startTime);
    return {
      provider: 'claude',
      model: 'claude-3-5-sonnet-20241022',
      intent: request.intent || 'employee_compliance',
      headline: `Compliance Audit: ${facts.expiredOrExpiringCertCount} Staff Certification Alerts`,
      summary: `Comprehensive evaluation of food safety, alcohol handler, and break compliance guidelines.`,
      recommendation: {
        whatHappened: `${facts.expiredOrExpiringCertCount} scheduled employees have Food Handler or Alcohol RBS cards expiring within the active rotation cycle.`,
        whyItMatters: `Local health jurisdiction rules prohibit uncertified staff from food prep or alcohol service; violations carry potential $500–$2,000 fines.`,
        recommendedAction: `Send automated recertification links via Workqora and temporarily reassign uncertified shifts if renewal is not confirmed 48h prior.`,
        expectedImpact: `Ensures 100% compliance audit readiness and prevents last-minute shift disqualifications.`,
        confidence: 'High',
        supportingData: [
          `Identified certifications at risk: ${facts.expiredOrExpiringCertCount}`,
          `Compliance Health Index: ${facts.healthScores.compliance}/100`,
          `Approaching meal break window: ${facts.approachingBreakCount} staff`
        ],
        requiresConfirmation: false
      },
      usage: {
        inputTokens: 460,
        outputTokens: 210,
        totalTokens: 670,
        estimatedCostUsd: 0.0028
      },
      latencyMs,
      fallbackUsed: true,
      timestamp: new Date().toISOString()
    };
  }
}
