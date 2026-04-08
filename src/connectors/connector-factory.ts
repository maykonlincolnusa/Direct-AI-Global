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
          accountName: typeof options.accountName === 'string' ? options.accountName : undefined,
          locationId: String(options.locationId ?? ''),
          locationName: typeof options.locationName === 'string' ? options.locationName : undefined,
          profileName: String(options.profileName ?? 'Business Profile'),
          accessToken: typeof options.accessToken === 'string' ? options.accessToken : undefined,
          baseUrl: typeof options.baseUrl === 'string' ? options.baseUrl : undefined,
          limit: Number(options.limit ?? 20)
        }
      );
    case 'crm':
      return new CrmConnector(String(options.connectorId ?? 'crm-hubspot'), {
        provider: 'hubspot',
        accessToken: typeof options.accessToken === 'string' ? options.accessToken : undefined,
        baseUrl: typeof options.baseUrl === 'string' ? options.baseUrl : undefined,
        limit: Number(options.limit ?? 50)
      });
    case 'erp':
      return new ErpConnector(String(options.connectorId ?? 'erp-rest'), {
        provider: 'generic_rest',
        baseUrl: typeof options.baseUrl === 'string' ? options.baseUrl : undefined,
        accessToken: typeof options.accessToken === 'string' ? options.accessToken : undefined,
        limit: Number(options.limit ?? 50)
      });
    case 'financial':
      return new FinancialConnector(String(options.connectorId ?? 'financial-stripe'), {
        provider: 'stripe',
        secretKey: typeof options.secretKey === 'string' ? options.secretKey : undefined,
        baseUrl: typeof options.baseUrl === 'string' ? options.baseUrl : undefined,
        limit: Number(options.limit ?? 50)
      });
    case 'social':
      return new SocialConnector(String(options.connectorId ?? 'social-rss'), {
        provider: 'rss',
        feedUrl: String(options.feedUrl ?? ''),
        network: typeof options.network === 'string' ? options.network : undefined,
        limit: Number(options.limit ?? 20)
      });
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
