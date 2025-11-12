import { useState } from 'react';
import { Mail, AlertTriangle, Check, X, Power, PowerOff } from 'lucide-react';
import { useConfigStore } from '../../../store/configStore';
import type { EmailSettings } from '../../../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Email Toggle Settings Component
 * Allows admin to enable/disable emails globally or per type
 */
export function EmailToggleSettings() {
  const { config, updateEmailSettings } = useConfigStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showDisableWarning, setShowDisableWarning] = useState(false);
  
  // Current email settings (default to all enabled)
  const currentSettings: EmailSettings = config?.emailSettings || {
    enabled: true,
    enabledTypes: {
      confirmation: true,
      statusUpdate: true,
      reminder: true,
      waitlist: true,
      admin: true
    }
  };
  
  const [localSettings, setLocalSettings] = useState<EmailSettings>(currentSettings);
  const [isSaving, setIsSaving] = useState(false);
  
  // Check if emails have been disabled for a long time
  const isDisabledTooLong = React.useMemo(() => {
    if (!currentSettings.enabled && currentSettings.lastDisabledAt) {
      const hoursSinceDisabled = (Date.now() - currentSettings.lastDisabledAt.getTime()) / (1000 * 60 * 60);
      return hoursSinceDisabled > 2; // Warning after 2 hours
    }
    return false;
  }, [currentSettings.enabled, currentSettings.lastDisabledAt]);
  
  const handleToggleGlobal = () => {
    const newValue = !localSettings.enabled;
    
    if (newValue === false) {
      // Trying to disable - show warning
      setShowDisableWarning(true);
    } else {
      // Re-enabling - just do it
      setLocalSettings(prev => ({ ...prev, enabled: true }));
      setIsEditing(true);
    }
  };
  
  const confirmDisable = () => {
    setLocalSettings(prev => ({ ...prev, enabled: false }));
    setIsEditing(true);
    setShowDisableWarning(false);
  };
  
  const handleToggleType = (type: keyof typeof localSettings.enabledTypes) => {
    setLocalSettings(prev => ({
      ...prev,
      enabledTypes: {
        ...prev.enabledTypes,
        [type]: !prev.enabledTypes[type]
      }
    }));
    setIsEditing(true);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Get admin username from auth context
      const adminUsername = 'Admin'; // Placeholder
      
      const success = await updateEmailSettings(localSettings, adminUsername);
      
      if (success) {
        setIsEditing(false);
        alert('✅ Email instellingen opgeslagen!');
      } else {
        alert('❌ Fout bij opslaan. Probeer opnieuw.');
      }
    } catch (error) {
      console.error('Error saving email settings:', error);
      alert('❌ Fout bij opslaan. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancel = () => {
    setLocalSettings(currentSettings);
    setIsEditing(false);
    setShowDisableWarning(false);
  };
  
  return (
    <div className="space-y-6">
      {/* Warning Banner - Emails Disabled */}
      {!currentSettings.enabled && (
        <div className={`p-4 rounded-lg border-2 ${isDisabledTooLong ? 'bg-red-50 border-red-300' : 'bg-yellow-50 border-yellow-300'}`}>
          <div className="flex items-start space-x-3">
            <AlertTriangle className={`w-6 h-6 ${isDisabledTooLong ? 'text-red-600' : 'text-yellow-600'} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h3 className={`font-semibold ${isDisabledTooLong ? 'text-red-900' : 'text-yellow-900'}`}>
                {isDisabledTooLong ? '🚨 LET OP: Emails zijn al lang uitgeschakeld!' : '⚠️ LET OP: Emails zijn uitgeschakeld'}
              </h3>
              <p className={`text-sm mt-1 ${isDisabledTooLong ? 'text-red-800' : 'text-yellow-800'}`}>
                Klanten ontvangen geen bevestigingen of updates!
              </p>
              {currentSettings.lastDisabledAt && (
                <p className="text-sm mt-2 font-medium">
                  Uitgeschakeld sinds: {format(currentSettings.lastDisabledAt, 'dd MMMM yyyy \'om\' HH:mm', { locale: nl })}
                  {currentSettings.disabledBy && ` door ${currentSettings.disabledBy}`}
                </p>
              )}
              {isDisabledTooLong && (
                <p className="text-sm mt-2 font-bold text-red-900">
                  Meer dan 2 uur geleden! Vergeet je niet om emails weer in te schakelen?
                </p>
              )}
              <button
                onClick={() => {
                  setLocalSettings(prev => ({ ...prev, enabled: true }));
                  setIsEditing(true);
                }}
                className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Email nu inschakelen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Email Toggle */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${localSettings.enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
              {localSettings.enabled ? (
                <Power className="w-6 h-6 text-green-600" />
              ) : (
                <PowerOff className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Global Email Status
              </h3>
              <p className="text-sm text-gray-600">
                {localSettings.enabled 
                  ? 'Alle emails zijn ingeschakeld (subject to type toggles below)'
                  : 'ALLE emails zijn uitgeschakeld - niemand ontvangt emails!'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleToggleGlobal}
            className={`relative inline-flex items-center h-10 w-20 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
              localSettings.enabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform ${
                localSettings.enabled ? 'translate-x-11' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* Email Type Toggles */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Mail className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Email Type Instellingen
          </h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-6">
          Schakel individuele email types in of uit. Deze werken alleen als de global toggle hierboven is ingeschakeld.
        </p>
        
        <div className="space-y-4">
          {/* Confirmation Emails */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Bevestigingsmails</h4>
              <p className="text-sm text-gray-600">
                Automatische bevestiging na nieuwe boeking
              </p>
            </div>
            <button
              onClick={() => handleToggleType('confirmation')}
              disabled={!localSettings.enabled}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                localSettings.enabledTypes.confirmation && localSettings.enabled
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              } ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  localSettings.enabledTypes.confirmation ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Status Update Emails */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Status Updates</h4>
              <p className="text-sm text-gray-600">
                Email bij goedkeuring/afwijzing/annulering
              </p>
            </div>
            <button
              onClick={() => handleToggleType('statusUpdate')}
              disabled={!localSettings.enabled}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                localSettings.enabledTypes.statusUpdate && localSettings.enabled
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              } ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  localSettings.enabledTypes.statusUpdate ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Reminder Emails */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Herinneringen</h4>
              <p className="text-sm text-gray-600">
                Email reminder voor aankomende evenementen
              </p>
            </div>
            <button
              onClick={() => handleToggleType('reminder')}
              disabled={!localSettings.enabled}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                localSettings.enabledTypes.reminder && localSettings.enabled
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              } ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  localSettings.enabledTypes.reminder ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Waitlist Emails */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Wachtlijst Notificaties</h4>
              <p className="text-sm text-gray-600">
                Bevestiging en beschikbaarheid emails
              </p>
            </div>
            <button
              onClick={() => handleToggleType('waitlist')}
              disabled={!localSettings.enabled}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                localSettings.enabledTypes.waitlist && localSettings.enabled
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              } ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  localSettings.enabledTypes.waitlist ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          
          {/* Admin Notification Emails */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">Admin Notificaties</h4>
              <p className="text-sm text-gray-600">
                Email naar admin bij nieuwe boekingen
              </p>
            </div>
            <button
              onClick={() => handleToggleType('admin')}
              disabled={!localSettings.enabled}
              className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                localSettings.enabledTypes.admin && localSettings.enabled
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              } ${!localSettings.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
                  localSettings.enabledTypes.admin ? 'translate-x-9' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
      
      {/* Save/Cancel Buttons */}
      {isEditing && (
        <div className="flex items-center justify-end space-x-4">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <X className="w-4 h-4" />
            <span>Annuleren</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Opslaan...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Opslaan</span>
              </>
            )}
          </button>
        </div>
      )}
      
      {/* Disable Warning Modal */}
      {showDisableWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Weet je dit zeker?
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Als je emails uitschakelt, ontvangen klanten:
                </p>
                <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Geen bevestigingsmails</li>
                  <li>Geen status updates</li>
                  <li>Geen herinneringen</li>
                  <li>Geen wachtlijst notificaties</li>
                </ul>
                <p className="text-sm text-red-600 mt-3 font-semibold">
                  Dit is alleen bedoeld voor tijdelijk onderhoud of migraties!
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDisableWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={confirmDisable}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Ja, schakel emails uit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
