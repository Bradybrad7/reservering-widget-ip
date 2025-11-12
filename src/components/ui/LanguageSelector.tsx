
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { changeLanguage } from '../../i18n';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' }
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors">
        <Globe className="w-4 h-4 text-neutral-400" />
        <span className="text-sm text-white">
          {languages.find(l => l.code === i18n.language)?.flag || '🌐'}
        </span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {languages.map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code as 'nl' | 'en' | 'de')}
            className={`
              w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-neutral-700 transition-colors
              ${i18n.language === lang.code ? 'bg-neutral-700 text-gold-400' : 'text-white'}
              first:rounded-t-lg last:rounded-b-lg
            `}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
