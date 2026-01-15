import { Resend } from 'resend'
import type { SMSProviderConfig } from '@/lib/sms/providers'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

type BookingEmailData = {
  business: {
    name: string
    email: string
    phone?: string | null
  }
  service: {
    name: string
    price?: number
    duration_minutes?: number
  }
  customer: {
    name: string
    email: string
    phone?: string | null
  }
  scheduledDate: string
  scheduledTime: string
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  assetDetails?: Record<string, any> | null
  notes?: string | null
}

export async function sendBookingConfirmation(booking: BookingEmailData) {
  // If no API key, log and return (for dev/mock mode)
  if (!resend) {
    console.log('RESEND_API_KEY not set. Skipping email sending.')
    console.log('Would send to customer:', booking.customer.email)
    console.log('Would send to business:', booking.business.email)
    return
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'bookings@resend.dev'

  // Format date and time
  const appointmentDate = new Date(booking.scheduledDate)
  const formattedDate = appointmentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })

  // Format address
  const fullAddress = booking.address 
    ? `${booking.address}${booking.city ? `, ${booking.city}` : ''}${booking.state ? `, ${booking.state}` : ''}${booking.zip ? ` ${booking.zip}` : ''}`
    : null

  // Format asset details
  let assetDetailsHtml = ''
  if (booking.assetDetails && Object.keys(booking.assetDetails).length > 0) {
    const assetEntries = Object.entries(booking.assetDetails)
      .filter(([key, value]) => value && value !== '')
      .map(([key, value]) => {
        // Format key (e.g., "asset_year" -> "Year")
        const formattedKey = key
          .replace(/^asset_/, '')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase())
        return `<li style="margin-bottom: 8px;"><strong>${formattedKey}:</strong> ${value}</li>`
      })
    if (assetEntries.length > 0) {
      assetDetailsHtml = `
        <h3 style="margin-top: 20px; margin-bottom: 10px;">Vehicle/Asset Details</h3>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${assetEntries.join('')}
        </ul>
      `
    }
  }

  // Format duration
  const durationText = booking.service.duration_minutes
    ? booking.service.duration_minutes >= 60
      ? `${Math.floor(booking.service.duration_minutes / 60)} ${Math.floor(booking.service.duration_minutes / 60) === 1 ? 'hour' : 'hours'}${booking.service.duration_minutes % 60 > 0 ? ` ${booking.service.duration_minutes % 60} minutes` : ''}`
      : `${booking.service.duration_minutes} minutes`
    : null

  try {
    // Email to customer
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: booking.customer.email,
      subject: `Booking Confirmed - ${booking.business.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #18181b; margin-bottom: 10px;">Booking Confirmed! ✅</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Hi ${booking.customer.name.split(' ')[0]}, your appointment has been successfully scheduled with ${booking.business.name}.
          </p>
          
          <div style="background-color: #f4f4f5; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h2 style="margin-top: 0; margin-bottom: 20px; color: #18181b; font-size: 20px;">Appointment Details</h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Service:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${booking.service.name}</span>
              </li>
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Date:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${formattedDate}</span>
              </li>
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Time:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${formattedTime}</span>
              </li>
              ${booking.service.price ? `
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Price:</strong> 
                <span style="color: #52525b; margin-left: 8px;">$${booking.service.price.toFixed(2)}</span>
              </li>
              ` : ''}
              ${durationText ? `
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Estimated Duration:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${durationText}</span>
              </li>
              ` : ''}
            </ul>
            ${fullAddress ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
              <h3 style="margin-top: 0; margin-bottom: 10px; color: #18181b; font-size: 16px;">Service Location</h3>
              <p style="color: #52525b; margin: 0; font-size: 15px;">${fullAddress}</p>
            </div>
            ` : ''}
            ${assetDetailsHtml}
            ${booking.notes ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
              <h3 style="margin-top: 0; margin-bottom: 10px; color: #18181b; font-size: 16px;">Notes</h3>
              <p style="color: #52525b; margin: 0; font-size: 15px; white-space: pre-wrap;">${booking.notes}</p>
            </div>
            ` : ''}
          </div>

          <div style="background-color: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; margin-bottom: 10px; color: #18181b; font-size: 16px;">Business Contact</h3>
            <p style="color: #52525b; margin: 5px 0; font-size: 15px;"><strong>${booking.business.name}</strong></p>
            ${booking.business.phone ? `
            <p style="color: #52525b; margin: 5px 0; font-size: 15px;">Phone: <a href="tel:${booking.business.phone}" style="color: #3b82f6; text-decoration: none;">${booking.business.phone}</a></p>
            ` : ''}
            <p style="color: #52525b; margin: 5px 0; font-size: 15px;">Email: <a href="mailto:${booking.business.email}" style="color: #3b82f6; text-decoration: none;">${booking.business.email}</a></p>
          </div>

          <p style="color: #71717a; font-size: 14px; margin-top: 30px; line-height: 1.6;">
            If you need to make any changes to your appointment, please contact ${booking.business.name} directly.
          </p>
        </div>
      `
    })

    // Email to business (detailer)
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: booking.business.email,
      subject: `New Booking - ${booking.customer.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #18181b; margin-bottom: 10px;">New Booking Received! 🎉</h1>
          
          <div style="background-color: #f4f4f5; padding: 24px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h2 style="margin-top: 0; margin-bottom: 20px; color: #18181b; font-size: 20px;">Customer Details</h2>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Name:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${booking.customer.name}</span>
              </li>
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Email:</strong> 
                <span style="color: #52525b; margin-left: 8px;"><a href="mailto:${booking.customer.email}" style="color: #3b82f6; text-decoration: none;">${booking.customer.email}</a></span>
              </li>
              ${booking.customer.phone ? `
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Phone:</strong> 
                <span style="color: #52525b; margin-left: 8px;"><a href="tel:${booking.customer.phone}" style="color: #3b82f6; text-decoration: none;">${booking.customer.phone}</a></span>
              </li>
              ` : '<li style="margin-bottom: 12px; font-size: 15px;"><strong style="color: #18181b;">Phone:</strong> <span style="color: #52525b; margin-left: 8px;">N/A</span></li>'}
            </ul>

            <h3 style="margin-top: 20px; margin-bottom: 10px; color: #18181b; font-size: 16px;">Service Details</h3>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Service:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${booking.service.name}</span>
              </li>
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Date:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${formattedDate}</span>
              </li>
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Time:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${formattedTime}</span>
              </li>
              ${booking.service.price ? `
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Price:</strong> 
                <span style="color: #52525b; margin-left: 8px;">$${booking.service.price.toFixed(2)}</span>
              </li>
              ` : ''}
              ${durationText ? `
              <li style="margin-bottom: 12px; font-size: 15px;">
                <strong style="color: #18181b;">Estimated Duration:</strong> 
                <span style="color: #52525b; margin-left: 8px;">${durationText}</span>
              </li>
              ` : ''}
            </ul>
            ${fullAddress ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
              <h3 style="margin-top: 0; margin-bottom: 10px; color: #18181b; font-size: 16px;">Service Location</h3>
              <p style="color: #52525b; margin: 0; font-size: 15px;">${fullAddress}</p>
            </div>
            ` : ''}
            ${assetDetailsHtml}
            ${booking.notes ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
              <h3 style="margin-top: 0; margin-bottom: 10px; color: #18181b; font-size: 16px;">Customer Notes</h3>
              <p style="color: #52525b; margin: 0; font-size: 15px; white-space: pre-wrap;">${booking.notes}</p>
            </div>
            ` : ''}
          </div>
        </div>
      `
    })

    console.log('Booking emails sent successfully')
  } catch (error) {
    console.error('Error sending booking emails:', error)
    // Don't throw error to avoid failing the booking process
  }
}

