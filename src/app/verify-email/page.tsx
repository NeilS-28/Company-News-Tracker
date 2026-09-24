import { Suspense } from 'react';
import EmailTokenForm from '@/components/EmailTokenForm';
export default function VerifyEmail() { return <Suspense><EmailTokenForm purpose="verify" /></Suspense>; }
