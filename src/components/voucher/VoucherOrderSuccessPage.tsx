/**
 * VoucherOrderSuccessPage - Bedankt pagina na bestelling
 * 
 * Legt aan de klant uit dat hun bestelling in behandeling is.
 * Ze ontvangen een e-mail zodra de admin goedkeurt.
 */


import { CheckCircle, Mail, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const VoucherOrderSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8 md:p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Bestelling Ontvangen!
          </h1>

          {/* Message */}
          <p className="text-slate-300 text-lg mb-8">
            Bedankt voor je bestelling. We hebben je aanvraag voor de theaterbon(nen) ontvangen.
          </p>

          {/* Process Steps */}
          <div className="space-y-6 text-left bg-slate-950/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4 text-center">
              Wat gebeurt er nu?
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gold-400/20 rounded-full flex items-center justify-center text-gold-400 font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Bestelling Controleren</h3>
                  <p className="text-slate-400 text-sm">
                    We controleren je bestelling en genereren een unieke vouchercode.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gold-400/20 rounded-full flex items-center justify-center text-gold-400 font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Betaalinstructies Ontvangen
                  </h3>
                  <p className="text-slate-400 text-sm">
                    Je ontvangt een e-mail met betaalinstructies en je unieke vouchercode.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gold-400/20 rounded-full flex items-center justify-center text-gold-400 font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">Theaterbon Activeren</h3>
                  <p className="text-slate-400 text-sm">
                    Zodra we je betaling hebben ontvangen, wordt je theaterbon actief en klaar voor gebruik!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Timeline */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Verwachte verwerkingstijd</span>
            </div>
            <p className="text-slate-300 text-sm">
              Binnen 1-2 werkdagen ontvang je een e-mail met verdere instructies.
            </p>
          </div>

          {/* Email Confirmation */}
          <div className="bg-slate-800/50 rounded-xl p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-slate-300 mb-2">
              <Mail className="w-5 h-5 text-gold-400" />
              <span className="font-medium">Check je inbox</span>
            </div>
            <p className="text-slate-400 text-sm">
              We hebben een bevestigingsmail gestuurd naar het opgegeven e-mailadres.
              <br />
              <span className="text-slate-500 text-xs">(Controleer ook je spam/ongewenste mail)</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Terug naar Home
            </button>
            <button
              onClick={() => navigate('/vouchers')}
              className="px-8 py-3 bg-gold-400 hover:bg-gold-500 text-slate-900 rounded-xl font-medium transition-colors"
            >
              Nog een Bestellen
            </button>
          </div>

          {/* Support */}
          <div className="mt-8 pt-8 border-t border-slate-800">
            <p className="text-slate-400 text-sm">
              Vragen over je bestelling?
              <br />
              <a href="mailto:info@inspirationpoint.nl" className="text-gold-400 hover:text-gold-300 transition-colors">
                Neem contact met ons op
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
