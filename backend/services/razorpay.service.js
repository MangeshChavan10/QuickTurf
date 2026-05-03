import Razorpay from "razorpay";

let razorpay = null;

export const getRazorpay = () => {
  if (!razorpay) {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.warn(
        "Razorpay keys are missing. Payment API will operate in simulation mode."
      );
      return null;
    }

    razorpay = new Razorpay({ key_id, key_secret });
  }
  return razorpay;
};
