export { ClassicTemplate } from './ClassicTemplate';
export { ModernTemplate } from './ModernTemplate';
export { MinimalTemplate } from './MinimalTemplate';
export { ElegantTemplate } from './ElegantTemplate';
export { ProfessionalTemplate } from './ProfessionalTemplate';

// Template metadata for selection UI
export const INVOICE_TEMPLATES = [
    {
        id: 'classic',
        name: 'Classic',
        description: 'Traditional business invoice with blue accents',
        preview: 'Blue header with professional layout'
    },
    {
        id: 'modern',
        name: 'Modern',
        description: 'Contemporary design with green color scheme',
        preview: 'Green theme with alternating rows'
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Clean and simple black & white design',
        preview: 'Minimalist layout with essential information'
    },
    {
        id: 'elegant',
        name: 'Elegant',
        description: 'Sophisticated purple-themed invoice',
        preview: 'Purple accents with refined typography'
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'Corporate style with dark header',
        preview: 'Dark slate theme with terms & conditions'
    },
] as const;

export type TemplateId = typeof INVOICE_TEMPLATES[number]['id'];
