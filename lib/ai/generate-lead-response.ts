'use server'

import { createClient } from '@/lib/supabase/server'

type LeadContext = {
    leadId: string
    leadName: string
    leadPhone?: string | null
    leadEmail?: string | null
    serviceInterested?: string | null
    estimatedValue?: number | null
    leadSource?: string | null
    leadStatus?: string
    leadScore?: 'hot' | 'warm' | 'cold'
    previousInteractions?: Array<{
        type: string
        content: string
        created_at: string
    }>
    notes?: string | null
}

type MessageOptions = {
    tone: 'human' | 'premium' | 'direct'
    channel: 'sms' | 'email'
    intent: 'initial' | 'followup' | 'incentive' | 'questions' | 'booking'
}

export async function generateAILeadResponse(
    context: LeadContext,
    options: MessageOptions
): Promise<string[]> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Get business info
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: business } = await supabase
        .from('businesses')
        .select('name, phone')
        .eq('owner_id', user.id)
        .single()

    if (!business) throw new Error('Business not found')

    // Build prompt based on intent and context
    const toneDescriptions = {
        human: 'conversational, warm, friendly - like texting a friend',
        premium: 'professional, sophisticated, high-end - luxury service tone',
        direct: 'concise, straightforward, no-nonsense - get to the point'
    }

    const intentDescriptions = {
        initial: 'First contact - acknowledge their inquiry and provide value',
        followup: 'Follow up on previous contact - check in naturally',
        incentive: 'Offer a special deal or discount to encourage booking',
        questions: 'Ask qualifying questions to understand their needs better',
        booking: 'Direct them to book with urgency and clear CTA'
    }

    const channelLimits = {
        sms: '160 characters ideal, 300 max',
        email: 'can be longer but still concise'
    }

    const prompt = `You are ${business.name}, an auto detailing business. Generate ${options.channel} message suggestions for this lead.

LEAD INFO:
- Name: ${context.leadName}
${context.serviceInterested ? `- Interested in: ${context.serviceInterested}` : ''}
${context.estimatedValue ? `- Estimated Value: $${context.estimatedValue}` : ''}
${context.leadScore ? `- Lead Temperature: ${context.leadScore}` : ''}
${context.leadStatus ? `- Status: ${context.leadStatus}` : ''}
${context.leadSource ? `- Source: ${context.leadSource}` : ''}
${context.notes ? `- Notes: ${context.notes}` : ''}

${context.previousInteractions && context.previousInteractions.length > 0 ? `
PREVIOUS INTERACTIONS:
${context.previousInteractions.slice(0, 3).map((int, i) => `
${i + 1}. ${int.type} (${new Date(int.created_at).toLocaleDateString()}): "${int.content}"
`).join('')}
` : 'No previous interactions - this will be first contact'}

BUSINESS INFO:
- Name: ${business.name}
${business.phone ? `- Phone: ${business.phone}` : ''}

MESSAGE REQUIREMENTS:
- Intent: ${options.intent} - ${intentDescriptions[options.intent]}
- Tone: ${options.tone} - ${toneDescriptions[options.tone]}
- Channel: ${options.channel} - ${channelLimits[options.channel]}

GUIDELINES:
1. Sound human, not robotic
2. ${options.channel === 'sms' ? 'Keep it SHORT - under 160 chars if possible' : 'Be concise but complete'}
3. Reference their specific service interest
4. ${options.intent === 'initial' ? 'Acknowledge what they\'re looking for' : ''}
5. ${options.intent === 'followup' ? 'Don\'t be pushy, be helpful' : ''}
6. ${options.intent === 'incentive' ? 'Make the offer clear and time-limited' : ''}
7. ${options.intent === 'questions' ? 'Ask 2-3 qualifying questions max' : ''}
8. ${options.intent === 'booking' ? 'Create urgency without being desperate' : ''}
9. Always include a clear call-to-action
10. ${options.channel === 'sms' ? 'Use minimal emojis (0-1)' : 'Professional formatting'}
11. ${context.previousInteractions && context.previousInteractions.length > 0 ? 'Don\'t repeat what was already said' : ''}
12. End with a question or clear next step

Generate 3 DIFFERENT message variations. Each should feel unique but achieve the same goal.

Return ONLY a JSON array of 3 strings, no markdown, no explanation:
["message 1", "message 2", "message 3"]`

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        })

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`)
        }

        const data = await response.json()
        const responseText = data.content[0].text.trim()

        // Parse JSON response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
            throw new Error('Could not parse AI response')
        }

        const suggestions = JSON.parse(jsonMatch[0])

        // Validate and clean suggestions
        return suggestions.map((msg: string) => {
            let cleaned = msg.trim()

            // Remove any quotes at start/end
            cleaned = cleaned.replace(/^["']|["']$/g, '')

            // Enforce SMS length limit
            if (options.channel === 'sms' && cleaned.length > 300) {
                cleaned = cleaned.substring(0, 297) + '...'
            }

            return cleaned
        })

    } catch (error) {
        console.error('AI generation error:', error)

        // Fallback suggestions
        return generateFallbackSuggestions(context, options)
    }
}

function generateFallbackSuggestions(
    context: LeadContext,
    options: MessageOptions
): string[] {
    const { leadName, serviceInterested, estimatedValue } = context
    const service = serviceInterested || 'service'

    if (options.intent === 'initial') {
        return [
            `Hi ${leadName}! Thanks for your interest in ${service}. ${estimatedValue ? `That runs $${estimatedValue}.` : ''} When works best for you?`,
            `Hey ${leadName}, I got your request for ${service}! ${estimatedValue ? `It's $${estimatedValue} and ` : ''}I have openings this week. Interested?`,
            `${leadName} - ${service} ${estimatedValue ? `is $${estimatedValue}, ` : ''}takes about 2-3 hours. Can I schedule you in?`
        ]
    }

    if (options.intent === 'followup') {
        return [
            `Hey ${leadName}, following up on ${service}. Still interested? I have some availability!`,
            `Hi ${leadName}! Just checking in about ${service}. Let me know if you'd like to book!`,
            `${leadName}, wanted to circle back on ${service}. Ready to schedule?`
        ]
    }

    if (options.intent === 'incentive') {
        return [
            `${leadName}, special offer: 10% off ${service} if you book this week! Interested?`,
            `Hey ${leadName}! I can do ${service} for ${estimatedValue ? `$${Math.round(estimatedValue * 0.9)}` : '10% off'} if you book by Friday. Sound good?`,
            `${leadName} - limited time: ${service} ${estimatedValue ? `down to $${Math.round(estimatedValue * 0.9)}` : 'at 10% off'}. Book today?`
        ]
    }

    if (options.intent === 'questions') {
        return [
            `Hi ${leadName}! Quick questions: 1) What's your preferred date? 2) Any specific areas you want me to focus on?`,
            `Hey ${leadName}, to prepare for ${service}: 1) When's best for you? 2) What's your vehicle's condition?`,
            `${leadName}, before we schedule: 1) What day works? 2) Any problem areas I should know about?`
        ]
    }

    if (options.intent === 'booking') {
        return [
            `${leadName}, ready to book ${service}? I have Tuesday 2pm or Thursday 10am open. Which works?`,
            `Hey ${leadName}! Let's lock in ${service}. Reply with your preferred date/time!`,
            `${leadName} - spots filling up fast for ${service}. Can I get you scheduled this week?`
        ]
    }

    return [
        `Hi ${leadName}! How can I help with ${service}?`,
        `Hey ${leadName}, following up on your inquiry. Still interested?`,
        `${leadName}, let me know if you have any questions!`
    ]
}

// Helper to load full lead context
export async function getLeadContext(leadId: string): Promise<LeadContext> {
    const supabase = await createClient()

    const { data: lead } = await supabase
        .from('leads')
        .select(`
      *,
      interactions:lead_interactions(
        id,
        type,
        content,
        created_at
      )
    `)
        .eq('id', leadId)
        .single()

    if (!lead) throw new Error('Lead not found')

    return {
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        leadEmail: lead.email,
        serviceInterested: lead.interested_in_service_name,
        estimatedValue: lead.estimated_value,
        leadSource: lead.source,
        leadStatus: lead.status,
        leadScore: lead.score,
        previousInteractions: lead.interactions?.slice(0, 5) || [],
        notes: lead.notes
    }
}
