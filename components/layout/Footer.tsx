// components/layout/Footer.tsx
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brown-950 text-sand-200 pt-16 pb-6">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <img src="/logo/logo-mark.svg" alt="Al-Sakhrah" className="h-10 w-auto mb-4" />
          <p className="text-sm text-sand-300 max-w-xs">
            Al-Sakhrah for Manufacturing produces household detergents at
            industrial scale for retail and wholesale partners across the
            Kingdom and GCC.
          </p>
          <div className="flex gap-3 mt-5">
            <Link href="#" aria-label="Facebook" className="p-2 bg-brown-800 rounded-lg hover:bg-olive-600 transition-colors"><Facebook size={16} /></Link>
            <Link href="#" aria-label="Instagram" className="p-2 bg-brown-800 rounded-lg hover:bg-olive-600 transition-colors"><Instagram size={16} /></Link>
            <Link href="#" aria-label="LinkedIn" className="p-2 bg-brown-800 rounded-lg hover:bg-olive-600 transition-colors"><Linkedin size={16} /></Link>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-display text-sm text-sand-50 mb-4">SHOP</h4>
          <ul className="space-y-2.5 text-sm text-sand-300">
            <li><Link href="/products" className="hover:text-olive-300">All Products</Link></li>
            <li><Link href="/category/dishwashing-liquid" className="hover:text-olive-300">Dishwashing Liquid</Link></li>
            <li><Link href="/category/laundry-powder" className="hover:text-olive-300">Laundry Powder</Link></li>
            <li><Link href="/wholesale" className="hover:text-olive-300">Wholesale Portal</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-display text-sm text-sand-50 mb-4">COMPANY</h4>
          <ul className="space-y-2.5 text-sm text-sand-300">
            <li><Link href="/about" className="hover:text-olive-300">About the Factory</Link></li>
            <li><Link href="/quality" className="hover:text-olive-300">Quality & Certifications</Link></li>
            <li><Link href="/private-label" className="hover:text-olive-300">Private Label / OEM</Link></li>
            <li><Link href="/contact" className="hover:text-olive-300">Contact</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-display text-sm text-sand-50 mb-4">CONTACT</h4>
          <ul className="space-y-3 text-sm text-sand-300">
            <li className="flex items-center gap-2"><Phone size={15} /> +966 00 000 0000</li>
            <li className="flex items-center gap-2"><Mail size={15} /> sales@al-sakhrah.com</li>
            <li className="flex items-start gap-2"><MapPin size={15} className="mt-0.5" /> Riyadh Industrial City, Saudi Arabia</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 pt-6 border-t border-brown-800 flex flex-col sm:flex-row justify-between gap-3 text-xs text-sand-400">
        <p>© {new Date().getFullYear()} Al-Sakhrah for Manufacturing. All rights reserved.</p>
        <div className="flex gap-5">
          <Link href="/privacy" className="hover:text-olive-300">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-olive-300">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}