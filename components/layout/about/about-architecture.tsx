export default function AboutArchitecture() {
  return (
    <section className="max-w-4xl mx-auto px-4 py-16 pb-24">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Technical Architecture
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
          A seamless, fault-tolerant pipeline from physical voltage sensing to
          cloud-based predictive analytics.
        </p>
      </div>

      <div className="space-y-12">
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="text-5xl md:text-6xl font-black text-slate-200 dark:text-slate-800 leading-none">
            01
          </div>
          <div className="space-y-3 mt-1 md:mt-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Hardware & Sensing
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              At the edge, we utilize an ATmega328P microcontroller paired with
              an ADS1115 16-bit ADC to process high-resolution analog data from
              ZMPT101B voltage and ACS712 current sensors. If the internal
              temperature exceeds 50°C, or a user surpasses their 2500W limit,
              the hardware instantly triggers local 40A Solid-State Relays to
              cut power.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="text-5xl md:text-6xl font-black text-slate-200 dark:text-slate-800 leading-none">
            02
          </div>
          <div className="space-y-3 mt-1 md:mt-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              The IoT Gateway
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Processed telemetry is passed via UART to an ESP32-WROOM module.
              The ESP32 handles secure Wi-Fi routing, synchronizing telemetry to
              the Google Firebase Realtime Database. In the event of network
              failure, the ESP32 buffers data locally and pushes the backlog
              once connectivity is restored.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="text-5xl md:text-6xl font-black text-slate-200 dark:text-slate-800 leading-none">
            03
          </div>
          <div className="space-y-3 mt-1 md:mt-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Web Application
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The user-facing platform is a highly responsive Next.js
              application. Automated background cron jobs continuously check
              user wallet balances against live kWh usage to execute remote
              switching, while a Weighted Moving Average algorithm generates
              expected future bills based on historical data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
