'use server'

type MessageContext = {
    leadName: string
    leadMessage?: string
    serviceInterested?: string
    vehicleInfo?: string
    quoteAmount?: number
    businessName: string
    businessTone?: 'friendly' | 'premium' | 'direct'
    messageType: 'initial' | 'followup_1' | 'followup_2' | 'final'
    previousMessages?: string[]
}

export async function generateAIMessage(context: MessageContext): Promise<string> {
    const {
        leadName,
        leadMessage,
        serviceInterested,
        vehicleInfo,
        quoteAmount,
        businessName,
        businessTone = 'friendly',
        messageType,
        previousMessages = []
    } = context

    // Build context for AI
    const toneGuidelines = {
        friendly: 'conversational, warm, helpful',
        premium: 'professional, sophisticated, high-end',
        direct: 'concise, straightforward, no-nonsense'
    }

    const messageTypeContext = {
        initial: 'This is the first automated response to the lead. Acknowledge their inquiry and provide helpful information.',
        followup_1: 'This is the first follow-up (2-3 days after initial contact). Gently check in and offer availability.',
        followup_2: 'This is the second follow-up (5-7 days after initial contact). More direct, emphasize value and limited availability.',
        final: 'This is the final follow-up (10-14 days after initial contact). Last chance, create urgency without being pushy.'
    }

    const prompt = `You are writing an SMS message for ${businessName}, an auto detailing business.

LEAD INFORMATION:
- Name: ${leadName}
${leadMessage ? `- Original inquiry: "${leadMessage}"` : ''}
${serviceInterested ? `- Interested in: ${serviceInterested}` : ''}
${vehicleInfo ? `- Vehicle: ${vehicleInfo}` : ''}
${quoteAmount ? `- Quote provided: $${quoteAmount}` : ''}

MESSAGE CONTEXT:
- Type: ${messageType}
- ${messageTypeContext[messageType]}
${previousMessages.length > 0 ? `- Previous messages sent:\n${previousMessages.map((m, i) => `  ${i + 1}. "${m}"`).join('\n')}` : ''}

TONE: ${toneGuidelines[businessTone]}

REQUIREMENTS:
1. Write an SMS message (160 characters or less preferred, 300 max)
2. Be ${toneGuidelines[businessTone]}
3. Personalize based on their specific inquiry
4. ${messageType === 'initial' ? 'Answer their question or acknowledge their request' : 'Follow up naturally without being pushy'}
5. ${messageType !== 'initial' ? 'Reference their original inquiry to show you remember' : ''}
6. Include a call-to-action (reply, book, or specific question)
7. Sound human, not robotic
8. Do NOT use emojis excessively (max 1-2 if appropriate)
9. Do NOT be overly salesy or desperate
10. Do NOT repeat information from previous messages

Return ONLY the SMS message text, nothing else.`

    try {
        // Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 500,
                }
            })
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Gemini API error:', errorData)
            throw new Error('AI API request failed')
        }

        const data = await response.json()
        const generatedMessage = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

        if (!generatedMessage) {
            throw new Error('No message generated from AI')
        }

        // Clean up any quotes or formatting
        return generatedMessage.replace(/^["']|["']$/g, '')
    } catch (error) {
        console.error('Error generating AI message:', error)
        // Fallback to template if AI fails
        return generateFallbackMessage(context)
    }
}

function generateFallbackMessage(context: MessageContext): string {
    const { leadName, serviceInterested, messageType } = context

    const fallbacks = {
        initial: `Hi ${leadName}! Thanks for reaching out about ${serviceInterested || 'our services'}. I'd love to help! When works best for you?`,
        followup_1: `Hey ${leadName}, just following up on ${serviceInterested || 'your inquiry'}. Still interested? I have some openings this week!`,
        followup_2: `Hi ${leadName}! Wanted to check in about ${serviceInterested || 'booking your service'}. Let me know if you'd like to schedule!`,
        final: `${leadName}, last chance to book ${serviceInterested || 'your detail'} at the quoted price. I have limited availability. Interested?`
    }

    return fallbacks[messageType]
}
