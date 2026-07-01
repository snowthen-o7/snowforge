import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'CSS selectors, XPath, or an LLM: choosing how to extract · SnowForge',
  description:
    'Three ways to pull structured data off a web page, each with a real sweet spot. Here is how to pick without overpaying or over-engineering.',
}

export default function Post() {
  return (
    <BlogLayout
      title="CSS selectors, XPath, or an LLM: choosing how to extract"
      date="June 30, 2026"
      dek="Three ways to pull structured data off a page, each with a real sweet spot. Here is how to pick without overpaying or over-engineering."
    >
      <p>
        Once you have a page in hand, you still have to turn it into
        structured data. There are three tools people reach for: CSS
        selectors, XPath, and, increasingly, an LLM. They are not
        interchangeable, and reaching for the wrong one is how you end up
        either with a brittle scraper that breaks weekly or a token bill that
        makes the whole project pointless. Here is the honest comparison.
      </p>

      <h2>CSS selectors: fast, cheap, brittle</h2>
      <p>
        Selectors like <code>.product-card .price</code> are how you should
        start. They are fast, they cost nothing, and they are easy to read.
        Their weakness is that they bind tightly to the page&rsquo;s markup:
        the day the site ships a redesign or renames a class, your selector
        silently returns nothing. For a stable, well-structured site you
        control or trust, selectors are the right default and you should not
        overthink it.
      </p>

      <h2>XPath: more reach, same brittleness</h2>
      <p>
        XPath does everything selectors do and adds the things they cannot:
        traversing <em>up</em> the tree from a known node, selecting by text
        content (&ldquo;the cell whose header says Price&rdquo;), and
        navigating deeply nested or table-heavy markup. It is the right tool
        when the data you want is defined by its relationship to a stable
        anchor rather than by a clean class. It shares the same fragility,
        though, change the structure and it breaks, so it buys you power, not
        resilience.
      </p>

      <h2>LLM extraction: resilient, slower, non-deterministic</h2>
      <p>
        Handing the page (or its cleaned text) to a language model and asking
        for the fields you want is genuinely different. It is resilient to
        layout changes because it reads meaning, not markup, so a redesign
        that shatters your selectors barely fazes it. It shines on messy,
        inconsistent, or unstructured pages where no stable selector exists.
        The costs are real: it is slower, it costs tokens per page, and it is
        non-deterministic, so it can hallucinate a value or format two pages
        differently. You must validate its output, never trust it blind.
      </p>

      <h2>How to actually choose</h2>
      <p>
        The decision is mostly about structure and volume. If the site is
        stable and structured, use selectors; reach for XPath only when you
        need its traversal or text-matching. If the pages are messy, vary
        wildly, or the layout changes often, an LLM earns its cost. And if
        you are extracting at high volume, the winning pattern is a hybrid:
        cheap selectors on the happy path, with the LLM as a fallback for the
        rows where the selector returns nothing. That keeps the bill down
        while staying robust to the pages that do not cooperate.
      </p>

      <h2>The rule of thumb</h2>
      <p>
        Start with the cheapest tool that works and only climb the ladder
        when the page forces you to. Most teams do the opposite, they reach
        for the LLM first because it is impressive, and discover the cost at
        scale. Selectors until they break, XPath when you need reach, the
        model when the structure genuinely is not there.
      </p>

      <h2>The plug</h2>
      <p>
        SnowScrape supports all three so you do not have to commit up front:
        point-and-pick selectors for the easy sites, XPath for the awkward
        ones, and LLM extraction for the pages that have no clean structure,
        with the validation to keep the model honest. It is at{' '}
        <a href="https://scrape.snowforge.dev">scrape.snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
