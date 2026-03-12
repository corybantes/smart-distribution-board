import { CheckCircle2 } from "lucide-react";

export default function AboutBody() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-16 border-b border-slate-200 dark:border-slate-800">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Operational Modes
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
          SmartDB adapts its software logic based on the specific needs of the
          housing environment.
        </p>
      </div>

      <div className="space-y-16">
        {/* MODE 1 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Multi-User Mode
            </h3>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wide">
              For Co-Rentals
            </p>
          </div>
          <div className="md:col-span-8 space-y-6">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The SmartDB acts as a cluster of independent, virtual prepaid
              meters. It assigns specific physical outlets to specific tenants,
              completely eliminating the need to guess who used what.
            </p>
            <ul className="space-y-4 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Digital Wallets:</strong> Each tenant maintains their
                  own prepaid balance via the web dashboard.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Predictive Billing:</strong> A 3-Month Weighted Moving
                  Average forecasts future bills to help tenants budget
                  intelligently.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Fair Usage Limits:</strong> Strict 2500W hardware
                  limits per outlet prevent heavy users from compromising the
                  building's main supply.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* MODE 2 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Single-User Mode
            </h3>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
              For Smart Homes
            </p>
          </div>
          <div className="md:col-span-8 space-y-6">
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Designed for individual households running on limited power
              supplies (like small generators or solar inverters). Instead of
              financial billing, this mode focuses entirely on intelligent load
              shedding to prevent system collapse.
            </p>
            <ul className="space-y-4 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Priority Logic:</strong> Appliances are assigned
                  priority levels (e.g., HVAC is Low, Refrigerator is High).
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-slate-400 shrink-0" />
                <span>
                  <strong>Dynamic Shedding:</strong> If total consumption nears
                  the grid's maximum limit, the board automatically shuts down
                  low-priority loads.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
