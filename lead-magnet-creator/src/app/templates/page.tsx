import { TemplateGallery } from '@/components/templates/template-gallery'

export const metadata = {
  title: 'Templates - Lead Magnet Creator',
  description: 'Browse our library of professional lead magnet templates. Choose from eBooks, checklists, guides, and more.',
}

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Professional Templates
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose from our library of professionally designed templates. 
            Customize colors, fonts, and content to match your brand.
          </p>
        </div>
        
        <TemplateGallery />
      </div>
    </div>
  )
}