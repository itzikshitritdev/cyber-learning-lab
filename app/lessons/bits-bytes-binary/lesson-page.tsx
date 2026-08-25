'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1] as const;
const EXAMPLE_BITS = [0, 0, 1, 0, 1, 0, 1, 0] as const;
const CHALLENGE_BITS = [0, 0, 0, 1, 0, 1, 0, 1] as const;
const INITIAL_BITS = [0, 0, 1, 0, 1, 0, 1, 0];

type Feedback = 'correct' | 'wrong' | null;

function SectionNumber({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-400/10 font-mono text-sm font-bold text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.12)]">
      {children}
    </span>
  );
}

function BitSwitch({ bit, weight, index, onToggle }: { bit: number; weight: number; index: number; onToggle: () => void }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2">
      <span className="font-mono text-[10px] font-medium text-slate-500 sm:text-xs">{weight}</span>
      <button
        type="button"
        aria-label={`Bit with value ${weight}: ${bit}. Toggle to ${bit ? 0 : 1}`}
        aria-pressed={bit === 1}
        onClick={onToggle}
        className={`grid aspect-square w-full max-w-14 place-items-center rounded-xl border font-mono text-xl font-bold transition duration-200 sm:text-2xl ${
          bit
            ? 'border-cyan-300/70 bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-[0_0_22px_rgba(16,185,255,0.38)]'
            : 'border-slate-600/70 bg-slate-950/55 text-slate-500 hover:border-cyan-300/45 hover:text-slate-300'
        }`}
      >
        {bit}
      </button>
      <span className="font-mono text-[10px] text-slate-600">b{7 - index}</span>
    </div>
  );
}

function StaticBits({ bits, activeColor = 'cyan', compact = false }: { bits: readonly number[]; activeColor?: 'cyan' | 'purple'; compact?: boolean }) {
  const activeClass = activeColor === 'purple'
    ? 'border-violet-400/55 bg-violet-400/15 text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.16)]'
    : 'border-cyan-300/55 bg-cyan-400/15 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.16)]';

  return (
    <div className="grid grid-cols-8 gap-1.5 sm:gap-2" aria-label={bits.join('')}>
      {bits.map((bit, index) => (
        <span key={index} className={`grid aspect-square place-items-center rounded-lg border font-mono font-semibold ${compact ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} ${bit ? activeClass : 'border-slate-700/70 bg-slate-950/45 text-slate-500'}`}>
          {bit}
        </span>
      ))}
    </div>
  );
}

