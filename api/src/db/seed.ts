import { db } from '.'
import { webhooks } from './schema'
import { faker } from '@faker-js/faker'

// Stripe event types comuns
const stripeEventTypes = [
	'payment_intent.succeeded',
	'payment_intent.created',
	'payment_intent.payment_failed',
	'charge.succeeded',
	'charge.failed',
	'charge.refunded',
	'customer.created',
	'customer.updated',
	'customer.deleted',
	'invoice.created',
	'invoice.paid',
	'invoice.payment_failed',
	'subscription.created',
	'subscription.updated',
	'subscription.deleted',
	'checkout.session.completed',
	'checkout.session.expired',
	'payment_method.attached',
	'payment_method.detached',
]

function generateStripeWebhook() {
	const eventType = faker.helpers.arrayElement(stripeEventTypes)
	const amount = faker.number.int({ min: 500, max: 50000 })
	const currency = faker.helpers.arrayElement(['usd', 'eur', 'brl', 'gbp'])

	// Gera corpo do webhook baseado no tipo de evento
	const body: Record<string, any> = {
		id: `evt_${faker.string.alphanumeric(24)}`,
		object: 'event',
		api_version: '2023-10-16',
		created: faker.date.recent({ days: 30 }).getTime() / 1000,
		type: eventType,
		livemode: faker.datatype.boolean(),
		pending_webhooks: faker.number.int({ min: 0, max: 3 }),
		request: {
			id: `req_${faker.string.alphanumeric(14)}`,
			idempotency_key: faker.string.uuid(),
		},
		data: {
			object: {},
		},
	}

	// Customiza o objeto de dados baseado no tipo de evento
	if (eventType.startsWith('payment_intent')) {
		body.data.object = {
			id: `pi_${faker.string.alphanumeric(24)}`,
			object: 'payment_intent',
			amount,
			currency,
			customer: `cus_${faker.string.alphanumeric(14)}`,
			description: faker.company.catchPhrase(),
			status: eventType.includes('succeeded')
				? 'succeeded'
				: eventType.includes('failed')
					? 'failed'
					: 'requires_payment_method',
		}
	} else if (eventType.startsWith('charge')) {
		body.data.object = {
			id: `ch_${faker.string.alphanumeric(24)}`,
			object: 'charge',
			amount,
			currency,
			customer: `cus_${faker.string.alphanumeric(14)}`,
			description: faker.company.catchPhrase(),
			paid: eventType.includes('succeeded'),
			refunded: eventType.includes('refunded'),
		}
	} else if (eventType.startsWith('customer')) {
		body.data.object = {
			id: `cus_${faker.string.alphanumeric(14)}`,
			object: 'customer',
			email: faker.internet.email(),
			name: faker.person.fullName(),
			phone: faker.phone.number(),
			created: faker.date.past().getTime() / 1000,
		}
	} else if (eventType.startsWith('invoice')) {
		body.data.object = {
			id: `in_${faker.string.alphanumeric(24)}`,
			object: 'invoice',
			amount_due: amount,
			amount_paid: eventType.includes('paid') ? amount : 0,
			currency,
			customer: `cus_${faker.string.alphanumeric(14)}`,
			status: eventType.includes('paid')
				? 'paid'
				: eventType.includes('failed')
					? 'open'
					: 'draft',
		}
	} else if (eventType.startsWith('subscription')) {
		body.data.object = {
			id: `sub_${faker.string.alphanumeric(14)}`,
			object: 'subscription',
			customer: `cus_${faker.string.alphanumeric(14)}`,
			status: eventType.includes('deleted')
				? 'canceled'
				: faker.helpers.arrayElement(['active', 'trialing', 'past_due']),
			current_period_start: faker.date.recent().getTime() / 1000,
			current_period_end: faker.date.future().getTime() / 1000,
		}
	} else if (eventType.startsWith('checkout.session')) {
		body.data.object = {
			id: `cs_${faker.string.alphanumeric(24)}`,
			object: 'checkout.session',
			amount_total: amount,
			currency,
			customer: `cus_${faker.string.alphanumeric(14)}`,
			payment_status: eventType.includes('completed') ? 'paid' : 'unpaid',
			status: eventType.includes('completed') ? 'complete' : 'expired',
		}
	} else if (eventType.startsWith('payment_method')) {
		body.data.object = {
			id: `pm_${faker.string.alphanumeric(24)}`,
			object: 'payment_method',
			customer: `cus_${faker.string.alphanumeric(14)}`,
			type: faker.helpers.arrayElement(['card', 'sepa_debit', 'us_bank_account']),
			card: {
				brand: faker.helpers.arrayElement(['visa', 'mastercard', 'amex']),
				last4: faker.finance.creditCardNumber().slice(-4),
				exp_month: faker.number.int({ min: 1, max: 12 }),
				exp_year: faker.number.int({ min: 2024, max: 2030 }),
			},
		}
	}

	return {
		method: 'POST',
		pathname: '/stripe',
		ip: faker.internet.ipv4(),
		contentType: 'application/json',
		contentLength: JSON.stringify(body).length,
		headers: {
			'content-type': 'application/json',
			'user-agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
			'stripe-signature': `t=${Date.now()},v1=${faker.string.alphanumeric(64)}`,
			accept: '*/*',
			'accept-encoding': 'gzip, deflate',
			host: faker.internet.domainName(),
		},
		body: JSON.stringify(body, null, 2),
	}
}

async function seed() {
	console.log('🌱 Starting seed...')

	// Gera 65 webhooks aleatórios do Stripe
	const webhookData = Array.from({ length: 65 }, () =>
		generateStripeWebhook(),
	)

	await db.insert(webhooks).values(webhookData)

	console.log(`✅ Seeded ${webhookData.length} webhooks successfully!`)
	process.exit(0)
}

seed().catch((error) => {
	console.error('❌ Seed failed:', error)
	process.exit(1)
})