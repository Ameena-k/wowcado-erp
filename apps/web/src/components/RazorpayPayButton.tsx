'use client';
import { Button } from '@/components/ui/Button';
import { CreditCard, Loader2 } from 'lucide-react';
import { useState } from 'react';
import apiClient from '@/lib/api-client';

export function RazorpayPayButton({ invoice, onPaymentComplete }: { invoice: any, onPaymentComplete?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Ensure Razorpay SDK is loaded
      if (!(window as any).Razorpay) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      // 2. Create Order context on the ERP Backend
      const res = await apiClient.post('/razorpay/orders', {
        amountInr: Number(invoice.grandTotal),
        receipt: `receipt_${invoice.invoiceNumber}`,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
      });
      const order = res.data;

      if (!order.keyId) {
         alert('Razorpay Keys are missing from the backend configuration.');
         return;
      }

      // 3. Mount Razorpay Checkout
      const options = {
        key: order.keyId, // Key injected securely from API
        amount: order.amount,
        currency: order.currency,
        name: "Wowcado ERP",
        description: `Payment for ${invoice.invoiceNumber}`,
        order_id: order.id,
        handler: function (response: any) {
             // Let the backend Webhook securely process it, then trigger a frontend refresh
             if (onPaymentComplete) {
                setTimeout(() => onPaymentComplete(), 3000); 
             }
        },
        prefill: {
          name: invoice.customer?.name || '',
          contact: invoice.customer?.phone || '',
          email: invoice.customer?.email || ''
        },
        theme: {
          color: "#4f46e5" // Indigo theme to match ERP
        }
      };

      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any) {
         alert('Payment failed or cancelled.');
         console.error(response.error.description);
      });
      rzp1.open();
      
    } catch (err: any) {
      console.error(err);
      alert('Failed to initialize Payment Gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
       onClick={handlePayment} 
       disabled={loading}
       className="w-full bg-[#3399cc] hover:bg-[#2181b0] shadow-md h-11 text-white text-sm font-semibold tracking-wide"
    >
       {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
       PAY SECURELY WITH RAZORPAY
    </Button>
  );
}
