import HeroCTAGroup from './HeroCTAGroup'
import GlobeStage from './globe/GlobeStage'

export default function HarbourviewHomePage() {
  return (
    <section className="min-h-screen bg-hv-black text-hv-offwhite flex flex-col items-center justify-center">
      <div className="max-w-5xl w-full px-6 pt-16 pb-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
          Market access backed by <span className="text-hv-gold">intelligence and relationships.</span>
        </h1>

        <HeroCTAGroup />

        <div className="mt-14 w-full flex justify-center">
          <GlobeStage />
        </div>
      </div>
    </section>
  )
}
