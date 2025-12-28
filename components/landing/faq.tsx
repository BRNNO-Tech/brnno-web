'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How does the free trial work?',
    answer: 'You get 14 days of full access to all features. No credit card required. Cancel anytime.',
  },
  {
    question: 'Can I change plans later?',
    answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use bank-level encryption and security measures to protect your data.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied.',
  },
  {
    question: 'Can I import my existing data?',
    answer: 'Yes! We provide tools to help you import your clients, jobs, and other data.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 scroll-mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
          <p className="text-base sm:text-lg md:text-xl text-zinc-600 dark:text-zinc-400 px-4">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border rounded-lg bg-white dark:bg-zinc-900 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors min-h-[60px]"
              >
                <span className="font-semibold text-sm sm:text-base pr-4">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div className="px-4 sm:px-6 pb-4 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

