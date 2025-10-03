/**
 * ServiceSelect - Multi-select service dropdown component
 * Provides selection for contractor services with API integration
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ServiceTemplateApiService } from '@/services/contractor/rateCardApiService';

interface ServiceSelectProps {
  value: string[];
  onChange: (services: string[]) => void;
  error?: string;
  className?: string;
  disabled?: boolean;
}

export function ServiceSelect({
  value,
  onChange,
  error,
  className = '',
  disabled = false
}: ServiceSelectProps) {
  const [availableServices, setAvailableServices] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await ServiceTemplateApiService.getServiceTemplates({
        isActive: true,
        limit: 1000
      });
      
      if (response.success && response.data) {
        const services = response.data.map((template: any) => template.name);
        setAvailableServices(services);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      // Fallback to default services
      setAvailableServices([
        'Fiber Installation',
        'Fiber Maintenance', 
        'Network Construction',
        'Equipment Installation',
        'Site Survey',
        'Quality Assurance',
        'Project Management',
        'Technical Support'
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    const newValue = value.includes(service)
      ? value.filter(s => s !== service)
      : [...value, service];
    onChange(newValue);
  };

  const handleRemoveService = (service: string) => {
    onChange(value.filter(s => s !== service));
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Services*
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full text-left px-3 py-2 border rounded-md bg-white dark:bg-gray-800 
                     text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                     ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {value.length === 0 ? (
            <span className="text-gray-500">Select services...</span>
          ) : (
            <span>{value.length} service(s) selected</span>
          )}
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 
                         dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-gray-500">Loading services...</div>
            ) : (
              availableServices.map((service) => (
                <label
                  key={service}
                  className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="mr-2"
                  />
                  <span className="text-gray-900 dark:text-gray-100">{service}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected services tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {value.map((service) => (
            <span
              key={service}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 
                        text-blue-800 dark:text-blue-200 rounded-md"
            >
              {service}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveService(service)}
                  className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
      <p className="text-gray-500 text-xs mt-1">
        Select all services this contractor provides
      </p>
    </div>
  );
}