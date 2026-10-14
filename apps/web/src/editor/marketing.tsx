import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@cossplay/ui/components/accordion"
import { Badge } from "@cossplay/ui/components/badge"
import { Button } from "@cossplay/ui/components/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@cossplay/ui/components/card"
import { Input } from "@cossplay/ui/components/input"
import { cn } from "@cossplay/ui/lib/utils"
import {
  ArrowRightIcon,
  CheckIcon,
  GaugeIcon,
  LockIcon,
  PaletteIcon,
  PlugIcon,
  SparklesIcon,
  UsersIcon,
} from "lucide-react"
import { Person } from "@/editor/cards"

const logos = ["Northwind", "Globex", "Initech", "Umbrella", "Hooli", "Soylent"]

const features = [
  [GaugeIcon, "Fast by default", "Pages ship lean and load in a blink."],
  [PaletteIcon, "Themeable", "Every color, font and radius is a token."],
  [LockIcon, "Secure", "SSO, audit logs and role-based access."],
  [PlugIcon, "Integrations", "Connect the tools your team already uses."],
  [UsersIcon, "Collaborative", "Comment, review and ship together."],
  [SparklesIcon, "Delightful", "Thoughtful details in every interaction."],
] as const

const plans = [
  {
    name: "Hobby",
    price: "$0",
    text: "For side projects.",
    perks: ["1 project", "Community support", "Basic analytics"],
  },
  {
    name: "Pro",
    price: "$29",
    text: "For growing teams.",
    perks: ["Unlimited projects", "Priority support", "Advanced analytics"],
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    text: "For large organizations.",
    perks: ["SSO and SCIM", "Dedicated manager", "99.99% uptime SLA"],
  },
]

const quotes = [
  [
    "Lena Park",
    "CTO, Globex",
    "We replaced three tools with Acme and our launch cadence doubled.",
  ],
  [
    "Marcus Reid",
    "Founder, Hooli",
    "The theming alone saved our design team weeks of work.",
  ],
]

const faqs = [
  ["Can I change plans later?", "Yes, upgrade or downgrade at any time."],
  ["Is there a free trial?", "Pro comes with a 14-day free trial."],
  ["Do you offer discounts?", "Startups and nonprofits get 50% off."],
]

const heading = "font-heading font-semibold text-3xl tracking-tight"

// A landing page: hero, logos, features, pricing, testimonials, FAQ and footer.
export function Marketing() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-20 px-6 pt-12 pb-6">
      <section className="flex flex-col items-center gap-5 text-center">
        <Badge variant="outline">
          <SparklesIcon />
          New: themes for every team
        </Badge>
        <h1 className="max-w-2xl font-heading font-semibold text-5xl tracking-tight">
          Build products your customers love
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Acme gives your team one place to plan, build and launch, with
          components that look like your brand.
        </p>
        <div className="flex gap-2">
          <Button size="lg">
            Get started
            <ArrowRightIcon />
          </Button>
          <Button size="lg" variant="outline">
            Book a demo
          </Button>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4">
        <p className="text-muted-foreground text-sm">Trusted by teams at</p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 font-semibold text-lg text-muted-foreground/80">
          {logos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <div className="text-center">
          <h2 className={heading}>Everything you need</h2>
          <p className="text-muted-foreground">
            A complete toolkit that grows with you.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {features.map(([Icon, title, text]) => (
            <div key={title} className="flex flex-col gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-4" />
              </span>
              <h3 className="font-medium">{title}</h3>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-8">
        <h2 className={cn(heading, "text-center")}>Simple pricing</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={cn(plan.featured && "border-primary")}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                  {plan.featured && <Badge>Popular</Badge>}
                </CardTitle>
                <CardDescription>{plan.text}</CardDescription>
              </CardHeader>
              <CardPanel className="flex flex-col gap-4">
                <p className="font-semibold text-3xl">
                  {plan.price}
                  {plan.price.startsWith("$") && (
                    <span className="font-normal text-muted-foreground text-sm">
                      /month
                    </span>
                  )}
                </p>
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2">
                      <CheckIcon className="size-4 text-primary" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </CardPanel>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.featured ? "default" : "outline"}
                >
                  Choose {plan.name}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(18rem,1fr))] gap-4">
        {quotes.map(([name, role, quote]) => (
          <figure
            key={name}
            className="flex flex-col gap-4 rounded-xl bg-muted p-6"
          >
            <blockquote className="text-lg">“{quote}”</blockquote>
            <Person name={name} detail={role} />
          </figure>
        ))}
      </section>

      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <h2 className={cn(heading, "text-center")}>
          Frequently asked questions
        </h2>
        <Accordion>
          {faqs.map(([question, answer]) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionPanel>{answer}</AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground">
        <h2 className={heading}>Ready to get started?</h2>
        <p className="opacity-80">Join 10,000+ teams shipping with Acme.</p>
        <form className="flex w-full max-w-sm gap-2">
          <Input
            aria-label="Email"
            placeholder="you@example.com"
            className="bg-background text-foreground"
          />
          <Button variant="secondary">Subscribe</Button>
        </form>
      </section>

      <footer className="flex flex-wrap justify-between gap-4 border-t pt-6 text-muted-foreground text-sm">
        <span>© 2026 Acme Inc.</span>
        <nav className="flex gap-4">
          {["Privacy", "Terms", "Contact"].map((link) => (
            <a key={link} href="#marketing" className="hover:text-foreground">
              {link}
            </a>
          ))}
        </nav>
      </footer>
    </div>
  )
}
