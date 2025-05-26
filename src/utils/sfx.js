import * as Tone from 'tone'

// Create a global reverb for ethereal effect
const reverb = new Tone.Reverb({ decay: 4, preDelay: 0.08, wet: 0.7 }).toDestination()
reverb.generate()

// Soft synth for most SFX
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sine' },
  envelope: { attack: 0.04, decay: 0.2, sustain: 0.2, release: 1.2 },
  volume: -12
}).connect(reverb)

// Bell-like synth for success
const bell = new Tone.MembraneSynth({
  pitchDecay: 0.08,
  octaves: 2,
  oscillator: { type: 'sine' },
  envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 1.5 },
  volume: -18
}).connect(reverb)

// Gentle noise for error
const noise = new Tone.NoiseSynth({
  noise: { type: 'pink' },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.3 },
  volume: -24
}).connect(reverb)

// SFX functions
export function playButton() {
  synth.triggerAttackRelease(['C5', 'E5'], 0.12, undefined, 0.18)
}

export function playSuccess() {
  // Heavier, more resonant, dreamy success sound
  bell.triggerAttackRelease('C5', 0.7, undefined, 0.32) // Lower, longer bell
  synth.triggerAttackRelease(['G3', 'E4'], 0.32, undefined, 0.18) // Add a soft low chord
}

export function playError() {
  noise.triggerAttackRelease('16n')
  synth.triggerAttackRelease(['C4'], 0.08, undefined, 0.08)
}

export function playSelect() {
  synth.triggerAttackRelease(['A4', 'E5'], 0.13, undefined, 0.13)
}

export function playAppear() {
  synth.triggerAttackRelease(['D5', 'A5'], 0.18, undefined, 0.09)
}

// Generic play for custom events
export function play(notes = ['C5'], duration = 0.15, velocity = 0.15) {
  synth.triggerAttackRelease(notes, duration, undefined, velocity)
} 