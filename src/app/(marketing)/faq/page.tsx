import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    category: 'How It Works',
    items: [
      {
        question: 'How does the video generation process work?',
        answer:
          'Simply paste an Amazon product URL or enter product details manually. Our AI analyzes the product information, generates an engaging script, and then creates a professional video automatically. You can review and edit the script before generation.',
      },
      {
        question: 'How long does it take to generate a video?',
        answer:
          'Video generation typically takes 2-5 minutes. The exact time depends on video length and complexity. You can track progress in real-time and receive notifications when your video is ready.',
      },
      {
        question: 'Can I edit the script before generating the video?',
        answer:
          'Yes! The review step allows you to edit the AI-generated script before spending credits. This gives you full control over the final output.',
      },
    ],
  },
  {
    category: 'Pricing & Credits',
    items: [
      {
        question: 'How do credits work?',
        answer:
          'Each video generation costs 1 credit. Credits never expire, so you can purchase them and use them whenever you need. No subscriptions or recurring charges.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept credit cards, PayPal, and cryptocurrency payments through our secure payment partners (Lemon Squeezy and Cryptomus).',
      },
      {
        question: 'Can I get a refund for unused credits?',
        answer:
          'Yes, we offer refunds for unused credits within 30 days of purchase. Contact our support team for assistance with refunds.',
      },
      {
        question: 'Do you offer custom pricing for high volume?',
        answer:
          'Yes, we offer custom enterprise pricing for high-volume users. Contact us to discuss your specific needs and we can create a tailored pricing plan.',
      },
    ],
  },
  {
    category: 'Video Quality & Formats',
    items: [
      {
        question: 'What video quality do you provide?',
        answer:
          'All videos are generated in HD quality, optimized for social media platforms. Videos are professional-grade and ready for marketing campaigns.',
      },
      {
        question: 'What video format do I receive?',
        answer:
          'Videos are provided in MP4 format, which is compatible with all major social media platforms and video players.',
      },
      {
        question: 'Are there watermarks on the videos?',
        answer:
          'No, all generated videos are watermark-free. You own the content and can use it for any commercial or personal purpose.',
      },
    ],
  },
  {
    category: 'Account & Billing',
    items: [
      {
        question: 'Do I need to create an account?',
        answer:
          'Yes, you need to create a free account to generate videos. This allows us to track your credits, save your videos, and provide you with a library of all your generated content.',
      },
      {
        question: 'Can I download my videos multiple times?',
        answer:
          'Yes, once a video is generated, you can download it as many times as you need. All your videos are stored in your library for easy access.',
      },
      {
        question: 'What happens if a video generation fails?',
        answer:
          'If a video generation fails, your credit is automatically refunded. You can retry the generation without any additional cost.',
      },
    ],
  },
  {
    category: 'Technical Support',
    items: [
      {
        question: 'What if I encounter technical issues?',
        answer:
          'Contact our support team at support@afpugc.com. We typically respond within 24 hours and are committed to resolving any issues you encounter.',
      },
      {
        question: 'Which Amazon marketplaces are supported?',
        answer:
          'We currently support all major Amazon marketplaces including Amazon.com, Amazon.co.uk, Amazon.de, and more. If you encounter issues with a specific marketplace, please contact support.',
      },
      {
        question: 'Can I use videos for commercial purposes?',
        answer:
          'Yes, all videos generated through our platform can be used for commercial purposes, including marketing campaigns, social media, and advertising.',
      },
    ],
  },
]

export const metadata = {
  title: 'FAQ | AFP UGC',
  description: 'Frequently asked questions about our AI-powered video generation platform',
}

export default function FAQPage() {
  return (
    <div className="min-h-screen px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Find answers to common questions about our platform
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="mt-16 space-y-12">
          {faqs.map((category) => (
            <div key={category.category}>
              <h2 className="mb-6 text-2xl font-semibold text-white">{category.category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${category.category}-${index}`}>
                    <AccordionTrigger className="text-left text-white hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-16 border-t border-border pt-12 text-center">
          <h2 className="text-2xl font-semibold text-white">Still have questions?</h2>
          <p className="mt-4 text-muted-foreground">
            Can&apos;t find the answer you&apos;re looking for? Contact our support team.
          </p>
          <div className="mt-6">
            <Link href="/contact">
              <Button size="lg" className="bg-[#6366F1] hover:bg-[#6366F1]/90">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

