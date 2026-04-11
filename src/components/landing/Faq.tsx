import { ReactNode } from 'react'
import { CopyEmailButton } from './CopyEmailButton'

type FaqEntry = {
  question: string
  answer: ReactNode
}

const FAQS: FaqEntry[] = [
  {
    question: 'Is this one company or seven?',
    answer:
      'One. SnowForge LLC is a solo shop, and every app is part of the same studio. Same account, same credit card on file, same person answering the phone.',
  },
  {
    question: 'Who runs this?',
    answer:
      "Me. Alex Diaz. A decade in e-commerce, mostly around product feeds and catalogs. I build these on nights and weekends alongside a day job, and ship them when they're ready.",
  },
  {
    question: 'How do I get support?',
    answer: (
      <>
        Email me at <CopyEmailButton email="support@snowforge.dev" />. You&apos;ll
        get a reply from me directly, usually the same day.
      </>
    ),
  },
  {
    question: 'Is my data safe?',
    answer:
      'Yes. SnowForge runs on secure infrastructure with industry standard authentication and encrypted secret management. Your data is never sold. The full policy lives at the privacy link below.',
  },
  {
    question: "What's on the roadmap?",
    answer:
      "More tools in the same spirit. MCP servers, an operator friendly Shopify workbench, a feed audit template, and whatever else I wish existed. Follow the blog to see what's shipping.",
  },
]

export function Faq() {
  return (
    <section
      id="faq"
      className="border-y border-border bg-surface px-6 py-24"
    >
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight text-foreground">
            Honest questions
          </h2>
          <p className="mt-3 text-sm text-ink-dim">
            The stuff real people actually ask.
          </p>
        </div>

        <div className="mt-12 space-y-3">
          {FAQS.map((faq) => (
            <FaqItem key={faq.question} question={faq.question}>
              {faq.answer}
            </FaqItem>
          ))}
        </div>
      </div>
    </section>
  )
}

function FaqItem({
  question,
  children,
}: {
  question: string
  children: ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <h3 className="text-sm font-semibold text-foreground">{question}</h3>
      <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  )
}
