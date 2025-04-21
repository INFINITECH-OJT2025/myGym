// app/membership/payment/page.js
import { Suspense } from 'react';
import PaymentForm from './payment'; // the client file

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading payment details…</div>}>
      <PaymentForm />
    </Suspense>
  );
}
