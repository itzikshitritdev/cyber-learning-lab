'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

const WEIGHTS = [128, 64, 32, 16, 8, 4, 2, 1] as const;
const EXAMPLE_BITS = [0, 0, 1, 0, 1, 0, 1, 0] as const;
const CHALLENGE_BITS = [0, 0, 0, 1, 0, 1, 0, 1] as const;
const INITIAL_BITS = [0, 0, 1, 0, 1, 0, 1, 0];

type Feedback = 'correct' | 'wrong' | null;
type LearningMode = 'explore' | 'predict' | 'challenge';
type PredictionResult = { decimal: boolean; hex: boolean } | null;

function randomByte(exclude?: number) {
  let next = Math.floor(Math.random() * 256);
  if (next === exclude) next = (next + 73) % 256;
  return next;
}

function byteToBits(value: number) {
  return value.toString(2).padStart(8, '0').split('').map(Number);
}

function normalizeHex(value: string) {
  return value.trim().replace(/^0x/i, '').toUpperCase();
}

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

function StatusMessage({ tone, children }: { tone: 'correct' | 'wrong' | 'info'; children: React.ReactNode }) {
  const correct = tone === 'correct';
  const info = tone === 'info';
  return (
    <p role="status" aria-live="polite" className={`mt-3 rounded-xl border px-4 py-3 text-sm ${correct ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : info ? 'border-cyan-300/25 bg-cyan-400/8 text-cyan-100' : 'border-amber-400/30 bg-amber-400/10 text-amber-200'}`}>
      <span className="mr-2" aria-hidden="true">{correct ? '✓' : info ? '→' : '↗'}</span>
      {children}
    </p>
  );
}

function ModeButton({ mode, activeMode, onClick, children }: { mode: LearningMode; activeMode: LearningMode; onClick: (mode: LearningMode) => void; children: React.ReactNode }) {
  const active = mode === activeMode;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={() => onClick(mode)}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? 'bg-cyan-400/15 text-cyan-200 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.28)]' : 'text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'}`}
    >
      {children}
    </button>
  );
}

function MasteryItem({ mastered, children }: { mastered: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${mastered ? 'text-slate-200' : 'text-slate-500'}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] ${mastered ? 'border-emerald-300/45 bg-emerald-400/12 text-emerald-300' : 'border-slate-700 text-slate-600'}`} aria-hidden="true">
        {mastered ? '✓' : '·'}
      </span>
      {children}
    </li>
  );
}