/**
 * Send SMS booking confirmation to customer
 * Note: SMS consent is checked in the booking form, so we assume consent is given
 */
export async function sendBookingConfirmationSMS(booking: BookingEmailData, smsConsent?: boolean) {
  // Check if customer has phone number
  if (!booking.customer.phone) {
    console.log('Customer does not have a phone number. Skipping SMS.')
    return
  }

  // Validate phone number doesn't contain masking characters
  if (booking.customer.phone.includes('X') || booking.customer.phone.includes('x') || booking.customer.phone.includes('*')) {
    console.log('Customer phone number appears to be masked. Skipping SMS.')
    return
  }

  // Check SMS consent if explicitly provided (booking form requires consent, so this is usually true)
  if (smsConsent === false) {
    console.log('Customer has not consented to SMS. Skipping SMS.')
    return
  }

  try {
    // Dynamically import to avoid errors if SMS is not configured
    const { getBusiness } = await import('@/lib/actions/business')
    const { sendSMS } = await import('@/lib/sms/providers')

    const business = await getBusiness()
    if (!business) {
      console.log('Business not found. Skipping SMS.')
      return
    }

    // Determine SMS provider
    let smsProvider: 'surge' | 'twilio' | null = null
    
    if (business.sms_provider === 'surge' || business.sms_provider === 'twilio') {
      smsProvider = business.sms_provider as 'surge' | 'twilio'
    } else {
      // Fallback: check which credentials are available
      if (business.surge_api_key && business.surge_account_id) {
        smsProvider = 'surge'
      } else if (business.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID) {
        smsProvider = 'twilio'
      }
    }

    if (!smsProvider) {
      console.log('No SMS provider configured. Skipping SMS confirmation.')
      return
    }

    // Build provider config
    const config: SMSProviderConfig = {
      provider: smsProvider,
    }

    if (smsProvider === 'surge') {
      config.surgeApiKey = business.surge_api_key || undefined
      config.surgeAccountId = business.surge_account_id || undefined
      
      if (!config.surgeApiKey || !config.surgeAccountId) {
        console.log('Surge credentials not configured. Skipping SMS.')
        return
      }
    } else if (smsProvider === 'twilio') {
      config.twilioAccountSid = business.twilio_account_sid || process.env.TWILIO_ACCOUNT_SID || undefined
      config.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || undefined
      config.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || undefined
      
      if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioPhoneNumber) {
        console.log('Twilio credentials not configured. Skipping SMS.')
        return
      }
    }

    // Format date and time for SMS
    const date = new Date(booking.scheduledDate)
    const formattedDate = date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })

    // Create SMS message (keep it short and friendly)
    const senderName = business.sender_name || business.name || 'BRNNO'
    const message = `Hi ${booking.customer.name.split(' ')[0]}! Your booking with ${senderName} is confirmed for ${formattedDate} at ${booking.scheduledTime}. Service: ${booking.service.name}. Reply STOP to opt out.`

    // Send SMS
    const result = await sendSMS(config, {
      to: booking.customer.phone,
      body: message,
      fromName: senderName,
      contactFirstName: booking.customer.name.split(' ')[0] || undefined,
      contactLastName: booking.customer.name.split(' ').slice(1).join(' ') || undefined,
    })

    if (result.success) {
      console.log('Booking confirmation SMS sent successfully to:', booking.customer.phone)
    } else {
      console.error('Failed to send booking confirmation SMS:', result.error)
    }
  } catch (error) {
    console.error('Error sending booking confirmation SMS:', error)
    // Don't throw error to avoid failing the booking process
  }
}

