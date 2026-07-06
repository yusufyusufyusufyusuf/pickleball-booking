import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-24.dahlia',
});

async function createMemberships() {
  try {
    console.log('Creating Silver Membership product...');
    const silverProduct = await stripe.products.create({
      name: 'Silver Membership',
      type: 'service',
    });
    console.log('✅ Silver product created:', silverProduct.id);

    console.log('Creating Silver price...');
    const silverPrice = await stripe.prices.create({
      product: silverProduct.id,
      unit_amount: 5000, // $50.00 USD
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Silver price created:', silverPrice.id);

    console.log('\nCreating Gold Membership product...');
    const goldProduct = await stripe.products.create({
      name: 'Gold Membership',
      type: 'service',
    });
    console.log('✅ Gold product created:', goldProduct.id);

    console.log('Creating Gold price...');
    const goldPrice = await stripe.prices.create({
      product: goldProduct.id,
      unit_amount: 10000, // $100.00 USD
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Gold price created:', goldPrice.id);

    console.log('\n=== ADD THESE TO YOUR ENVIRONMENT ===');
    console.log('STRIPE_SILVER_PRICE_ID=' + silverPrice.id);
    console.log('STRIPE_GOLD_PRICE_ID=' + goldPrice.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createMemberships();