export default function LessonPage() {
  const [bits, setBits] = useState(INITIAL_BITS);
  const [learningMode, setLearningMode] = useState<LearningMode>('explore');
  const [predictionDecimal, setPredictionDecimal] = useState('');
  const [predictionHex, setPredictionHex] = useState('');
  const [predictionResult, setPredictionResult] = useState<PredictionResult>(null);
  const [predictionAttempts, setPredictionAttempts] = useState(0);
  const [predictionRevealed, setPredictionRevealed] = useState(false);
  const [bitChallengeValue, setBitChallengeValue] = useState(42);
  const [bitChallengeDecimal, setBitChallengeDecimal] = useState('');
  const [bitChallengeHex, setBitChallengeHex] = useState('');
  const [bitChallengeResult, setBitChallengeResult] = useState<PredictionResult>(null);
  const [bitChallengeAttempts, setBitChallengeAttempts] = useState(0);
  const [bitChallengeScore, setBitChallengeScore] = useState(0);
  const [decimalAnswer, setDecimalAnswer] = useState('');
  const [binaryAnswer, setBinaryAnswer] = useState('');
  const [decimalFeedback, setDecimalFeedback] = useState<Feedback>(null);
  const [binaryFeedback, setBinaryFeedback] = useState<Feedback>(null);
  const [decimalAttempts, setDecimalAttempts] = useState(0);
  const [binaryAttempts, setBinaryAttempts] = useState(0);
  const [decimalHintLevel, setDecimalHintLevel] = useState(0);
  const [showDecimalExplanation, setShowDecimalExplanation] = useState(false);
  const [showBinaryExplanation, setShowBinaryExplanation] = useState(false);
  const [decimalSolved, setDecimalSolved] = useState(false);
  const [binarySolved, setBinarySolved] = useState(false);
  const [bitInteracted, setBitInteracted] = useState(false);
  const [hexMastered, setHexMastered] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const wasCompleted = localStorage.getItem('lesson:bits-bytes-binary') === 'complete';
      setCompleted(wasCompleted);
      if (wasCompleted) {
        setDecimalSolved(true);
        setBinarySolved(true);
        setBitInteracted(true);
        setHexMastered(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const decimalValue = useMemo(
    () => bits.reduce((total, bit, index) => total + bit * WEIGHTS[index], 0),
    [bits],
  );
  const binaryValue = bits.join('');
  const hexValue = decimalValue.toString(16).toUpperCase().padStart(2, '0');
  const bitChallengeBits = byteToBits(bitChallengeValue);
  const bitChallengeExpectedHex = bitChallengeValue.toString(16).toUpperCase().padStart(2, '0');
  const canComplete = decimalSolved && binarySolved;

  function toggleBit(index: number) {
    setBits((current) => current.map((bit, bitIndex) => bitIndex === index ? (bit ? 0 : 1) : bit));
    setBitInteracted(true);
    if (learningMode === 'predict') {
      setPredictionResult(null);
      setPredictionAttempts(0);
      setPredictionRevealed(false);
      setPredictionDecimal('');
      setPredictionHex('');
    }
  }

  function startNewBitChallenge() {
    setBitChallengeValue((current) => randomByte(current));
    setBitChallengeDecimal('');
    setBitChallengeHex('');
    setBitChallengeResult(null);
    setBitChallengeAttempts(0);
  }

  function changeLearningMode(mode: LearningMode) {
    setLearningMode(mode);
    setBitInteracted(true);
    if (mode === 'challenge') startNewBitChallenge();
  }

  function checkPrediction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = {
      decimal: predictionDecimal.trim() !== '' && Number(predictionDecimal) === decimalValue,
      hex: normalizeHex(predictionHex) === hexValue,
    };
    setPredictionResult(result);
    if (!result.decimal || !result.hex) setPredictionAttempts((current) => current + 1);
    if (result.hex) setHexMastered(true);
  }

  function revealPrediction() {
    setPredictionRevealed(true);
    setHexMastered(true);
  }

  function checkBitChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = {
      decimal: bitChallengeDecimal.trim() !== '' && Number(bitChallengeDecimal) === bitChallengeValue,
      hex: normalizeHex(bitChallengeHex) === bitChallengeExpectedHex,
    };
    setBitChallengeResult(result);
    if (result.decimal && result.hex) {
      setBitChallengeScore((current) => current + 1);
      setHexMastered(true);
      setBitInteracted(true);
    } else {
      setBitChallengeAttempts((current) => current + 1);
    }
  }

  function checkDecimal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const correct = Number(decimalAnswer) === 21;
    setDecimalFeedback(correct ? 'correct' : 'wrong');
    setDecimalSolved(correct);
    if (!correct) {
      const nextAttempt = decimalAttempts + 1;
      setDecimalAttempts(nextAttempt);
      if (nextAttempt >= 2) setDecimalHintLevel(2);
    }
  }

  function checkBinary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const correct = binaryAnswer.trim() === '00101010';
    setBinaryFeedback(correct ? 'correct' : 'wrong');
    setBinarySolved(correct);
    if (!correct) setBinaryAttempts((current) => current + 1);
  }

  function completeLesson() {
    if (!canComplete) return;
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
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {learningMode === 'explore' && 'Toggle the switches and watch each number system update.'}
                  {learningMode === 'predict' && 'Build a byte, then predict its decimal and hex values.'}
                  {learningMode === 'challenge' && 'Convert a random byte without seeing its weights.'}
                </p>
              </div>
              <div className="rounded-2xl border border-cyan-100/10 bg-slate-950/35 p-4 sm:p-5">
                <div role="group" aria-label="Bit activity mode" className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-cyan-100/10 bg-slate-950/50 p-1">
                  <ModeButton mode="explore" activeMode={learningMode} onClick={changeLearningMode}>Explore</ModeButton>
                  <ModeButton mode="predict" activeMode={learningMode} onClick={changeLearningMode}>Predict</ModeButton>
                  <ModeButton mode="challenge" activeMode={learningMode} onClick={changeLearningMode}>Challenge</ModeButton>
                </div>

                {learningMode === 'challenge' ? (
                  <>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Random 8-bit value</p>
                      <p className="text-xs text-slate-500">Session score: <span className="font-mono text-cyan-300">{bitChallengeScore}</span></p>
                    </div>
                    <StaticBits bits={bitChallengeBits} />
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Bit weight</p>
                    <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
                      {bits.map((bit, index) => <BitSwitch key={index} bit={bit} weight={WEIGHTS[index]} index={index} onToggle={() => toggleBit(index)} />)}
                    </div>
                  </>
                )}

                {learningMode === 'explore' && (
                  <div className="soft-divider mt-5 grid grid-cols-1 gap-3 border-t pt-5 sm:grid-cols-3">
                    <div><p className="text-xs text-slate-500">Binary</p><output className="mt-1 block font-mono text-lg font-semibold tracking-wider text-cyan-300">{binaryValue}</output></div>
                    <div className="sm:border-l sm:border-cyan-100/10 sm:pl-5"><p className="text-xs text-slate-500">Decimal value</p><output className="mt-1 block font-mono text-lg font-semibold text-white">{decimalValue}</output></div>
                    <div className="sm:border-l sm:border-cyan-100/10 sm:pl-5"><p className="text-xs text-slate-500">Hex value</p><output className="mt-1 block font-mono text-lg font-semibold text-violet-300">0x{hexValue}</output></div>
                  </div>
                )}

                {learningMode === 'predict' && (
                  <form onSubmit={checkPrediction} className="soft-divider mt-5 border-t pt-5">
                    <p className="mb-4 text-sm text-slate-300">What values does <span className="font-mono text-cyan-300">{binaryValue}</span> represent?</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-slate-400">Decimal
                        <input type="text" inputMode="numeric" pattern="[0-9]*" value={predictionDecimal} onChange={(event) => { setPredictionDecimal(event.target.value); setPredictionResult(null); }} placeholder="0–255" className="mt-2 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 text-white placeholder:text-slate-600 focus:border-cyan-300/70" />
                      </label>
                      <label className="text-sm text-slate-400">Hex
                        <input type="text" inputMode="text" maxLength={4} value={predictionHex} onChange={(event) => { setPredictionHex(event.target.value); setPredictionResult(null); }} placeholder="e.g. 2A or 0x2A" className="mt-2 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 font-mono uppercase text-white placeholder:font-sans placeholder:normal-case placeholder:text-slate-600 focus:border-violet-300/70" />
                      </label>
                    </div>
                    <button type="submit" className="mt-3 w-full rounded-xl border border-cyan-300/55 bg-cyan-400/15 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/25">Check prediction</button>
                    {predictionResult && predictionResult.decimal && predictionResult.hex && <StatusMessage tone="correct">Both predictions are correct.</StatusMessage>}
                    {predictionResult && (!predictionResult.decimal || !predictionResult.hex) && (
                      <StatusMessage tone="wrong">Decimal: {predictionResult.decimal ? 'correct' : 'try again'}. Hex: {predictionResult.hex ? 'correct' : 'try again'}.</StatusMessage>
                    )}
                    {predictionAttempts > 0 && !predictionRevealed && !(predictionResult?.decimal && predictionResult?.hex) && (
                      <button type="button" onClick={revealPrediction} className="mt-3 rounded-lg border border-slate-600/70 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200">Reveal answer</button>
                    )}
                    {predictionRevealed && <StatusMessage tone="info">Decimal {decimalValue} · Hex 0x{hexValue}</StatusMessage>}
                  </form>
                )}

                {learningMode === 'challenge' && (
                  <form onSubmit={checkBitChallenge} className="soft-divider mt-5 border-t pt-5">
                    <p className="mb-4 text-sm text-slate-300">Convert the byte to both values. No weights are shown.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm text-slate-400">Decimal
                        <input type="text" inputMode="numeric" pattern="[0-9]*" disabled={bitChallengeResult?.decimal && bitChallengeResult?.hex} value={bitChallengeDecimal} onChange={(event) => { setBitChallengeDecimal(event.target.value); setBitChallengeResult(null); }} placeholder="0–255" className="mt-2 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 text-white placeholder:text-slate-600 disabled:opacity-60" />
                      </label>
                      <label className="text-sm text-slate-400">Hex
                        <input type="text" inputMode="text" maxLength={4} disabled={bitChallengeResult?.decimal && bitChallengeResult?.hex} value={bitChallengeHex} onChange={(event) => { setBitChallengeHex(event.target.value); setBitChallengeResult(null); }} placeholder="e.g. FF or 0xFF" className="mt-2 w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 font-mono uppercase text-white placeholder:font-sans placeholder:normal-case placeholder:text-slate-600 disabled:opacity-60" />
                      </label>
                    </div>
                    {bitChallengeResult?.decimal && bitChallengeResult?.hex ? (
                      <button type="button" onClick={startNewBitChallenge} className="mt-3 w-full rounded-xl border border-emerald-300/45 bg-emerald-400/12 px-5 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-400/20">Generate another challenge</button>
                    ) : (
                      <button type="submit" className="mt-3 w-full rounded-xl border border-violet-300/55 bg-violet-400/15 px-5 py-3 font-semibold text-violet-100 transition hover:bg-violet-400/25">Check answer</button>
                    )}
                    {bitChallengeResult?.decimal && bitChallengeResult?.hex && <StatusMessage tone="correct">Correct — {bitChallengeValue} and 0x{bitChallengeExpectedHex}.</StatusMessage>}
                    {bitChallengeResult && (!bitChallengeResult.decimal || !bitChallengeResult.hex) && (
                      <StatusMessage tone="wrong">Attempt {bitChallengeAttempts}: {bitChallengeAttempts === 1 ? 'check which positions contain a 1.' : 'recheck each conversion independently.'}</StatusMessage>
                    )}
                  </form>
                )}
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
              <form onSubmit={checkDecimal} className="mt-5">
                <label htmlFor="decimal-answer" className="mb-2 block text-sm text-slate-300">Your answer</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input id="decimal-answer" type="text" inputMode="numeric" pattern="[0-9]*" value={decimalAnswer} onChange={(event) => { setDecimalAnswer(event.target.value); setDecimalFeedback(null); if (decimalSolved) { setDecimalSolved(false); setDecimalAttempts(0); setDecimalHintLevel(0); setShowDecimalExplanation(false); } }} placeholder="Enter a decimal number" className="min-w-0 flex-1 rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 text-white placeholder:text-slate-600 transition focus:border-cyan-300/70" />
                  <button type="submit" className="rounded-xl border border-cyan-300/55 bg-cyan-400/15 px-5 py-3 font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-cyan-400/25 hover:shadow-[0_0_24px_rgba(34,211,238,0.16)]">Check Answer</button>
                </div>
                {decimalFeedback === 'correct' && <StatusMessage tone="correct">Correct! 16 + 4 + 1 = 21</StatusMessage>}
                {decimalFeedback === 'wrong' && decimalAttempts === 1 && <StatusMessage tone="wrong">Not quite. Try identifying the active bit positions.</StatusMessage>}
                {decimalFeedback === 'wrong' && decimalAttempts === 2 && <StatusMessage tone="wrong">Hint: the active weights are 16, 4, and 1.</StatusMessage>}
                {decimalFeedback === 'wrong' && decimalAttempts >= 3 && <StatusMessage tone="wrong">You are close. Use the active weights to build the total.</StatusMessage>}
                {decimalAttempts >= 1 && decimalHintLevel === 0 && decimalFeedback !== 'correct' && (
                  <button type="button" onClick={() => setDecimalHintLevel(1)} className="mt-3 rounded-lg border border-slate-600/70 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-200">Hint</button>
                )}
                {decimalHintLevel === 1 && <StatusMessage tone="info">Look at the positions where the bit is 1.</StatusMessage>}
                {decimalHintLevel >= 2 && decimalAttempts !== 2 && decimalFeedback !== 'correct' && <StatusMessage tone="info">The relevant weights are 16, 4, and 1.</StatusMessage>}
                {decimalAttempts >= 3 && !showDecimalExplanation && decimalFeedback !== 'correct' && (
                  <button type="button" onClick={() => setShowDecimalExplanation(true)} className="mt-3 rounded-lg border border-cyan-300/35 bg-cyan-400/8 px-3 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/15">Show explanation</button>
                )}
                {showDecimalExplanation && <StatusMessage tone="info">The 1s sit under 16, 4, and 1. Add them: 16 + 4 + 1 = 21.</StatusMessage>}
              </form>
            </article>

            <article className="glass-card rounded-3xl p-5 sm:p-7">
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-violet-300/40 bg-violet-400/10 font-mono text-sm font-bold text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.12)]">5</span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">Challenge</p><h2 className="mt-1 text-xl font-semibold text-white">Decimal → Binary</h2></div></div>
              <p className="mt-6 leading-7 text-slate-300">Convert decimal <span className="font-mono font-semibold text-violet-300">42</span> to 8-bit binary.</p>
              <div className="my-6 rounded-2xl border border-violet-300/15 bg-violet-400/5 p-5"><p className="text-sm text-slate-400">Tip: start with the largest weight that fits into 42, then work to the right.</p></div>
              <form onSubmit={checkBinary}>
                <label htmlFor="binary-answer" className="mb-2 block text-sm text-slate-300">Your answer</label>
                <input id="binary-answer" type="text" inputMode="numeric" pattern="[01]*" maxLength={8} value={binaryAnswer} onChange={(event) => { setBinaryAnswer(event.target.value); setBinaryFeedback(null); if (binarySolved) { setBinarySolved(false); setBinaryAttempts(0); setShowBinaryExplanation(false); } }} placeholder="Enter 8 bits (e.g. 00101010)" className="w-full rounded-xl border border-slate-600/70 bg-slate-950/55 px-4 py-3 font-mono tracking-wider text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-slate-600 transition focus:border-violet-300/70" />
                <button type="submit" className="mt-3 w-full rounded-xl border border-violet-300/55 bg-violet-400/15 px-5 py-3 font-semibold text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-400/25 hover:shadow-[0_0_24px_rgba(139,92,246,0.16)]">Check Answer</button>
                {binaryFeedback === 'correct' && <StatusMessage tone="correct">Correct! 42 in 8-bit binary is 00101010.</StatusMessage>}
                {binaryFeedback === 'wrong' && binaryAttempts === 1 && <StatusMessage tone="wrong">Not quite. Try placing a 1 under the largest weight that fits.</StatusMessage>}
                {binaryFeedback === 'wrong' && binaryAttempts === 2 && <StatusMessage tone="wrong">Hint: 42 uses the weights 32, 8, and 2.</StatusMessage>}
                {binaryFeedback === 'wrong' && binaryAttempts >= 3 && <StatusMessage tone="wrong">Check that your answer contains exactly eight bits.</StatusMessage>}
                {binaryAttempts >= 3 && !showBinaryExplanation && binaryFeedback !== 'correct' && (
                  <button type="button" onClick={() => setShowBinaryExplanation(true)} className="mt-3 rounded-lg border border-violet-300/35 bg-violet-400/8 px-3 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/15">Show explanation</button>
                )}
                {showBinaryExplanation && <StatusMessage tone="info">Turn on the 32, 8, and 2 positions. Reading all eight positions gives 00101010.</StatusMessage>}
              </form>
            </article>
          </section>

          <section aria-labelledby="mastery-title" className="glass-card rounded-3xl p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Mastery summary</p>
                <h2 id="mastery-title" className="mt-1 text-lg font-semibold text-white">Concepts mastered</h2>
              </div>
              <ul className="grid gap-x-7 gap-y-2 sm:grid-cols-2">
                <MasteryItem mastered={bitInteracted}>Bit / Byte</MasteryItem>
                <MasteryItem mastered={decimalSolved}>Binary → Decimal</MasteryItem>
                <MasteryItem mastered={binarySolved}>Decimal → Binary</MasteryItem>
                <MasteryItem mastered={hexMastered}>Binary ↔ Hex</MasteryItem>
              </ul>
            </div>
          </section>

          <section aria-labelledby="complete-title" className="relative overflow-hidden rounded-3xl border border-cyan-300/20 bg-gradient-to-r from-cyan-400/10 via-blue-400/10 to-violet-400/10 p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-start gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-xl ${completed ? 'border-emerald-300/50 bg-emerald-400/15 text-emerald-300' : 'border-cyan-300/40 bg-cyan-400/10 text-cyan-300'}`} aria-hidden="true">{completed ? '✓' : '⌁'}</span>
                <div><h2 id="complete-title" className="text-xl font-semibold text-white">{completed ? 'Lesson completed ✓' : 'Ready to lock it in?'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{completed ? 'Your progress is saved on this device. You can revisit and practice anytime.' : 'You now know how bits, bytes, binary, decimal, and hex fit together.'}</p></div>
              </div>
              <div className="w-full md:w-auto">
                {!completed && !canComplete && <p className="mb-2 text-center text-xs text-slate-400 md:text-left">Complete both challenges to finish the lesson.</p>}
                <button type="button" onClick={completeLesson} disabled={completed || !canComplete} className="w-full rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-400 to-blue-500 px-7 py-3.5 font-semibold text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(34,211,238,0.34)] disabled:cursor-not-allowed disabled:border-slate-600/60 disabled:from-slate-700/40 disabled:to-slate-800/40 disabled:text-slate-500 disabled:shadow-none md:w-auto">{completed ? 'Lesson completed' : canComplete ? 'Complete Lesson →' : 'Complete Lesson'}</button>
              </div>
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
