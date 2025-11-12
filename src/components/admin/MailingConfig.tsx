import { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: 'customer_confirmation' | 'admin_notification';
  content: {
    greeting: string;
    mainMessage: string;
    companyInfo: string;
    footer: string;
  };
  styling: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
}

const MailingConfig: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      // Laad bestaande templates uit Firestore of gebruik defaults
      const defaultTemplates: EmailTemplate[] = [
        {
          id: 'customer_confirmation',
          name: 'Klant Bevestiging',
          subject: '✓ Uw reservering voor Inspiration Point is bevestigd!',
          type: 'customer_confirmation',
          content: {
            greeting: 'Beste {CUSTOMER_NAME},',
            mainMessage: 'Hartelijk dank voor uw reservering bij Inspiration Point! We kijken ernaar uit u te verwelkomen voor een onvergetelijke theaterervaring. Hieronder vindt u alle details van uw boeking. Bewaar deze e-mail goed.',
            companyInfo: 'Inspiration Point\nWaardseweg 69, 3421 NE, Oudewater',
            footer: 'Voor vragen of wijzigingen, antwoord op deze e-mail of bel ons op +31 12 345 67 89.'
          },
          styling: {
            primaryColor: '#D4AF37',
            secondaryColor: '#1F2937',
            logoUrl: 'https://i.imgur.com/o1n1p3T.png'
          }
        },
        {
          id: 'admin_notification',
          name: 'Admin Notificatie',
          subject: 'Nieuwe Reservering - {RESERVATION_ID} - {EVENT_DATE}',
          type: 'admin_notification',
          content: {
            greeting: 'NIEUWE RESERVERING ONTVANGEN',
            mainMessage: 'Hieronder vindt u alle gegevens van de nieuwe reservering. Deze gegevens kunnen direct worden geïmporteerd in het reserveringssysteem.',
            companyInfo: 'Inspiration Point - Reserveringssysteem',
            footer: 'Deze e-mail is automatisch gegenereerd door het online reserveringssysteem.'
          },
          styling: {
            primaryColor: '#000000',
            secondaryColor: '#333333',
            logoUrl: ''
          }
        }
      ];
      
      setTemplates(defaultTemplates);
      
      // Probeer om bestaande templates te laden
      const savedTemplates = await storageService.getEmailTemplates();
      if (savedTemplates && savedTemplates.length > 0) {
        setTemplates(savedTemplates);
      }
    } catch (error) {
      console.error('Error loading email templates:', error);
    }
  };

  const saveTemplate = async (template: EmailTemplate) => {
    try {
      const updatedTemplates = templates.map(t => 
        t.id === template.id ? template : t
      );
      
      setTemplates(updatedTemplates);
      await storageService.saveEmailTemplates(updatedTemplates);
      
      setIsEditing(false);
      alert('Email template succesvol opgeslagen!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Fout bij opslaan van template');
    }
  };

  const generatePreview = (template: EmailTemplate) => {
    const sampleData = {
      RESERVATION_ID: 'IP-C5B3A1',
      EVENT_DATE: '25-09-2025',
      EVENT_TIME: '19:30',
      SALUTATION: 'Mevr',
      CUSTOMER_NAME: 'Wendy Daamen',
      COMPANY_NAME: 'Wenzorg',
      ADDRESS: 'Ericapad',
      HOUSE_NUMBER: '11',
      POSTAL_CODE: '5552RP',
      CITY: 'Valkenswaard',
      PHONE: '0616220264',
      EMAIL: 'Wenzorg@outlook.com',
      PERSONS: '2',
      ARRANGEMENT: '€70,00 BWF p.p.',
      CELEBRATION: 'Verjaardag',
      DIETARY_WISHES: '1x Vegetarisch',
      INVOICE_ADDRESS: 'Afwijkend factuuradres: Bedrijfslaan 1, 1234AB Amsterdam',
      MERCHANDISE: '2x Wijn (€15,00), 1x Kaas (€8,50)',
      NOTES: 'Met cadeaubon in ruil van de sleutel ??',
      NEWSLETTER: 'Nee',
      TERMS_ACCEPTED: 'Ja',
      TOTAL_PRICE: '€140,00'
    };

    const renderMessage = (msg: string) => {
      let processedMsg = msg;
      Object.entries(sampleData).forEach(([key, value]) => {
        processedMsg = processedMsg.replace(new RegExp(`{${key}}`, 'g'), value);
      });
      return processedMsg.replace(/\n/g, '<br>');
    };
    
    const subject = renderMessage(template.subject);

    // Check if this is the admin notification
    if (template.type === 'admin_notification') {
      // Simpele admin e-mail zonder opsmuk
      return `
        <!DOCTYPE html>
        <html lang="nl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 20px;
              background-color: #f4f4f4;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              padding: 20px;
            }
            h2 {
              color: #000;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .data-line {
              margin: 8px 0;
              padding: 5px 0;
              font-size: 14px;
            }
            .data-line strong {
              display: inline-block;
              width: 180px;
              color: #000;
            }
            .section-divider {
              border-top: 1px solid #ddd;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              margin: 20px 0;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <h2>${subject}</h2>
            
            <div class="data-line"><strong>Datum:</strong> ${sampleData.EVENT_DATE}</div>
            <div class="data-line"><strong>Tijd:</strong> ${sampleData.EVENT_TIME}</div>
            <div class="data-line"><strong>Bedrijfsnaam:</strong> ${sampleData.COMPANY_NAME}</div>
            <div class="data-line"><strong>Aanhef:</strong> ${sampleData.SALUTATION}</div>
            <div class="data-line"><strong>Naam:</strong> ${sampleData.CUSTOMER_NAME}</div>
            <div class="data-line"><strong>Adres:</strong> ${sampleData.ADDRESS}</div>
            <div class="data-line"><strong>Huisnummer:</strong> ${sampleData.HOUSE_NUMBER}</div>
            <div class="data-line"><strong>Postcode:</strong> ${sampleData.POSTAL_CODE}</div>
            <div class="data-line"><strong>Plaats:</strong> ${sampleData.CITY}</div>
            <div class="data-line"><strong>Telefoon:</strong> ${sampleData.PHONE}</div>
            <div class="data-line"><strong>Email:</strong> ${sampleData.EMAIL}</div>
            
            <div class="section-divider"></div>
            
            <div class="data-line"><strong>Aantal personen:</strong> ${sampleData.PERSONS}</div>
            <div class="data-line"><strong>Gekozen arrangement:</strong> ${sampleData.ARRANGEMENT}</div>
            
            <div class="section-divider"></div>
            
            <div class="data-line"><strong>Opmerkingen:</strong></div>
            <div style="margin-left: 20px; margin-top: 10px;">
              ${sampleData.CELEBRATION ? `<div>Viering: ${sampleData.CELEBRATION}</div>` : ''}
              ${sampleData.DIETARY_WISHES ? `<div>Dieetwensen: ${sampleData.DIETARY_WISHES}</div>` : ''}
              ${sampleData.INVOICE_ADDRESS ? `<div>${sampleData.INVOICE_ADDRESS}</div>` : ''}
              ${sampleData.MERCHANDISE ? `<div>Merchandise: ${sampleData.MERCHANDISE}</div>` : ''}
              ${sampleData.NOTES ? `<div>Extra opmerkingen: ${sampleData.NOTES}</div>` : ''}
            </div>
            
            <div class="section-divider"></div>
            
            <div class="data-line"><strong>Nieuwsbrief:</strong> ${sampleData.NEWSLETTER}</div>
            <div class="data-line"><strong>Algemene voorwaarden gelezen:</strong> ${sampleData.TERMS_ACCEPTED}</div>
            
            <div style="margin-top: 20px;">
              <a href="https://dinner-theater-booking.web.app/admin" class="button">Open in Admin Dashboard</a>
            </div>
            
            <div class="footer">
              ${renderMessage(template.content.footer)}
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Voor klant e-mails: gebruik de mooie opmaak
    const logoUrl = template.styling.logoUrl || 'https://i.imgur.com/o1n1p3T.png';
    
    return `
      <!DOCTYPE html>
      <html lang="nl" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="x-apple-disable-message-reformatting">
        <title>${subject}</title>
        <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          @media (prefers-color-scheme: dark) {
            body, .email-bg { background-color: #111827 !important; }
            .email-container, .content-card { background-color: #1F2937 !important; border-color: #4B5563 !important; }
            h1, h2, h3, p, li, .greeting, .message, .details-title, .detail-item strong { color: #F9FAFB !important; }
            .detail-item span, .footer-text, .preheader { color: #D1D5DB !important; }
            .header { background-color: #1F2937 !important; }
            .details-card { background-color: #374151 !important; border-color: #4B5563 !important; }
            .button-link { background-color: ${template.styling.primaryColor} !important; color: #ffffff !important; }
            hr { border-color: #4B5563 !important; }
          }
          [data-ogsc] .email-bg { background-color: #111827 !important; }
          [data-ogsc] .email-container, [data-ogsc] .content-card { background-color: #1F2937 !important; border-color: #4B5563 !important; }
          [data-ogsc] h1, [data-ogsc] h2, [data-ogsc] h3, [data-ogsc] p, [data-ogsc] li, [data-ogsc] .greeting, [data-ogsc] .message, [data-ogsc] .details-title, [data-ogsc] .detail-item strong { color: #F9FAFB !important; }
          [data-ogsc] .detail-item span, [data-ogsc] .footer-text, [data-ogsc] .preheader { color: #D1D5DB !important; }
          [data-ogsc] .header { background-color: #1F2937 !important; }
          [data-ogsc] .details-card { background-color: #374151 !important; border-color: #4B5563 !important; }
          [data-ogsc] .button-link { background-color: ${template.styling.primaryColor} !important; color: #ffffff !important; }
          [data-ogsc] hr { border-color: #4B5563 !important; }
        </style>
      </head>
      <body style="margin: 0; padding: 0; width: 100%; word-spacing: normal; background-color: #F3F4F6;" class="email-bg">
        <div role="article" aria-roledescription="email" lang="nl" style="font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="display: none; max-height: 0; overflow: hidden;" class="preheader">
            ${renderMessage(template.content.mainMessage.split('.')[0])}
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td align="center" style="padding: 20px;" class="email-bg">
                <table class="email-container" width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td class="header" style="padding: 24px; text-align: center; border-bottom: 1px solid #E5E7EB;">
                      <img src="${logoUrl}" alt="Inspiration Point Logo" width="180" style="max-width: 180px; height: auto; border: 0;">
                    </td>
                  </tr>
                  <!-- Main Content -->
                  <tr>
                    <td class="content-card" style="padding: 32px;">
                      <h1 style="font-size: 24px; font-weight: 700; color: #111827; margin-top: 0; margin-bottom: 16px;">${subject}</h1>
                      <p class="greeting" style="font-size: 16px; color: #374151; margin-bottom: 24px;">${renderMessage(template.content.greeting)}</p>
                      <p class="message" style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 24px;">${renderMessage(template.content.mainMessage)}</p>
                      
                      <!-- Reservation Details Card -->
                      <table class="details-card" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 24px;">
                        <tr>
                          <td class="details-title" style="font-size: 18px; font-weight: 600; color: #111827; padding-bottom: 16px; border-bottom: 1px solid #E5E7EB;">
                            📋 Reservering Details
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-top: 16px;">
                            <p class="detail-item" style="margin: 0 0 12px 0; font-size: 14px;">
                              <strong style="color: #111827; min-width: 120px; display: inline-block;">Reservering ID:</strong> <span style="color: #4B5563;">${sampleData.RESERVATION_ID}</span>
                            </p>
                            <p class="detail-item" style="margin: 0 0 12px 0; font-size: 14px;">
                              <strong style="color: #111827; min-width: 120px; display: inline-block;">Datum & Tijd:</strong> <span style="color: #4B5563;">${sampleData.EVENT_DATE} om ${sampleData.EVENT_TIME}</span>
                            </p>
                            <p class="detail-item" style="margin: 0 0 12px 0; font-size: 14px;">
                              <strong style="color: #111827; min-width: 120px; display: inline-block;">Arrangement:</strong> <span style="color: #4B5563;">${sampleData.ARRANGEMENT}</span>
                            </p>
                            <p class="detail-item" style="margin: 0 0 12px 0; font-size: 14px;">
                              <strong style="color: #111827; min-width: 120px; display: inline-block;">Aantal Personen:</strong> <span style="color: #4B5563;">${sampleData.PERSONS}</span>
                            </p>
                            <p class="detail-item" style="margin: 0 0 12px 0; font-size: 14px;">
                              <strong style="color: #111827; min-width: 120px; display: inline-block;">Totaalprijs:</strong> <span style="color: #4B5563; font-weight: 700;">${sampleData.TOTAL_PRICE}</span>
                            </p>
                          </td>
                        </tr>
                      </table>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding-top: 32px;">
                        <tr>
                          <td align="center">
                            <a href="https://dinner-theater-booking.web.app" target="_blank" class="button-link" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; background-color: ${template.styling.primaryColor}; border-radius: 8px; text-decoration: none;">
                              Beheer uw reservering
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 32px; text-align: center;">
                      <hr style="border: none; border-top: 1px solid #E5E7EB; margin-bottom: 24px;">
                      <p class="footer-text" style="font-size: 14px; color: #6B7280; margin: 0 0 8px 0;">${renderMessage(template.content.companyInfo)}</p>
                      <p class="footer-text" style="font-size: 14px; color: #6B7280; margin: 0;">${renderMessage(template.content.footer)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="mailing-config p-4 md:p-6 bg-neutral-900 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📧 Email Template Configuratie</h2>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          {previewMode ? '✏️ Bewerkmodus' : '👁️ Preview'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-800 rounded-lg border border-neutral-700">
            <div className="p-4 border-b border-neutral-700">
              <h3 className="font-semibold">Email Templates</h3>
            </div>
            <div className="p-2">
              {templates.map(template => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(false);
                  }}
                  className={`w-full p-3 text-left rounded-lg mb-2 transition-colors border-2 ${
                    selectedTemplate?.id === template.id
                      ? 'bg-neutral-700/50 border-gold-500'
                      : 'bg-neutral-800/50 hover:bg-neutral-700/50 border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm text-neutral-100">{template.name}</div>
                  <div className="text-xs text-neutral-400 mt-1 truncate">{template.subject}</div>
                  <div className="flex items-center mt-2">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: template.styling.primaryColor }}
                    ></div>
                    <span className="text-xs text-neutral-500 capitalize">
                      {template.type.replace('_', ' ')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Editor/Preview */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-neutral-800 rounded-lg border border-neutral-700">
              <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                <h3 className="font-semibold">
                  {previewMode ? '👁️ Preview' : '✏️ Bewerk'}: {selectedTemplate.name}
                </h3>
                {!previewMode && (
                  <button
                    onClick={() => isEditing ? saveTemplate(selectedTemplate) : setIsEditing(true)}
                    className={`px-4 py-2 rounded-lg transition-colors text-white font-semibold ${
                      isEditing 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isEditing ? '💾 Opslaan' : '✏️ Bewerken'}
                  </button>
                )}
              </div>

              <div className="p-4">
                {previewMode ? (
                  /* Preview Mode */
                  <div className="border border-neutral-700 rounded-lg bg-neutral-900">
                    <iframe 
                      srcDoc={generatePreview(selectedTemplate)}
                      className="w-full h-[600px] rounded-lg"
                      title="Email Preview"
                    />
                  </div>
                ) : isEditing ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Onderwerp
                      </label>
                      <input
                        type="text"
                        value={selectedTemplate.subject}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          subject: e.target.value
                        })}
                        className="w-full p-3 bg-neutral-900 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Begroeting
                      </label>
                      <input
                        type="text"
                        value={selectedTemplate.content.greeting}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          content: { ...selectedTemplate.content, greeting: e.target.value }
                        })}
                        className="w-full p-3 bg-neutral-900 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Hoofdbericht
                      </label>
                      <textarea
                        value={selectedTemplate.content.mainMessage}
                        onChange={(e) => setSelectedTemplate({
                          ...selectedTemplate,
                          content: { ...selectedTemplate.content, mainMessage: e.target.value }
                        })}
                        rows={5}
                        className="w-full p-3 bg-neutral-900 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Primaire Kleur
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="color"
                            value={selectedTemplate.styling.primaryColor}
                            onChange={(e) => setSelectedTemplate({
                              ...selectedTemplate,
                              styling: { ...selectedTemplate.styling, primaryColor: e.target.value }
                            })}
                            className="w-12 h-12 p-0 border-none rounded-lg cursor-pointer bg-neutral-900"
                          />
                          <input
                            type="text"
                            value={selectedTemplate.styling.primaryColor}
                            onChange={(e) => setSelectedTemplate({
                              ...selectedTemplate,
                              styling: { ...selectedTemplate.styling, primaryColor: e.target.value }
                            })}
                            className="flex-1 p-3 bg-neutral-900 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">
                          Logo URL
                        </label>
                        <input
                          type="text"
                          value={selectedTemplate.styling.logoUrl}
                          onChange={(e) => setSelectedTemplate({
                            ...selectedTemplate,
                            styling: { ...selectedTemplate.styling, logoUrl: e.target.value }
                          })}
                          className="w-full p-3 bg-neutral-900 border border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t border-neutral-700">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={() => saveTemplate(selectedTemplate)}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        💾 Wijzigingen Opslaan
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div className="space-y-4">
                    <div className="bg-neutral-900/50 p-4 rounded-lg">
                      <h4 className="font-medium text-neutral-300 mb-2">Onderwerp</h4>
                      <p className="text-neutral-400">{selectedTemplate.subject}</p>
                    </div>

                    <div className="bg-neutral-900/50 p-4 rounded-lg">
                      <h4 className="font-medium text-neutral-300 mb-2">Inhoud</h4>
                      <div className="space-y-2 text-neutral-400">
                        <p><strong>Begroeting:</strong> {selectedTemplate.content.greeting}</p>
                        <p><strong>Bericht:</strong> {selectedTemplate.content.mainMessage}</p>
                      </div>
                    </div>

                    <div className="bg-neutral-900/50 p-4 rounded-lg">
                      <h4 className="font-medium text-neutral-300 mb-2">Styling</h4>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <div 
                            className="w-6 h-6 rounded border border-neutral-600 mr-2"
                            style={{ backgroundColor: selectedTemplate.styling.primaryColor }}
                          ></div>
                          <span className="text-sm text-neutral-400">Primair: {selectedTemplate.styling.primaryColor}</span>
                        </div>
                        <div className="flex items-center">
                          <img src={selectedTemplate.styling.logoUrl} alt="logo" className="w-8 h-8 rounded-full bg-white p-1 mr-2" />
                          <span className="text-sm text-neutral-400 truncate max-w-xs">{selectedTemplate.styling.logoUrl}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-8 text-center">
              <div className="text-neutral-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-200 mb-2">Selecteer een Email Template</h3>
              <p className="text-neutral-400">Kies een template aan de linkerkant om te bewerken of bekijken</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-neutral-800 border border-neutral-700 rounded-lg p-4">
        <h4 className="font-medium text-gold-400 mb-2">💡 Beschikbare Variabelen:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-sm text-neutral-300">
          {[
            'RESERVATION_ID', 'CUSTOMER_NAME', 'COMPANY_NAME', 'EVENT_DATE', 
            'EVENT_TIME', 'ARRANGEMENT', 'PERSONS', 'TOTAL_PRICE', 'STATUS', 'NOTES'
          ].map(tag => (
            <code key={tag} className="bg-neutral-700 px-2 py-1 rounded">{`{${tag}}`}</code>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MailingConfig;