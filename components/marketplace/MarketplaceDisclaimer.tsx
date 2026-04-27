export function MarketplaceDisclaimer() {
  return (
    <div
      style={{
        backgroundColor: 'rgba(198,165,90,0.08)',
        border: '1px solid rgba(198,165,90,0.2)',
        borderRadius: '2px',
        padding: '14px 20px',
        marginBottom: '32px',
      }}
    >
      <p
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '12px',
          lineHeight: '1.6',
          color: '#C9C2B3',
          margin: 0,
        }}
      >
        <strong style={{ color: '#C6A55A' }}>Marketplace Disclaimer:</strong>{' '}
        Harbourview operates a controlled-introduction model. Listings are curated and anonymised.
        Counterparty identities, legal entity names, and contact details are never disclosed without
        Harbourview review and mutual consent. All inquiries are received by Harbourview first.
        This is not a direct buyer-seller platform. Harbourview does not guarantee the accuracy of
        third-party listing data and does not provide legal, regulatory, or financial advice.
      </p>
    </div>
  )
}
