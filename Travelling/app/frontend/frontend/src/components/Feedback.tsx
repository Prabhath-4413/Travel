import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { feedbackAPI, type Feedback as FeedbackType } from '../lib/api'
import { Star, Send } from 'lucide-react'

export default function Feedback() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    rating: 0
  })
  const [recentFeedbacks, setRecentFeedbacks] = useState<FeedbackType[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingFeedbacks, setFetchingFeedbacks] = useState(true)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    fetchRecentFeedbacks()
  }, [])

  const fetchRecentFeedbacks = async () => {
    try {
      setFetchingFeedbacks(true)
      const feedbacks = await feedbackAPI.getRecent(5)
      setRecentFeedbacks(feedbacks)
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      toast.error('Failed to load feedbacks')
    } finally {
      setFetchingFeedbacks(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({
      ...prev,
      rating
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!formData.message.trim()) {
      toast.error('Please enter your feedback message')
      return
    }

    if (formData.rating === 0) {
      toast.error('Please select a rating')
      return
    }

    try {
      setLoading(true)
      await feedbackAPI.submit({
        name: formData.name || undefined,
        email: formData.email || undefined,
        message: formData.message.trim(),
        rating: formData.rating
      })

      toast.success('Thank you for your feedback!')
      setFormData({ name: '', email: '', message: '', rating: 0 })
      await fetchRecentFeedbacks()
    } catch (error: any) {
      console.error('Error submitting feedback:', error)
      const errorMessage = error?.response?.data?.message || 'Failed to submit feedback'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Share Your Feedback</h2>
        <p className="text-gray-300">Help us improve by sharing your experience</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feedback Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-200 mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                maxLength={100}
                placeholder="Your name"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white/20 transition"
              />
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Email (Optional)
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                maxLength={100}
                placeholder="your.email@example.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white/20 transition"
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-200 mb-2">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                maxLength={1000}
                placeholder="Tell us what you think about our service..."
                rows={4}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white/20 transition resize-none"
              />
              <div className="text-xs text-gray-400 mt-1">
                {formData.message.length}/1000
              </div>
            </div>

            {/* Rating Field */}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-3">
                Rating <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${
                        (hoverRating || formData.rating) >= star
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-white/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {formData.rating > 0 && (
                <p className="text-sm text-gray-300 mt-2">
                  You rated: <span className="text-yellow-400 font-semibold">{formData.rating} out of 5 stars</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>

        {/* Recent Feedbacks */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-white mb-4">Recent Feedback</h3>
            
            {fetchingFeedbacks ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse h-24" />
                ))}
              </div>
            ) : recentFeedbacks.length > 0 ? (
              <AnimatePresence>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentFeedbacks.map((feedback, index) => (
                    <motion.div
                      key={feedback.feedbackId || feedback.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 hover:bg-white/10 transition"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white">
                          {feedback.name || 'Anonymous'}
                        </p>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < feedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {feedback.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            ) : (
              <p className="text-center text-gray-400 text-sm py-8">
                No feedback yet. Be the first to share!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
