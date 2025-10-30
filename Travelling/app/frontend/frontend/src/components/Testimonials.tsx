import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

export default function Testimonials() {
  const containerRef = useRef(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.2 })
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0)

  const testimonials = [
    {
      id: 1,
      name: 'Priya Sharma',
      avatar: 'https://i.pravatar.cc/150?img=1',
      feedback: 'Amazing experience! The booking process was seamless and the destinations were breathtaking. Highly recommended!',
      rating: 5
    },
    {
      id: 2,
      name: 'Rajesh Kumar',
      avatar: 'https://i.pravatar.cc/150?img=3',
      feedback: "Best travel platform I've used. Real-time images and instant bookings made planning so easy!",
      rating: 5
    },
    {
      id: 3,
      name: 'Ananya Patel',
      avatar: 'https://i.pravatar.cc/150?img=5',
      feedback: 'Discovered hidden gems across India. The variety and competitive pricing is unbeatable!',
      rating: 5
    }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section 
      id="testimonials" 
      ref={containerRef} 
      className="relative py-20 md:py-32 px-6 overflow-hidden"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=2000&h=1200&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'scroll'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#0e1512]/85 via-[#0e1512]/80 to-[#0e1512]/85 pointer-events-none" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent">
              What Travelers Say
            </span>
          </motion.h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Join thousands of satisfied travelers who discovered amazing experiences with us
          </p>
        </motion.div>

        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ y: 40, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.03, y: -5 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-6 hover:border-white/20 hover:shadow-xl transition-all duration-300"
            >
              <div className="absolute top-4 right-4 text-white/10 text-5xl font-serif">"</div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>

              <p className="text-white/80 mb-6 leading-relaxed relative z-10">
                {testimonial.feedback}
              </p>

              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full border-2 border-white/20"
                  loading="lazy"
                />
                <div>
                  <div className="font-semibold text-white">{testimonial.name}</div>
                  <div className="text-sm text-white/60 flex items-center gap-1">
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified Traveler
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="md:hidden relative">
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonialIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/10 p-6">
                  <div className="absolute top-4 right-4 text-white/10 text-5xl font-serif">"</div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonials[currentTestimonialIndex].rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-white/80 mb-6 leading-relaxed">{testimonials[currentTestimonialIndex].feedback}</p>
                  <div className="flex items-center gap-3">
                    <img src={testimonials[currentTestimonialIndex].avatar} alt={testimonials[currentTestimonialIndex].name} className="w-12 h-12 rounded-full border-2 border-white/20" loading="lazy" />
                    <div>
                      <div className="font-semibold text-white">{testimonials[currentTestimonialIndex].name}</div>
                      <div className="text-sm text-white/60">Verified Traveler</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonialIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentTestimonialIndex ? 'bg-blue-500 w-8' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

