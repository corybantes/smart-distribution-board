export default function AboutHero() {
  return (
    <section className="max-w-3xl mx-auto pt-16 md:pt-24 px-4 border-b border-slate-200 dark:border-slate-800 pb-16">
      <div className="space-y-8">
        <div>
          <h1 className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-4">
            About the Project
          </h1>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.2]">
            Rethinking how residential energy is distributed and measured.
          </h2>
        </div>

        <div className="space-y-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            For decades, traditional electrical distribution boards have
            remained entirely passive. They route power and trip during
            catastrophic short circuits, but they provide zero visibility into
            how energy is actually consumed within a home.
          </p>
          <p>
            In co-living rental apartments, this blind spot creates severe
            friction. Because traditional meters only measure aggregate building
            consumption, landlords are forced to divide utility bills evenly
            among tenants. This inherently penalizes low-energy users while
            masking the heavy consumption of others. Furthermore, because
            tenants are unaware of their hardware's physical limits, circuits
            are frequently overloaded, leading to sudden power outages and
            severe thermal fire hazards.
          </p>
          <p className="font-medium text-slate-900 dark:text-slate-200">
            EnerGenius was built to solve this. The SmartDB transforms the
            traditional electrical panel into an active, IoT-enabled management
            system engineered for fairness and safety.
          </p>
        </div>
      </div>
    </section>
  );
}
