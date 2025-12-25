import { Resend } from 'resend'

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
  }
  customer: {
    name: string
    email: string
    phone?: string | null
  }
  scheduledDate: string
  scheduledTime: string
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

  try {
    // Email to customer
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: booking.customer.email,
      subject: `Booking Confirmed - ${booking.business.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Booking Confirmed!</h1>
          <p>Your appointment has been successfully scheduled.</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Appointment Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Service:</strong> ${booking.service.name}</li>
              <li style="margin-bottom: 10px;"><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</li>
              <li style="margin-bottom: 10px;"><strong>Time:</strong> ${booking.scheduledTime}</li>
            </ul>
          </div>

          <p><strong>Business Contact:</strong><br>
          ${booking.business.name}<br>
          ${booking.business.phone || booking.business.email}</p>
        </div>
      `
    })

    // Email to business (detailer)
    await resend.emails.send({
      from: `BRNNO <${fromEmail}>`,
      to: booking.business.email,
      subject: `New Booking - ${booking.customer.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>New Booking Received!</h1>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Name:</strong> ${booking.customer.name}</li>
              <li style="margin-bottom: 10px;"><strong>Email:</strong> ${booking.customer.email}</li>
              <li style="margin-bottom: 10px;"><strong>Phone:</strong> ${booking.customer.phone || 'N/A'}</li>
            </ul>

            <h3 style="margin-top: 20px;">Service Details</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Service:</strong> ${booking.service.name}</li>
              <li style="margin-bottom: 10px;"><strong>Date:</strong> ${new Date(booking.scheduledDate).toLocaleDateString()}</li>
              <li style="margin-bottom: 10px;"><strong>Time:</strong> ${booking.scheduledTime}</li>
            </ul>
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
