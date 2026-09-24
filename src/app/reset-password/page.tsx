import { Suspense } from 'react';
import EmailTokenForm from '@/components/EmailTokenForm';
export default function ResetPassword() { return <Suspense><EmailTokenForm purpose="reset" /></Suspense>; }
