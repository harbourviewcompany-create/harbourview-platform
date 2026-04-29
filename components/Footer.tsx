import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-navy text-gray-300 mt-auto">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <p className="text-gold font-bold text-lg mb-2">Harbourview</p>
            <p className="text-sm text-gray-400 max-w-xs">
              A professional marketplace for the regulated cannabis industry.
              Equipment, inventory, services, and business opportunities.
            </p>
          </div>

          {/* Marketplace */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Marketplace</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/marketplace/new-products" className="hover:text-gold transition-colors">New Products</Link></li>
              <li><Link href="/marketplace/used-surplus" className="hover:text-gold transition-colors">Used &amp; Surplus</Link></li>
              <li><Link href="/marketplace/cannabis-inventory" className="hover:text-gold transition-colors">Cannabis Inventory</Link></li>
              <li><Link href="/marketplace/wanted-requests" className="hover:text-gold transition-colors">Wanted Requests</Link></li>
              <li><Link href="/marketplace/services" className="hover:text-gold transition-colors">Services</Link></li>
              <li><Link href="/marketplace/business-opportunities" className="hover:text-gold transition-colors">Business Opportunities</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white font-semibold text-sm mb-3">Company</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/supplier-directory" className="hover:text-gold transition-colors">Supplier Directory</Link></li>
              <li><Link href="/intake" className="hover:text-gold transition-colors">Submit a Listing</Link></li>
              <li><Link href="/contact" className="hover:text-gold transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-light mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Harbourview. All rights reserved.</p>
          <p>B2B cannabis industry marketplace. For licensed operators only.</p>
        </div>
      </div>
    </footer>
  )
}
