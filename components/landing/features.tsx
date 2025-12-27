import { Calendar, Users, FileText, BarChart3, Clock, CreditCard } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Job Scheduling',
    description: 'Easily schedule and manage jobs with our intuitive calendar interface.',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Assign jobs to team members and track their progress in real-time.',
  },
  {
    icon: FileText,
    title: 'Invoicing & Quotes',
    description: 'Create professional invoices and quotes in minutes.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Get insights into your business performance with detailed reports.',
  },
  {
    icon: Clock,
    title: 'Time Tracking',
    description: 'Workers can clock in/out and track time spent on each job.',
  },
  {
    icon: CreditCard,
    title: 'Online Payments',
    description: 'Accept payments online with integrated payment processing.',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-20 px-6 scroll-mt-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Everything You Need</h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Powerful features to help you run your business efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border bg-white dark:bg-zinc-900 hover:shadow-lg transition-shadow"
            >
              <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

