import { CrmConnector } from './crm.connector';
import { ErpConnector } from './erp.connector';
import { FinancialConnector } from './financial.connector';
import { GoogleBusinessProfileConnector } from './google-business.connector';
import { ManualUploadConnector } from './manual-upload.connector';
import { SocialConnector } from './social.connector';
import { ISourceConnector, SourceConnectorType } from './types';
import { WebsiteReaderConnector } from './website-reader.connector';

export function createConnector(type: SourceConnectorType, options: Record<string, unknown>): ISourceConnector {
  switch (type) {
    case 'website_reader':
      return new WebsiteReaderConnector(
        String(options.connectorId ?? 'website-reader'),
        {
          baseUrl: String(options.baseUrl ?? ''),
          maxPages: Number(options.maxPages ?? 20)
        }
      );
    case 'google_business_profile':
      return new GoogleBusinessProfileConnector(
        String(options.connectorId ?? 'google-business-profile'),
        {
          locationId: String(options.locationId ?? ''),
          profileName: String(options.profileName ?? 'Business Profile')
        }
      );
    case 'crm':
      return new CrmConnector(String(options.connectorId ?? 'crm-stub'));
    case 'erp':
      return new ErpConnector(String(options.connectorId ?? 'erp-stub'));
    case 'financial':
      return new FinancialConnector(String(options.connectorId ?? 'financial-stub'));
    case 'social':
      return new SocialConnector(String(options.connectorId ?? 'social-stub'));
    case 'manual_upload':
      return new ManualUploadConnector(
        String(options.connectorId ?? 'manual-upload'),
        {
          filePaths: Array.isArray(options.filePaths) ? (options.filePaths as string[]) : []
        }
      );
    default:
      throw new Error(`Unsupported connector type: ${type}`);
  }
}
