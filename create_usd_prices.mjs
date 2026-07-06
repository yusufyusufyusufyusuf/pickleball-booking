import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-24.dahlia',
});

async function createPrices() {
  try {
    console.log('Creating USD prices...');
    
    const silverPrice = await stripe.prices.create({
      product: 'prod_Uq1uklwq1UYn4w',
      unit_amount: 5000, // $50.00 USD
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Silver price created:', silverPrice.id);

    const goldPrice = await stripe.prices.create({
      product: 'prod_Uq1veakNFSKSja',
      unit_amount: 10000, // $100.00 USD
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✅ Gold price created:', goldPrice.id);

    console.log('\n=== UPDATE THESE IN YOUR SECRETS ===');
    console.log('STRIPE_SILVER_PRICE_ID=' + silverPrice.id);
    console.log('STRIPE_GOLD_PRICE_ID=' + goldPrice.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createPrices();
