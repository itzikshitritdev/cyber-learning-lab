import type { Metadata } from 'next';
import LessonPage from './lesson-page';

export const metadata: Metadata = {
  title: 'Bits, Bytes & Binary',
  description:
    'Learn how bits and bytes represent information, then practice converting binary to decimal and back.',
};

export default function BitsBytesBinaryPage() {
  return <LessonPage />;
}
