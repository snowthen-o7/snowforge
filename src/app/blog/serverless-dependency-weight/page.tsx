import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'The dependency that works locally and breaks only in production · SnowForge',
  description:
    'A heavyweight import that passes every test and fails on the first real request in a Lambda. Why it happens and how to keep serverless code light.',
}

export default function Post() {
  return (
    <BlogLayout
      title="The dependency that works locally and breaks only in production"
      date="June 29, 2026"
      dek="A heavyweight import that passes every test and fails on the first real request in a Lambda. Why it happens, and how to keep serverless code light."
    >
      <p>
        Here is a failure that is almost designed to waste your afternoon: a
        feature works on your machine, passes every test, deploys cleanly, and
        then throws an import error the first time a real user touches it in
        production, and only that one feature, only that first time. The
        culprit is usually a heavyweight dependency that your local environment
        has and your deployed artifact does not.
      </p>

      <h2>How it hides</h2>
      <p>
        Say one endpoint exports data to a spreadsheet and reaches for{' '}
        <code>pandas</code> (or <code>pyarrow</code>, or{' '}
        <code>openpyxl</code>) to build it. Locally, those packages are sitting
        in your virtual environment, so it just works. Your tests pass, for
        the same reason. But the serverless deploy only bundles what the
        manifest declares, and if that big dependency was installed locally but
        never added to the deploy manifest, it simply is not in the Lambda.
        Three things then conspire to hide it: the import is at module top so
        it only fails when that module is first loaded; only the export feature
        loads that module; and the failure waits for the first uncached request
        because the container reuses a warm import after that. So it passes CI,
        passes a smoke test of the other routes, and ambushes the one user who
        clicks Export.
      </p>

      <h2>Keep the serverless path light</h2>
      <p>
        The first instinct is to add the dependency to the manifest and move
        on. Sometimes that is right. But often the better fix is to not need it
        at all. A CSV export does not require <code>pandas</code>; the
        standard library&rsquo;s <code>csv</code> module writes one in a few
        lines with zero deploy weight and zero cold-start cost. Heavyweight
        data libraries are wonderful in a notebook and expensive in a function
        that should boot in milliseconds. On the serverless path, reach for the
        standard library first.
      </p>

      <h2>If you do need it, import it where it is used</h2>
      <p>
        When a feature genuinely needs the heavy package, do not import it at
        module top where it loads for every invocation and fails loudly out of
        context. Import it lazily, inside the function that uses it, wrapped so
        a missing dependency surfaces as a clear, handled error for that one
        feature instead of a cryptic crash that taints the whole module. The
        rest of the endpoints keep working; the export degrades gracefully.
      </p>

      <h2>Test the artifact, not the environment</h2>
      <p>
        The root cause is that your tests ran against your machine, not against
        the thing you shipped. The durable fix is to verify the packaged
        artifact: install only what the manifest declares into a clean
        environment, or run the deployed function once against the real path,
        and confirm the import resolves there. &ldquo;It works on my
        machine&rdquo; is not a deploy check; exercising the build is.
      </p>

      <h2>The plug</h2>
      <p>
        SnowScrape runs its export and processing paths on serverless
        functions, which is exactly the environment where this bites, so the
        rule is dependency-light by default and lazy imports for the heavy
        stuff. If you would rather not own that discipline yourself, it is at{' '}
        <a href="https://scrape.snowforge.dev">scrape.snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
