type BoundaryNoticeProps = {
  body: string
}

export default function BoundaryNotice({ body }: BoundaryNoticeProps) {
  return (
    <section className="bg-[#030b16] py-10">
      <div className="page-container">
        <div className="rounded-sm border border-gold/12 bg-[#071425] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/76">
            Public / private boundary
          </p>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-white/62 sm:text-base">
            {body}
          </p>
        </div>
      </div>
    </section>
  )
}
