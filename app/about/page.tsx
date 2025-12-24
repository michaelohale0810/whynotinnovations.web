import { LightbulbIcon } from "@/components/LightbulbIcon";

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-violet-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-violet-950/20 py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <LightbulbIcon size={112} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              About <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">WhyNot Innovations</span>
            </h1>
            <p className="mt-6 text-lg text-muted">
            A place where innovations begin as sparks—not market research, cause Why Not?
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-6 text-muted">
              <p className="text-lg">
                Why Not Innovations is a place where innovations begin as sparks—not market research, cause Why Not?
              </p>
              <p>
                We create new apps by starting with a creative insight or moment of curiosity. From that initial spark, we explore related ideas, shape them into a focused theme, and build a working MVP. If the MVP shows promise, we evolve it into a real, usable product.
              </p>
              <p>
                This site exists not just to showcase products, but to invite participation. At any stage—spark, concept, MVP, or finished product—participants can explore what&apos;s being built and share feedback. Your perspective helps guide what grows, what changes, and what moves forward.
              </p>
              <p>
                Why Not Innovations is also a home for new sparks. When inspiration strikes, participants can contribute their own ideas, adding to the ecosystem of experimentation and creation.
              </p>
              <p>
                This is a space for curiosity, iteration, and collaboration—where ideas are allowed to exist before they&apos;re &quot;proven,&quot; and innovation is shaped together.
              </p>
              <p className="text-lg font-semibold text-foreground">
                Why not try something new?
              </p>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}