function FeedbackMessage({ state, correctMessage }: { state: Feedback; correctMessage: string }) {
  if (!state) return null;
  const correct = state === 'correct';
  return (
    <p role="status" className={`mt-3 rounded-xl border px-4 py-3 text-sm ${correct ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
      <span className="mr-2" aria-hidden="true">{correct ? '✓' : '↗'}</span>
      {correct ? correctMessage : 'Not quite. Look at the active bit values and try again.'}
    </p>
  );
}

export default function LessonPage() {
  const [bits, setBits] = useState(INITIAL_BITS);
  const [decimalAnswer, setDecimalAnswer] = useState('');
  const [binaryAnswer, setBinaryAnswer] = useState('');
  const [decimalFeedback, setDecimalFeedback] = useState<Feedback>(null);
  const [binaryFeedback, setBinaryFeedback] = useState<Feedback>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCompleted(localStorage.getItem('lesson:bits-bytes-binary') === 'complete');
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const decimalValue = useMemo(
    () => bits.reduce((total, bit, index) => total + bit * WEIGHTS[index], 0),
    [bits],
  );
  const binaryValue = bits.join('');
  const hexValue = decimalValue.toString(16).toUpperCase().padStart(2, '0');

  function toggleBit(index: number) {
    setBits((current) => current.map((bit, bitIndex) => bitIndex === index ? (bit ? 0 : 1) : bit));
  }

  function checkDecimal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDecimalFeedback(Number(decimalAnswer) === 21 ? 'correct' : 'wrong');
  }

  function checkBinary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBinaryFeedback(binaryAnswer.trim() === '00101010' ? 'correct' : 'wrong');
  }

  function completeLesson() {
    localStorage.setItem('lesson:bits-bytes-binary', 'complete');
    setCompleted(true);
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden pb-8 text-slate-100">
      <div className="cyber-grid pointer-events-none absolute inset-0 -z-20" />
      <div className="pointer-events-none absolute left-1/2 top-52 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />

      <header className="border-b border-cyan-100/10 bg-[#050b17]/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <a href="#top" className="group flex items-center gap-3" aria-label="Cyber Learning Lab lesson top">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_22px_rgba(34,211,238,0.16)]">
              <span className="font-mono text-sm font-bold text-cyan-300">01</span>
            </span>
            <span>
              <span className="block text-[11px] font-semibold tracking-[0.18em] text-cyan-300/80">CYBER</span>
              <span className="block text-sm font-semibold tracking-wide text-white sm:text-base">LEARNING LAB</span>
            </span>
          </a>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Lesson 01</p>
            <p className="mt-1 text-xs text-slate-400 sm:text-sm">Digital Foundations</p>
          </div>
        </div>
      </header>

      <div id="top" className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <section className="grid min-h-[430px] items-center gap-10 py-16 md:grid-cols-[1.08fr_0.92fr] md:py-20 lg:min-h-[500px]">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
              Start with the smallest unit
            </p>
            <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl lg:text-6xl">
              How Computers See{' '}
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-violet-400 bg-clip-text text-transparent">Information</span>
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Before networks, hacking, malware, and cryptography, everything begins with <span className="font-medium text-cyan-300">bits</span>.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
              <span>~10 min</span><span className="text-slate-700" aria-hidden="true">•</span><span>Beginner friendly</span><span className="text-slate-700" aria-hidden="true">•</span><span>2 challenges</span>
            </div>
          </div>

          <div className="relative mx-auto h-72 w-full max-w-md" aria-label="Animated binary zero and one visual">
            <div className="hero-ring absolute inset-x-10 bottom-8 h-20 rounded-[50%] border border-cyan-300/40 shadow-[0_0_40px_rgba(34,211,238,0.18)]" />
            <div className="absolute inset-x-16 bottom-14 h-12 rounded-[50%] bg-cyan-400/10 blur-lg" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="flex items-center gap-4 font-mono text-7xl font-bold sm:gap-6 sm:text-8xl">
                <span className="text-glow text-cyan-300">0</span><span className="text-3xl text-blue-300/65" aria-hidden="true">↔</span><span className="text-glow text-blue-400">1</span>
              </div>
            </div>
            <span className="bit-float absolute left-4 top-12 grid h-12 w-12 place-items-center rounded-xl border border-cyan-300/35 bg-cyan-400/10 font-mono text-lg text-cyan-200 backdrop-blur">1</span>
            <span className="bit-float-delayed absolute right-7 top-5 grid h-10 w-10 place-items-center rounded-lg border border-blue-400/35 bg-blue-400/10 font-mono text-blue-200 backdrop-blur">0</span>
            <span className="bit-float-delayed absolute bottom-10 right-2 grid h-12 w-12 place-items-center rounded-xl border border-violet-400/35 bg-violet-400/10 font-mono text-violet-200 backdrop-blur">1</span>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden="true">
              {[1, 0, 1, 1, 0, 0, 1, 0].map((bit, index) => <span key={index} className={`h-2.5 w-2.5 rounded-sm ${bit ? 'bg-cyan-300/70' : 'bg-slate-700'}`} />)}
            </div>
          </div>
        </section>

        <div className="space-y-5">
          <section aria-labelledby="bit-title" className="glass-card rounded-3xl p-5 sm:p-7 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3"><SectionNumber>1</SectionNumber><h2 id="bit-title" className="text-2xl font-semibold tracking-tight text-white">What is a Bit?</h2></div>
                <p className="mt-5 max-w-xl leading-7 text-slate-300">A <span className="font-semibold text-cyan-300">bit</span> is the smallest unit of digital information. It can contain one of two values: <span className="font-mono text-white">0</span> or <span className="font-mono text-white">1</span>.</p>
                <p className="mt-3 text-sm text-slate-500">Toggle the switches to create any 8-bit value.</p>
              </div>
              <div className="rounded-2xl border border-cyan-100/10 bg-slate-950/35 p-4 sm:p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bit weight</p>
                <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                  {bits.map((bit, index) => <BitSwitch key={index} bit={bit} weight={WEIGHTS[index]} index={index} onToggle={() => toggleBit(index)} />)}
                </div>
                <div className="soft-divider mt-5 grid grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-3">
                  <div><p className="text-xs text-slate-500">Binary</p><output className="mt-1 block font-mono text-lg font-semibold tracking-wider text-cyan-300">{binaryValue}</output></div>
                  <div className="sm:border-l sm:border-cyan-100/10 sm:pl-5"><p className="text-xs text-slate-500">Decimal value</p><output className="mt-1 block font-mono text-lg font-semibold text-white">{decimalValue}</output></div>
                  <div className="sm:border-l sm:border-cyan-100/10 sm:pl-5"><p className="text-xs text-slate-500">Hex value</p><output className="mt-1 block font-mono text-lg font-semibold text-violet-300">0x{hexValue}</output></div>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="byte-title" className="glass-card rounded-3xl p-5 sm:p-7 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
              <div>
                <div className="flex items-center gap-3"><SectionNumber>2</SectionNumber><h2 id="byte-title" className="text-2xl font-semibold tracking-tight text-white">What is a Byte?</h2></div>
                <p className="mt-5 text-lg text-slate-300"><span className="font-mono font-semibold text-cyan-300">8 bits</span> = 1 byte.</p>
                <p className="mt-2 leading-7 text-slate-400">A byte can represent 256 possible values, from zero through 255.</p>
              </div>
              <div>
                <StaticBits bits={[1, 0, 1, 0, 1, 0, 1, 0]} />
                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-cyan-100/10 bg-slate-950/35 p-4"><dt className="text-xs uppercase tracking-[0.12em] text-slate-500">Minimum value</dt><dd className="mt-2 font-mono text-sm text-slate-200 sm:text-base">00000000 = 0 = <span className="text-violet-300">0x00</span></dd></div>
                  <div className="rounded-xl border border-cyan-100/10 bg-slate-950/35 p-4"><dt className="text-xs uppercase tracking-[0.12em] text-slate-500">Maximum value</dt><dd className="mt-2 font-mono text-sm text-slate-200 sm:text-base">11111111 = 255 = <span className="text-violet-300">0xFF</span></dd></div>
                </dl>
              </div>
            </div>
          </section>

          <section aria-labelledby="conversion-title" className="glass-card rounded-3xl p-5 sm:p-7 lg:p-8">
            <div className="flex items-center gap-3"><SectionNumber>3</SectionNumber><div><h2 id="conversion-title" className="text-2xl font-semibold tracking-tight text-white">Binary → Decimal</h2><p className="mt-1 text-sm text-slate-500">Each position has a fixed weight.</p></div></div>
            <div className="mt-7 grid gap-7 lg:grid-cols-[1.22fr_0.78fr] lg:items-center">
              <div className="overflow-x-auto rounded-2xl border border-cyan-100/10 bg-slate-950/35 p-4 sm:p-5">
                <div className="min-w-[520px]"><div className="grid grid-cols-8 gap-2">
                  {EXAMPLE_BITS.map((bit, index) => <div key={index} className="text-center"><span className="mb-2 block font-mono text-xs text-slate-500">{WEIGHTS[index]}</span><span className={`grid h-12 place-items-center rounded-lg border font-mono text-lg font-bold ${bit ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.12)]' : 'border-slate-700/70 bg-slate-950/45 text-slate-500'}`}>{bit}</span><span className={`mt-2 block font-mono text-sm ${bit ? 'text-cyan-300' : 'text-slate-600'}`}>{bit ? WEIGHTS[index] : 0}</span></div>)}
                </div></div>
              </div>
              <div>
                <p className="text-sm leading-6 text-slate-400">Keep the weight wherever the bit is <span className="font-mono text-cyan-300">1</span>, then add those weights together.</p>
                <div className="mt-5 flex flex-wrap items-baseline gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-400/5 p-5 font-mono"><span className="text-xl text-slate-200">32 + 8 + 2</span><span className="text-slate-500">=</span><strong className="text-glow text-4xl text-cyan-300">42</strong></div>
                <p className="mt-3 font-mono text-sm tracking-wider text-slate-500">00101010₂ = 42₁₀</p>
              </div>
            </div>
          </section>

          <section aria-label="Practice challenges" className="grid gap-5 lg:grid-cols-2">
            <article className="glass-card rounded-3xl p-5 sm:p-7">
              <div className="flex items-center gap-3"><SectionNumber>4</SectionNumber><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Mini challenge</p><h2 className="mt-1 text-xl font-semibold text-white">Binary → Decimal</h2></div></div>
              <p className="mt-6 leading-7 text-slate-300">Convert the following binary number to decimal:</p>
              <p className="my-4 font-mono text-2xl font-semibold tracking-[0.15em] text-cyan-300">{CHALLENGE_BITS.join('')}</p>
              <StaticBits bits={CHALLENGE_BITS} compact />
              <p className="mt-3 text-xs text-slate-500">Active weights: 16, 4, and 1</p>
              <form onSubmit={checkDecimal} className="mt-5">
                <label htmlFor="decimal-answer" className="mb-2 block text-sm text-slate-300">Your answer</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input id="decimal-answer" type="text" inputMode="numeric" pattern="[0-9]*" value={decimalAnswer} onChange={(event) => { setDecimalAnswer(event.target.value); setDecimalFeedback(null); }} placeholder="Enter a decimal number" className="min-w-0 flex-1 rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 text-white placeholder:text-slate-600 transition focus:border-cyan-300/70" />
                  <button type="submit" className="rounded-xl border border-cyan-300/55 bg-cyan-400/15 px-5 py-3 font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-400/25 hover:shadow-[0_0_24px_rgba(34,211,238,0.16)]">Check Answer</button>
                </div>
                <FeedbackMessage state={decimalFeedback} correctMessage="Correct! 16 + 4 + 1 = 21" />
              </form>
            </article>

            <article className="glass-card rounded-3xl p-5 sm:p-7">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-300/40 bg-violet-400/10 font-mono text-sm font-bold text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.12)]">5</span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">Challenge</p><h2 className="mt-1 text-xl font-semibold text-white">Decimal → Binary</h2></div></div>
              <p className="mt-6 leading-7 text-slate-300">Convert decimal <span className="font-mono font-semibold text-violet-300">42</span> to 8-bit binary.</p>
              <div className="my-6 rounded-2xl border border-violet-300/15 bg-violet-400/5 p-5"><p className="text-sm text-slate-400">Tip: build 42 using the bit weights.</p><p className="mt-2 font-mono text-sm text-violet-200">32 + 8 + 2 = 42</p></div>
              <form onSubmit={checkBinary}>
                <label htmlFor="binary-answer" className="mb-2 block text-sm text-slate-300">Your answer</label>
                <input id="binary-answer" type="text" inputMode="numeric" pattern="[01]*" maxLength={8} value={binaryAnswer} onChange={(event) => { setBinaryAnswer(event.target.value); setBinaryFeedback(null); }} placeholder="Enter 8 bits (e.g. 00101010)" className="w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 font-mono tracking-wider text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-600 transition focus:border-violet-300/70" />
                <button type="submit" className="mt-3 w-full rounded-xl border border-violet-300/55 bg-violet-400/15 px-5 py-3 font-semibold text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-400/25 hover:shadow-[0_0_24px_rgba(139,92,246,0.16)]">Check Answer</button>
                <FeedbackMessage state={binaryFeedback} correctMessage="Correct! 42 in 8-bit binary is 00101010" />
              </form>
            </article>
          </section>

          <section aria-labelledby="complete-title" className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/10 via-blue-400/10 to-violet-400/10 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-xl ${completed ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-300' : 'border-cyan-300/40 bg-cyan-400/10 text-cyan-300'}`} aria-hidden="true">{completed ? '✓' : '⌁'}</span>
                <div><h2 id="complete-title" className="text-xl font-semibold text-white">{completed ? 'Lesson completed ✓' : 'Ready to lock it in?'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{completed ? 'Your progress is saved on this device. You can revisit and practice anytime.' : 'You now know how bits, bytes, binary, decimal, and hex fit together.'}</p></div>
              </div>
              <button type="button" onClick={completeLesson} disabled={completed} className="w-full rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3.5 font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(34,211,238,0.34)] disabled:cursor-default disabled:border-emerald-300/40 disabled:from-emerald-400/20 disabled:to-emerald-400/10 disabled:text-emerald-300 disabled:shadow-none md:w-auto">{completed ? 'Lesson completed' : 'Complete Lesson →'}</button>
            </div>
          </section>
        </div>

        <nav aria-label="Lesson navigation" className="mt-5 grid gap-3 border-t border-cyan-100/10 py-7 text-sm sm:grid-cols-2">
          <a href="#" className="group rounded-xl border border-transparent px-3 py-3 text-slate-400 transition hover:border-cyan-100/10 hover:bg-white/[0.025] hover:text-white"><span className="mr-2 text-cyan-300 transition group-hover:-translate-x-1">←</span><span className="text-slate-500">Previous:</span> Digital Information</a>
          <a href="#" className="group rounded-xl border border-transparent px-3 py-3 text-left text-slate-400 transition hover:border-cyan-100/10 hover:bg-white/[0.025] hover:text-white sm:text-right"><span className="text-slate-500">Next:</span> Files &amp; Encoding<span className="ml-2 text-cyan-300 transition group-hover:translate-x-1">→</span></a>
        </nav>
      </div>
    </main>
  );
}
