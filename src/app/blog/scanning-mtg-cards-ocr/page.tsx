import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Scanning a Magic: The Gathering collection with a phone camera: the OCR reality · SnowForge',
  description:
    'Reading a card name off a phone camera sounds trivial. The edge cases are where a collection scanner actually lives or dies.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Scanning a Magic: The Gathering collection with a phone camera: the OCR reality"
      date="June 16, 2026"
      dek="Reading a card name off a phone camera sounds trivial. The edge cases are where a collection scanner actually lives or dies."
    >
      <p>
        &ldquo;Just read the card name and look up the price&rdquo; is the
        kind of feature that demos in five minutes and takes months to make
        trustworthy. Optical character recognition on a Magic card is not the
        hard part anymore; the hard part is everything that makes one card
        different from the thirty thousand others that share most of its text.
        Here is where a phone-camera collection scanner actually gets tested.
      </p>

      <h2>The name is not enough</h2>
      <p>
        Reading &ldquo;Lightning Bolt&rdquo; off the title is easy. Knowing
        <em>which</em> Lightning Bolt is the entire problem, because the same
        card has been printed in dozens of sets across decades, and the value
        ranges from cents to hundreds depending on the printing. A scanner
        that returns a name has done the trivial 80% and skipped the part the
        user actually cares about: the specific edition in their hand.
      </p>

      <h2>The disambiguators are small and unreliable</h2>
      <p>
        The things that identify a printing, the set symbol, the collector
        number, the artist line at the bottom, are tiny, low-contrast, and the
        first to blur under a phone camera in living-room light. Set symbols
        in particular are a visual classification problem, not a text one, and
        they shrink and restyle across eras. So you cannot rely on any single
        cue; you triangulate from the name plus whatever secondary signals
        survive the photo.
      </p>

      <h2>The edge cases are the whole game</h2>
      <p>
        A real collection is full of cards that break naive assumptions. Foils
        throw glare that wrecks contrast. Alternate-art and borderless
        printings move or remove the cues you were keying on. Tokens and
        double-faced cards have non-standard layouts. Non-English printings
        change the name text entirely. Special editions restyle everything.
        Each of these is rare individually and collectively guaranteed, so a
        scanner that only works on a clean, modern, English, non-foil card
        works on roughly none of anyone&rsquo;s actual binder.
      </p>

      <h2>Confidence, not certainty</h2>
      <p>
        The honest design admits it will be unsure. Instead of silently
        guessing, a good scanner ranks candidates and tells you how confident
        it is: a confident match adds itself, a borderline one asks a quick
        yes-or-no, an unrecognized one says so and lets you retry rather than
        polluting your collection with a wrong card. Speed comes from getting
        the easy ones right instantly; trust comes from being visibly honest
        about the hard ones.
      </p>

      <h2>The lesson under the lesson</h2>
      <p>
        This is a general truth about any recognition feature: the demo is the
        easy case, and the product is the long tail. The value is not in
        reading the text, it is in resolving the ambiguity the text leaves
        behind, gracefully, at the speed of flipping through a stack. Plan for
        the foils and the alt-arts from day one, because that is what a real
        collection is made of.
      </p>

      <h2>The plug</h2>
      <p>
        SnowCards is built around the hard part: fast, confidence-tiered
        scanning that resolves the printing, not just the name, and handles
        the foils, alt-arts, and oddballs that a real collection is full of.
        It is at <a href="https://cards.snowforge.dev">cards.snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
