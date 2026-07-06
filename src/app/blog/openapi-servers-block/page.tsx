import type { Metadata } from 'next'
import { BlogLayout } from '@/components/landing/BlogLayout'

export const metadata: Metadata = {
  title: 'Your OpenAPI spec is shipping a dead base URL · SnowForge',
  description:
    'The servers block is part of your API product, not an afterthought. Two traps make it point nowhere, and both ship silently.',
}

export default function Post() {
  return (
    <BlogLayout
      title="Your OpenAPI spec is shipping a dead base URL"
      date="July 3, 2026"
      dek="The servers block is part of your API product, not an afterthought. Two traps make it point nowhere, and both ship silently."
    >
      <p>
        An OpenAPI spec is not just documentation, it is the contract a
        developer pastes into Postman, an SDK generator, or a try-it console.
        The first thing every one of those tools reads is the{' '}
        <code>servers</code> block: the base URL your endpoints hang off. Get
        it wrong and every example in your beautifully written spec resolves
        to nothing. It is the most-used field and the one most likely to be an
        afterthought.
      </p>

      <h2>Trap one: the placeholder that shipped</h2>
      <p>
        Specs are usually born with a <code>servers</code> entry of{' '}
        <code>http://localhost:3000</code> or, worse, a templated{' '}
        <code>https://{'{apiId}'}.example.com</code> with a comment to replace
        it later. Later never comes. The spec gets published with the
        placeholder intact, and now your public API documentation tells the
        world to call <code>localhost</code> or a literal{' '}
        <code>REPLACE_ME</code>. It passes every test you have, because your
        tests hit the real URL directly and never read the spec&rsquo;s
        servers block at all. The only person who hits it is the first
        external developer trying to use you.
      </p>

      <h2>Trap two: the AWS HTTP API stage path</h2>
      <p>
        This one is sneakier and specific to AWS API Gateway&rsquo;s HTTP APIs
        (the v2 ones). People assume the base URL includes a stage prefix like{' '}
        <code>/prod</code>, the way the older REST APIs did, and they write{' '}
        <code>https://host/prod</code> into the servers block. But an HTTP API
        deployed to the <code>$default</code> stage has <em>no</em> path
        prefix. The real base is just <code>https://host</code>, and{' '}
        <code>https://host/prod/jobs</code> returns a 404 that looks like your
        endpoint is missing when in fact the stage segment should not be there
        at all. Hours disappear into debugging a route that was never wrong.
      </p>

      <h2>The fix: treat the base URL as deployed config</h2>
      <p>
        The servers block should not be hand-typed and hoped over. Generate it
        from the actually-deployed URL, the value your infrastructure already
        knows after a deploy, and inject it into the spec at build time. Then
        add the test almost nobody writes: hit the URL <em>as documented</em>,
        servers block plus a sample path, and assert it returns something real.
        That single check catches both traps, the localhost placeholder and
        the phantom stage prefix, before a developer ever sees them.
      </p>

      <h2>The broader point</h2>
      <p>
        A spec that does not point at a working server is worse than no spec,
        because it wastes the time of exactly the developer you most wanted to
        win over. The servers block deserves the same rigor as the endpoints
        themselves. It is the door; the rooms do not matter if the door opens
        onto a wall.
      </p>

      <h2>The plug</h2>
      <p>
        SnowScrape ships a real, public API, which is precisely why these
        traps came up: a documented base URL is part of the product, and it is
        tested as one. If you want public web data behind a clean API instead
        of a one-off script, it is at{' '}
        <a href="https://scrape.snowforge.dev">scrape.snowforge.dev</a>.
      </p>
    </BlogLayout>
  )
}
