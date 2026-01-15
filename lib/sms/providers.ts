/**
 * SMS Provider Abstraction Layer
 * Supports multiple SMS providers (Surge, Twilio, etc.)
 */

export type SMSProvider = 'surge' | 'twilio'

export interface SMSProviderConfig {
  provider: SMSProvider
  // Surge config
  surgeApiKey?: string
  surgeAccountId?: string
  // Note: Surge SDK uses account's default phone number, no need for surgePhoneNumber
  // Twilio config
  twilioAccountSid?: string
  twilioAuthToken?: string
  twilioPhoneNumber?: string
}

export interface SendSMSOptions {
  to: string
  body: string
  fromName?: string
  contactFirstName?: string
  contactLastName?: string
}

export interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send SMS using the configured provider
 */
export async function sendSMS(
  config: SMSProviderConfig,
  options: SendSMSOptions
): Promise<SMSResult> {
  console.log('[sendSMS] Routing to provider:', config.provider)
  
  switch (config.provider) {
    case 'surge':
      console.log('[sendSMS] Calling sendViaSurge')
      return sendViaSurge(config, options)
    case 'twilio':
      console.log('[sendSMS] Calling sendViaTwilio')
      return sendViaTwilio(config, options)
    default:
      console.error('[sendSMS] Unsupported provider:', config.provider)
      throw new Error(`Unsupported SMS provider: ${config.provider}`)
  }
}

/**
 * Send SMS via Surge using the @surgeapi/node SDK
 */
async function sendViaSurge(
  config: SMSProviderConfig,
  options: SendSMSOptions
): Promise<SMSResult> {
  if (!config.surgeApiKey || !config.surgeAccountId) {
    return {
      success: false,
      error: 'Surge API key or account ID not configured',
    }
  }

  try {
    // Dynamically import Surge SDK to avoid errors if not installed
    let SurgeClass
    try {
      const SurgeModule = await import('@surgeapi/node')
      // Try different export patterns: SurgeClient (named), Surge (default), or default
      SurgeClass = SurgeModule.SurgeClient || SurgeModule.Surge || SurgeModule.default?.SurgeClient || SurgeModule.default
      
      if (!SurgeClass) {
        console.error('Surge SDK exports:', Object.keys(SurgeModule))
        return {
          success: false,
          error: 'Surge SDK import failed. Please check @surgeapi/node installation.',
        }
      }
    } catch (importError) {
      console.error('Error importing Surge SDK:', importError)
      return {
        success: false,
        error: 'Surge SDK not installed. Please run: npm install @surgeapi/node',
      }
    }

    // Parse phone number (ensure it has + prefix and is E.164 format)
    let phoneNumber = options.to
    if (!phoneNumber.startsWith('+')) {
      const digits = phoneNumber.replace(/\D/g, '')
      phoneNumber = `+${digits}`
    }

    // Create Surge client - try both 'apiKey' and 'token' patterns
    let client
    try {
      // Try with apiKey first (as shown in user's example)
      client = new SurgeClass({
        apiKey: config.surgeApiKey,
      })
    } catch (e1) {
      try {
        // Fallback to token
        client = new SurgeClass({
          token: config.surgeApiKey,
        })
      } catch (e2) {
        return {
          success: false,
          error: `Failed to create Surge client: ${e1 instanceof Error ? e1.message : 'Unknown error'}`,
        }
      }
    }

    console.log('[sendViaSurge] Sending message:', {
      accountId: config.surgeAccountId,
      phoneNumber,
      hasApiKey: !!config.surgeApiKey,
      apiKeyPrefix: config.surgeApiKey?.substring(0, 10) + '...',
    })

    // Send message using Surge SDK
    const message = await client.messages.create(config.surgeAccountId, {
      body: options.body,
      conversation: {
        contact: {
          first_name: options.contactFirstName || '',
          last_name: options.contactLastName || '',
          phone_number: phoneNumber,
        },
      },
    })

    return {
      success: true,
      messageId: message.id || message.message_id || message.sid,
    }
  } catch (error) {
    console.error('Error sending SMS via Surge:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(
  config: SMSProviderConfig,
  options: SendSMSOptions
): Promise<SMSResult> {
  if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
    return {
      success: false,
      error: 'Twilio credentials not configured',
    }
  }

  try {
    // Dynamically import Twilio to avoid errors if not installed
    let twilio
    try {
      twilio = await import('twilio')
    } catch (importError) {
      return {
        success: false,
        error: 'Twilio SDK not installed. Please run: npm install twilio',
      }
    }
    
    const client = twilio.default(config.twilioAccountSid, config.twilioAuthToken)

    // Normalize phone numbers to E.164 format (ensure + prefix)
    // First, check for masking characters BEFORE normalization
    if (config.twilioPhoneNumber && (config.twilioPhoneNumber.includes('X') || config.twilioPhoneNumber.includes('x') || config.twilioPhoneNumber.includes('*'))) {
      return {
        success: false,
        error: `Invalid Twilio phone number in environment variable: ${config.twilioPhoneNumber}. The phone number appears to be masked or incomplete. Please provide a complete phone number in E.164 format.`,
      }
    }

    if (options.to && (options.to.includes('X') || options.to.includes('x') || options.to.includes('*'))) {
      return {
        success: false,
        error: `Invalid phone number format: ${options.to}. The phone number appears to be masked or incomplete. Please provide a complete phone number in E.164 format (e.g., +15551234567).`,
      }
    }

    let fromNumber = config.twilioPhoneNumber
    if (!fromNumber.startsWith('+')) {
      // Remove all non-digit characters (except +), then add +
      const digits = fromNumber.replace(/[^\d+]/g, '').replace(/\+/g, '')
      fromNumber = `+${digits}`
    } else {
      // Already has +, just remove non-digits after the +
      const digits = fromNumber.replace(/[^\d+]/g, '').replace(/\+/g, '')
      fromNumber = `+${digits}`
    }

    let toNumber = options.to
    if (!toNumber.startsWith('+')) {
      // Remove all non-digit characters (except +), then add +
      const digits = toNumber.replace(/[^\d+]/g, '').replace(/\+/g, '')
      toNumber = `+${digits}`
    } else {
      // Already has +, just remove non-digits after the +
      const digits = toNumber.replace(/[^\d+]/g, '').replace(/\+/g, '')
      toNumber = `+${digits}`
    }

    // Validate phone numbers are complete (at least 10 digits after country code)
    const fromDigits = fromNumber.replace(/\D/g, '')
    const toDigits = toNumber.replace(/\D/g, '')
    
    if (toDigits.length < 10) {
      return {
        success: false,
        error: `Invalid phone number format: ${options.to} (normalized: ${toNumber}). Phone number must have at least 10 digits. Please provide a complete phone number in E.164 format (e.g., +15551234567).`,
      }
    }

    if (fromDigits.length < 10) {
      return {
        success: false,
        error: `Invalid Twilio phone number in environment variable: ${config.twilioPhoneNumber} (normalized: ${fromNumber}). Phone number must have at least 10 digits. Please provide a complete phone number in E.164 format.`,
      }
    }

    const result = await client.messages.create({
      body: options.body,
      from: fromNumber,
      to: toNumber,
    })

    return {
      success: true,
      messageId: result.sid,
    }
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
