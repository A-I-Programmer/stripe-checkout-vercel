const Stripe = require("stripe");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { priceId, price_cents, productName, quantity = 1 } = req.body;

    let line_items;

    if (priceId) {
      // Fixed price (using Stripe Price ID)
      line_items = [{ price: priceId, quantity }];
    } else if (price_cents && productName) {
      // Custom product & price
      line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName },
            unit_amount: price_cents,
          },
          quantity,
        },
      ];
    } else {
      return res.status(400).json({ error: "Missing price information" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel.html`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    res.status(500).json({ error: err.message });
  }
};
