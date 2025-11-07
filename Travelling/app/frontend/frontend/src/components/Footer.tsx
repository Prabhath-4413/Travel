import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";

export default function Footer() {
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: false, amount: 0.2 });

  const footerLinks = {
    company: [
      { label: "About Us", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Blog", href: "#" },
    ],
    support: [
      { label: "Help Center", href: "#" },
      { label: "Contact Us", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
    destinations: [
      { label: "Popular Places", href: "#" },
      { label: "New Destinations", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Travel Tips", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer
      ref={footerRef}
      className="relative bg-[#0a0f0c] border-t border-white/10 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
              },
            },
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
            }}
            className="lg:col-span-2"
          >
            <p className="text-white/70 mb-6 leading-relaxed">
              Discover and book amazing travel experiences across India. From
              beaches to mountains, your next adventure awaits.
            </p>

            <div className="space-y-3">
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <Mail className="w-5 h-5 text-blue-400" />
                <span>hello@suitsavvy.com</span>
              </motion.div>
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <Phone className="w-5 h-5 text-blue-400" />
                <span>+91 9876543210 TRAVEL</span>
              </motion.div>
              <motion.div
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <MapPin className="w-5 h-5 text-blue-400" />
                <span>Mumbai, India</span>
              </motion.div>
            </div>
          </motion.div>

          {Object.entries(footerLinks).map(([key, links]) => (
            <motion.div
              key={key}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-white mb-6 capitalize">
                {key}
              </h3>
              {links.map((link) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  whileHover={{ x: 5 }}
                  className="block text-white/70 hover:text-white transition-colors text-sm"
                >
                  {link.label}
                </motion.a>
              ))}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, delay: 0.5 },
            },
          }}
          className="border-t border-white/10 pt-12"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-white/70 text-sm mb-4">
                Get the latest travel deals and destination guides
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all text-sm"
                >
                  Subscribe
                </motion.button>
              </div>
            </div>

            <div className="md:text-right">
              <h3 className="text-lg font-bold text-white mb-4">Follow Us</h3>
              <p className="text-white/70 text-sm mb-4">
                Connect with us on social media
              </p>
              <div className="flex gap-4 md:justify-end">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <motion.a
                    key={label}
                    href={href}
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-blue-500/20 hover:border-blue-500/50 transition-all"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white/60 text-sm">
            <div className="flex items-center gap-4">
              <span>© 2024 SuiteSavvy. All rights reserved.</span>
            </div>

            <div className="flex items-center gap-6">
              <motion.a
                href="#"
                whileHover={{ color: "#fff" }}
                className="text-white/60 hover:text-white transition-colors"
              >
                Privacy Policy
              </motion.a>
              <div className="w-px h-4 bg-white/20" />
              <motion.a
                href="#"
                whileHover={{ color: "#fff" }}
                className="text-white/60 hover:text-white transition-colors"
              >
                Terms of Service
              </motion.a>
              <div className="w-px h-4 bg-white/20" />
              <motion.a
                href="#"
                whileHover={{ color: "#fff" }}
                className="text-white/60 hover:text-white transition-colors"
              >
                Cookie Settings
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
