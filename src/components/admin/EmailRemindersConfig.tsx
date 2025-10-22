import React, { useState, useEffect } from 'react';
import { Mail, Eye, Send, Check } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';

export const EmailRemindersConfig: React.FC = () => {
  const {
    emailReminderConfig,
    isSubmitting,
    loadEmailReminderConfig,
    updateEmailReminderConfig
  } = useAdminStore();

  const [formData, setFormData] = useState({
    enabled: false,
    daysBefore: 3,
    subject: '',
    template: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await loadEmailReminderConfig();
      setIsLoading(false);
    };
    load();
  }, [loadEmailReminderConfig]);

  useEffect(() => {
    if (emailReminderConfig) {
      setFormData(emailReminderConfig);
    }
  }, [emailReminderConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateEmailReminderConfig(formData);
  };

  const handleSendTest = () => {
    if (!testEmail) {
      alert('Voer een geldig e-mailadres in');
      return;
    }
    alert(`Test e-mail verzonden naar ${testEmail}`);
    // Actual API call would go here
  };

  const renderPreview = () => {
    const sampleData = {
      contactPerson: 'John Doe',
      eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL'),
      eventTime: '20:00',
      numberOfPersons: '15',
      arrangement: 'BWF',
      totalPrice: '€375,00'
    };

    let preview = formData.template;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return preview;
  };

  if (isLoading) {
    return <div className="text-white">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">E-mail Herinneringen</h2>
        <p className="text-neutral-400 mt-1">
          Configureer automatische herinneringen voor reserveringen
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable/Disable */}
        <div className="bg-neutral-800/50 rounded-lg p-6 border-2 border-neutral-700">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-lg font-semibold text-white mb-1">
                Automatische Herinneringen
              </div>
              <p className="text-sm text-neutral-400">
                Verstuur automatisch e-mail herinneringen naar klanten
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold-500"></div>
            </div>
          </label>
        </div>

        {formData.enabled && (
          <>
            {/* Days Before */}
            <div className="bg-neutral-800/50 rounded-lg p-6 border-2 border-neutral-700">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Dagen Voor Event *
              </label>
              <p className="text-sm text-neutral-400 mb-4">
                Hoeveel dagen voor het event moet de herinnering verstuurd worden?
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[1, 2, 3, 7].map((days) => (
                  <label
                    key={days}
                    className={`
                      flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${
                        formData.daysBefore === days
                          ? 'border-gold-500 bg-gold-500/20'
                          : 'border-neutral-600 hover:border-neutral-500'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="daysBefore"
                      value={days}
                      checked={formData.daysBefore === days}
                      onChange={(e) => setFormData({ ...formData, daysBefore: parseInt(e.target.value) })}
                      className="sr-only"
                    />
                    <span className="text-white font-semibold">
                      {days} {days === 1 ? 'dag' : 'dagen'}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-4">
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={formData.daysBefore}
                  onChange={(e) => setFormData({ ...formData, daysBefore: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  placeholder="Aangepast aantal dagen..."
                />
              </div>
            </div>

            {/* Subject */}
            <div className="bg-neutral-800/50 rounded-lg p-6 border-2 border-neutral-700">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                E-mail Onderwerp *
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="bijv. Herinnering: Je reservering bij Inspiration Point"
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            {/* Body Template */}
            <div className="bg-neutral-800/50 rounded-lg p-6 border-2 border-neutral-700">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                E-mail Inhoud *
              </label>
              <p className="text-sm text-neutral-400 mb-4">
                Gebruik placeholders: <code className="text-gold-500 bg-neutral-900 px-1 py-0.5 rounded">{'{{contactPerson}}'}</code>,{' '}
                <code className="text-gold-500 bg-neutral-900 px-1 py-0.5 rounded">{'{{eventDate}}'}</code>,{' '}
                <code className="text-gold-500 bg-neutral-900 px-1 py-0.5 rounded">{'{{eventTime}}'}</code>,{' '}
                <code className="text-gold-500 bg-neutral-900 px-1 py-0.5 rounded">{'{{numberOfPersons}}'}</code>,{' '}
                <code className="text-gold-500 bg-neutral-900 px-1 py-0.5 rounded">{'{{arrangement}}'}</code>,{' '}
                <code className="text-gold-500 bg-neutral-900 px-1 py-0.5 rounded">{'{{totalPrice}}'}</code>
              </p>
              <textarea
                required
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                rows={12}
                placeholder={`Beste {{contactPerson}},

Dit is een herinnering voor je reservering bij Inspiration Point.

Event Details:
- Datum: {{eventDate}} om {{eventTime}}
- Aantal personen: {{numberOfPersons}}
- Arrangement: {{arrangement}}
- Totaal: {{totalPrice}}

We kijken ernaar uit je te verwelkomen!

Met vriendelijke groet,
Team Inspiration Point`}
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Verberg Preview' : 'Toon Preview'}
              </button>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-neutral-800 rounded-lg p-6 border-2 border-blue-500">
                <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
                <div className="bg-white rounded-lg p-6">
                  <div className="text-gray-900 whitespace-pre-wrap">
                    {renderPreview()}
                  </div>
                </div>
              </div>
            )}

            {/* Test Email */}
            <div className="bg-neutral-800/50 rounded-lg p-6 border-2 border-neutral-700">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Test E-mail Versturen
              </label>
              <p className="text-sm text-neutral-400 mb-4">
                Verstuur een test e-mail om te zien hoe de herinnering eruit ziet
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  className="flex-1 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleSendTest}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Verstuur Test
                </button>
              </div>
            </div>
          </>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2 disabled:opacity-50 text-lg font-semibold"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Opslaan...
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Configuratie Opslaan
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-6">
        <div className="flex gap-3">
          <Mail className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Hoe werkt het?</h3>
            <ul className="text-neutral-300 space-y-1 text-sm">
              <li>• Herinneringen worden automatisch verstuurd op basis van je configuratie</li>
              <li>• Alleen bevestigde reserveringen ontvangen herinneringen</li>
              <li>• De herinnering wordt 1x verstuurd op het ingestelde aantal dagen voor het event</li>
              <li>• E-mails worden verzonden naar het opgegeven e-mailadres van de klant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
