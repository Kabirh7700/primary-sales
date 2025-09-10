import React from 'react';
import type { Contact } from '../types';
import { WebsiteIcon, LinkedInIcon, WhatsAppIcon, EmailIcon, FacebookIcon, InstagramIcon } from './icons';

interface SocialLinksProps {
    contact: Contact;
    type: 'company' | 'person';
    onOpenWhatsAppModal: (contact: Contact) => void;
    onLogSocialClick: (contact: Contact, action:string, details: string) => void;
}

const ensureUrlScheme = (url: string) => (!url.startsWith('http://') && !url.startsWith('https://')) ? `https://${url}` : url;

export const SocialLinks: React.FC<SocialLinksProps> = ({ contact, type, onOpenWhatsAppModal, onLogSocialClick }) => {
    
    const handleCompanyLinkClick = (e: React.MouseEvent, action: string, url: string) => {
        e.stopPropagation();
        onLogSocialClick(contact, `Clicked ${action}`, `URL: ${url}`);
        window.open(ensureUrlScheme(url), '_blank');
    };

    const renderPersonLinks = () => (
        <div className="flex items-center space-x-3 text-gray-500">
            {contact.number && (
                 <button onClick={(e) => { e.stopPropagation(); onOpenWhatsAppModal(contact); }} title={`WhatsApp: ${contact.number}`} className="transform transition-transform hover:scale-110">
                    <WhatsAppIcon />
                </button>
            )}
            {contact.email && (
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onLogSocialClick(contact, 'Intro Email', `Email client opened for: ${contact.email}`);
                        window.location.href = `mailto:${contact.email}`;
                    }}
                    title={contact.email}
                    className="hover:text-gray-900 transition-colors"
                >
                    <EmailIcon />
                </button>
            )}
            {contact.personLinkedinPage && (
                 <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onLogSocialClick(contact, 'LinkedIn', 'Visited Person LinkedIn page.');
                        window.open(ensureUrlScheme(contact.personLinkedinPage!), '_blank');
                    }}
                    title={`Person LinkedIn: ${contact.personLinkedinPage}`}
                    className="hover:text-gray-900 transition-colors"
                >
                    <LinkedInIcon />
                </button>
            )}
        </div>
    );
    
    const renderCompanyLinks = () => (
         <div className="flex items-center space-x-3 text-gray-500">
            {contact.website && (
                <button onClick={(e) => handleCompanyLinkClick(e, 'Website', contact.website!)} title={`Company Website: ${contact.website}`} className="hover:text-gray-900 transition-colors">
                    <WebsiteIcon />
                </button>
            )}
             {contact.companyLinkedinPage && (
                <button onClick={(e) => handleCompanyLinkClick(e, 'Company LinkedIn', contact.companyLinkedinPage!)} title={`Company LinkedIn: ${contact.companyLinkedinPage}`} className="hover:text-gray-900 transition-colors">
                    <LinkedInIcon />
                </button>
            )}
            {contact.facebook && (
                 <button onClick={(e) => handleCompanyLinkClick(e, 'Facebook', contact.facebook!)} title={`Facebook: ${contact.facebook}`} className="hover:text-gray-900 transition-colors">
                    <FacebookIcon />
                </button>
            )}
            {contact.instagram && (
                 <button onClick={(e) => handleCompanyLinkClick(e, 'Instagram', contact.instagram!)} title={`Instagram: ${contact.instagram}`} className="hover:text-gray-900 transition-colors">
                    <InstagramIcon />
                </button>
            )}
        </div>
    );
    
    return type === 'person' ? renderPersonLinks() : renderCompanyLinks();
};