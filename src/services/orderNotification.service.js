import { User } from '../models/User.js'

function redactPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length < 4) return digits
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`
}

function isResendConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
}

function isTwilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  )
}

function inr(n) {
  return Number(n || 0).toLocaleString('en-IN')
}

function normalizeIndianPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length === 10) return `+91${digits}`
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`
  return digits.startsWith('+') ? digits : `+${digits}`
}

function buildOrderSummary(order, user) {
  const line = Array.isArray(order?.lineItems) ? order.lineItems[0] : null
  const title = line?.title || 'Pre-Owned Device'
  const itemCount = Array.isArray(order?.lineItems) ? order.lineItems.length : 0
  const itemText = itemCount > 1 ? `${title} +${itemCount - 1} more` : title
  const name = String(user?.name || 'Customer').trim() || 'Customer'
  return {
    name,
    itemText,
    orderNumber: String(order?.orderNumber || ''),
    totalInr: Number(order?.totalInr || 0),
  }
}

async function sendEmailViaResend(to, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject: `Order ${payload.orderNumber} confirmed`,
      html: `<p>Hi ${payload.name},</p>
<p>Your order <strong>${payload.orderNumber}</strong> is confirmed.</p>
<p>Item: ${payload.itemText}<br/>Amount paid: ₹${inr(payload.totalInr)}</p>
<p>Thank you for shopping with Baskaro.</p>`,
      text: `Hi ${payload.name}, your order ${payload.orderNumber} is confirmed. Item: ${payload.itemText}. Amount paid: ₹${inr(payload.totalInr)}.`,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Resend failed (${res.status}): ${body || res.statusText}`)
  }
}

async function sendSmsViaTwilio(to, payload) {
  const body = new URLSearchParams({
    To: to,
    From: process.env.TWILIO_FROM_NUMBER,
    Body: `Baskaro: Order ${payload.orderNumber} confirmed. ${payload.itemText}. Paid ₹${inr(payload.totalInr)}.`,
  })

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const auth = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64')
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
  )

  if (!res.ok) {
    const err = await res.text().catch(() => '')
    throw new Error(`Twilio failed (${res.status}): ${err || res.statusText}`)
  }
}

export async function sendBuyOrderConfirmation({ order }) {
  const result = {
    attemptedAt: new Date(),
    email: { status: 'SKIPPED', to: '', error: '' },
    sms: { status: 'SKIPPED', to: '', error: '' },
  }

  if (!order?.userId) {
    console.warn('[Notifications] Skipped confirmation: missing order.userId')
    result.email.error = 'missing userId'
    result.sms.error = 'missing userId'
    return result
  }

  const user = await User.findById(order.userId).lean()
  if (!user) {
    console.warn('[Notifications] Skipped confirmation: user not found')
    result.email.error = 'user not found'
    result.sms.error = 'user not found'
    return result
  }

  const payload = buildOrderSummary(order, user)
  const email = String(user.email || '').trim().toLowerCase()
  const phone = normalizeIndianPhone(user.phone)
  result.email.to = email
  result.sms.to = phone ? redactPhone(phone) : ''

  if (email && isResendConfigured()) {
    try {
      await sendEmailViaResend(email, payload)
      result.email.status = 'SENT'
      console.log(`[Notifications] Email sent for ${payload.orderNumber} to ${email}`)
    } catch (err) {
      result.email.status = 'FAILED'
      result.email.error = String(err?.message || err)
      console.error(`[Notifications] Email failed for ${payload.orderNumber}:`, err?.message || err)
    }
  } else if (!email) {
    result.email.error = 'missing email'
  } else {
    result.email.error = 'provider not configured'
  }

  if (phone && isTwilioConfigured()) {
    try {
      await sendSmsViaTwilio(phone, payload)
      result.sms.status = 'SENT'
      console.log(`[Notifications] SMS sent for ${payload.orderNumber} to ${redactPhone(phone)}`)
    } catch (err) {
      result.sms.status = 'FAILED'
      result.sms.error = String(err?.message || err)
      console.error(`[Notifications] SMS failed for ${payload.orderNumber}:`, err?.message || err)
    }
  } else if (!phone) {
    result.sms.error = 'missing phone'
  } else {
    result.sms.error = 'provider not configured'
  }

  if (
    result.email.status === 'SKIPPED' &&
    result.sms.status === 'SKIPPED' &&
    result.email.error === 'provider not configured' &&
    result.sms.error === 'provider not configured'
  ) {
    console.log(
      `[Notifications] No provider configured. Confirmation queued in logs for ${payload.orderNumber} (email: ${
        email || 'none'
      }, phone: ${phone ? redactPhone(phone) : 'none'})`,
    )
  }

  return result
}