export async function sendSignupRecoveryEmail(
  email: string,
  name?: string,
  step?: number
) {
  // If no API key, log and return (for dev/mock mode)
  if (!resend) {
    console.log('RESEND_API_KEY not set. Skipping email sending.')
    console.log('Would send recovery email to:', email)
    return
  }

  const stepMessages: Record<number, string> = {
    1: 'You started signing up for BRNNO but didn\'t finish. Complete your account setup in just 2 minutes!',
    2: 'You\'re almost there! Just a few more details to get your business set up and start booking customers.',
    3: 'Don\'t miss out! Complete your business setup and start booking customers today.',
    4: 'You\'re one step away! Select your plan and start your free trial.',
    5: 'You\'re so close! Complete your subscription and start using BRNNO today.',
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@brnno.com'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : 'https://app.brnno.com'

  try {
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: email,
      subject: 'Complete your BRNNO signup',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #18181b; margin-bottom: 20px;">Hey${name ? ` ${name}` : ''}!</h1>
          <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            ${stepMessages[step || 1] || 'You started signing up for BRNNO but didn\'t finish.'}
          </p>
          
          <div style="margin: 30px 0;">
            <a href="${appUrl}/signup?email=${encodeURIComponent(email)}" 
               style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
              Complete Signup →
            </a>
          </div>

          <p style="color: #71717a; font-size: 14px; margin-top: 40px; line-height: 1.6;">
            Questions? Reply to this email or visit our <a href="${appUrl}/contact" style="color: #18181b; text-decoration: underline;">help center</a>.
          </p>
          
          <p style="color: #a1a1aa; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
            This email was sent because you started signing up for BRNNO. If you didn't start a signup, you can safely ignore this email.
          </p>
        </div>
      `
    })

    console.log('Signup recovery email sent successfully to:', email)
  } catch (error) {
    console.error('Error sending signup recovery email:', error)
    // Don't throw error to avoid failing the recovery process
  }
}
