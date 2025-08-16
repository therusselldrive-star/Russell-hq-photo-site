 const functions = require("firebase-functions");
    const cors = require("cors")({ origin: true });
    
    // IMPORTANT: Make sure you have set your Stripe secret key in your Firebase environment
    // by running the command in your terminal:
    // firebase functions:config:set stripe.secret="sk_..."
    const stripe = require("stripe")(functions.config().stripe.secret);
    
    exports.createStripeCheckout = functions.https.onRequest((req, res) => {
      // Use CORS to allow your website to call this function.
      cors(req, res, async () => {
        if (req.method !== "POST") {
          return res.status(405).send("Method Not Allowed");
        }
    
        try {
          const { items } = req.body;
    
          if (!items || items.length === 0) {
            console.error("Checkout attempt with no items.");
            return res.status(400).json({ error: "No items in cart." });
          }
    
          const line_items = items.map((item) => ({
            price_data: {
              currency: "usd",
              product_data: {
                name: item.title,
                description: item.description,
                images: [item.src],
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
          }));
    
          // Get the origin URL from the request to build success/cancel URLs
          const origin = req.headers.origin;
    
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: line_items,
            success_url: `${origin}/`,
            cancel_url: `${origin}/`,
          });
    
          res.status(200).json({ id: session.id });
    
        } catch (error) {
          console.error("Stripe error:", error);
          res.status(500).json({ error: "Internal Server Error" });
        }
      });
    });
    