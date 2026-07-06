import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-06-24.dahlia',
});

async function fixPrices() {
  try {
    // Archive the old CAD prices
    console.log('Archiving old CAD prices...');
    await stripe.prices.update('price_1TqLqd2M3H2GKw9TbiVod6Qs', { active: false });
    await stripe.prices.update('price_1TqLs22M3H2GKw9TBFKCRoao', { active: false });
    console.log('✅ Old prices archived');

    // Create new USD prices
    console.log('Creating new USD prices...');
    
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

    console.log('\nNew price IDs:');
    console.log('STRIPE_SILVER_PRICE_ID=' + silverPrice.id);
    console.log('STRIPE_GOLD_PRICE_ID=' + goldPrice.id);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixPrices();
