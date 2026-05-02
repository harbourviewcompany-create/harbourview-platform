import HeroCTAGroup from './HeroCTAGroup'

export default function HarbourviewHomePage() {
  return (
    <section className="min-h-screen bg-hv-black text-hv-offwhite flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full px-6 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
          Market access backed by <span className="text-hv-gold">intelligence and relationships.</span>
        </h1>

        <HeroCTAGroup />
      </div>
    </section>
  )
}
