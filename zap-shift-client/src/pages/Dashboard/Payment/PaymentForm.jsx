import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosSecure from "../../../hooks/useAxiosSecure";

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const axiosSecure = useAxiosSecure();
  const { id } = useParams();

  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [usdAmount, setUsdAmount] = useState(0);

  /**
   * Fetch parcel information by route id
   */
  const {
    data: parcelInfo = {},
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["parcel", id],
    enabled: !!id,
    queryFn: async () => {
      const res = await axiosSecure.get(`/parcels/${id}`);
      return res.data;
    },
  });

  /**
   * Create Stripe payment intent once parcel data is available
   * and the parcel is not already paid.
   */
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        if (!parcelInfo?._id) return;
        if (parcelInfo?.paymentStatus === "paid") return;

        const res = await axiosSecure.post("/create-payment-intent", {
          parcelId: parcelInfo._id,
        });

        if (res.data?.clientSecret) {
          setClientSecret(res.data.clientSecret);
          setUsdAmount(Number(res.data.usdAmount || 0));
        }
      } catch (err) {
        setError(
          err?.response?.data?.message || "Failed to initialize payment"
        );
      }
    };

    createPaymentIntent();
  }, [parcelInfo?._id, parcelInfo?.paymentStatus, axiosSecure]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center mt-32">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const amountTaka = Number(parcelInfo?.cost || parcelInfo?.price || 0);

  /**
   * Submit Stripe payment
   */
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    if (!clientSecret) {
      setError("Payment is not ready yet. Please wait a second.");
      return;
    }

    const card = elements.getElement(CardElement);
    if (!card) return;

    setProcessing(true);
    setError("");

    try {
      // Step 1: Create Stripe payment method
      const { error: paymentMethodError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card,
          billing_details: {
            name: parcelInfo?.userName || "Anonymous User",
            email: parcelInfo?.userEmail || "unknown@example.com",
          },
        });

      if (paymentMethodError) {
        setError(paymentMethodError.message);
        setProcessing(false);
        return;
      }

      // Step 2: Confirm payment using client secret
      const { paymentIntent, error: confirmError } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentMethod.id,
        });

      if (confirmError) {
        setError(confirmError.message);
        setProcessing(false);
        return;
      }

      // Step 3: Save payment to database if successful
      if (paymentIntent?.status === "succeeded") {
        setTransactionId(paymentIntent.id);

        const paymentData = {
          parcelId: parcelInfo._id,
          transactionId: paymentIntent.id,
          amountTaka,
          amountUsd: usdAmount,
          email: parcelInfo?.userEmail,
          paymentMethodId: paymentMethod?.id,
          paymentMethod: `${paymentMethod?.card?.brand || "card"} ending in ${
            paymentMethod?.card?.last4 || "****"
          }`,
          paymentIntentId: paymentIntent?.id,
          status: paymentIntent?.status,
        };

        await axiosSecure.post("/payments", paymentData);
        await refetch();
      }
    } catch (err) {
      setError(err?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-xl rounded-xl p-6 border mt-20">
      <h2 className="text-2xl font-semibold text-center mb-2">
        Parcel Payment
      </h2>

      {/* <p className="text-center text-gray-500 mb-4">
        Complete your parcel delivery payment
      </p> */}

      {/* Parcel payment summary */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 text-center">
        <p className="text-sm text-gray-500">Parcel ID</p>
        <p className="font-semibold break-all">{parcelInfo?._id}</p>

        <p className="mt-2 text-sm text-gray-500">Delivery Cost</p>
        <p className="text-xl font-bold text-green-600">৳ {amountTaka}</p>

        <p className="mt-2 text-sm text-gray-500">Converted USD</p>
        <p className="text-lg font-bold text-blue-600">
          $ {Number(usdAmount || 0).toFixed(2)}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Conversion rate: 1 USD = 120 Tk
        </p>

        <p className="mt-2 text-sm text-gray-500">Payment Status</p>
        <p
          className={`font-semibold ${
            parcelInfo?.paymentStatus === "paid"
              ? "text-green-600"
              : "text-orange-500"
          }`}
        >
          {parcelInfo?.paymentStatus || "unpaid"}
        </p>

        {(transactionId || parcelInfo?.transactionId) && (
          <>
            <p className="mt-2 text-sm text-gray-500">Transaction ID</p>
            <p className="text-xs text-blue-600 break-all">
              {transactionId || parcelInfo?.transactionId}
            </p>
          </>
        )}
      </div>

      {parcelInfo?.paymentStatus === "paid" ? (
        <div className="text-center bg-green-50 border border-green-200 p-4 rounded-lg">
          <p className="text-green-700 font-semibold">
            This parcel is already paid.
          </p>

          {parcelInfo?.transactionId && (
            <p className="text-xs mt-2 break-all text-gray-600">
              Transaction: {parcelInfo.transactionId}
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border rounded-lg p-4 bg-gray-50">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: "16px",
                    color: "#374151",
                    "::placeholder": {
                      color: "#9CA3AF",
                    },
                  },
                  invalid: {
                    color: "#EF4444",
                  },
                },
              }}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!stripe || !clientSecret || processing}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition disabled:opacity-50"
          >
            {processing
              ? "Processing Payment..."
              : `Pay $ ${Number(usdAmount || 0).toFixed(2)}`}
          </button>
        </form>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        Secure payment powered by Stripe
      </p>
    </div>
  );
};

export default PaymentForm;