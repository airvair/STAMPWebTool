/**
 * API Documentation Component
 * Displays interactive API documentation
 */

import React, { useState } from 'react';
import {
  DocumentTextIcon,
  CodeBracketIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Card from '../shared/Card';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: any;
  responses: {
    [code: string]: {
      description: string;
      example?: any;
    };
  };
}

interface APISection {
  title: string;
  description: string;
  endpoints: APIEndpoint[];
}

const APIDocumentation: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['Getting Started']);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const apiSections: APISection[] = [
    {
      title: 'Getting Started',
      description: 'Basic setup and authentication',
      endpoints: [
        {
          method: 'GET',
          path: '/api/health',
          description: 'Check API health status',
          responses: {
            '200': {
              description: 'API is healthy',
              example: {
                status: 'healthy',
                version: '1.0.0',
                uptime: 3600
              }
            }
          }
        }
      ]
    },
    {
      title: 'Losses',
      description: 'Manage system losses',
      endpoints: [
        {
          method: 'GET',
          path: '/api/losses',
          description: 'Get paginated list of losses',
          parameters: [
            { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
            { name: 'pageSize', type: 'number', required: false, description: 'Items per page (default: 20)' },
            { name: 'sortBy', type: 'string', required: false, description: 'Sort field' },
            { name: 'sortOrder', type: 'string', required: false, description: 'Sort order (asc/desc)' }
          ],
          responses: {
            '200': {
              description: 'Success',
              example: {
                items: [
                  { id: '1', code: 'L-1', title: 'Loss of life', description: '...' }
                ],
                total: 10,
                page: 1,
                pageSize: 20,
                hasMore: false
              }
            }
          }
        },
        {
          method: 'POST',
          path: '/api/losses',
          description: 'Create a new loss',
          requestBody: {
            code: 'L-1',
            title: 'Loss of life',
            description: 'Description of the loss'
          },
          responses: {
            '201': {
              description: 'Created successfully',
              example: { id: '123', code: 'L-1', title: 'Loss of life' }
            }
          }
        }
      ]
    },
    {
      title: 'Hazards',
      description: 'Manage system hazards',
      endpoints: [
        {
          method: 'GET',
          path: '/api/hazards',
          description: 'Get paginated list of hazards',
          responses: {
            '200': { description: 'Success' }
          }
        },
        {
          method: 'POST',
          path: '/api/hazards',
          description: 'Create a new hazard',
          requestBody: {
            code: 'H-1',
            title: 'System malfunction',
            systemCondition: 'System fails to respond',
            environmentalCondition: 'Under normal operation',
            lossIds: ['loss-1', 'loss-2']
          },
          responses: {
            '201': { description: 'Created successfully' }
          }
        }
      ]
    },
    {
      title: 'Unsafe Control Actions',
      description: 'Manage UCAs',
      endpoints: [
        {
          method: 'GET',
          path: '/api/ucas',
          description: 'Get paginated list of UCAs',
          responses: {
            '200': { description: 'Success' }
          }
        },
        {
          method: 'POST',
          path: '/api/ucas',
          description: 'Create a new UCA',
          requestBody: {
            controllerId: 'controller-1',
            controlActionId: 'action-1',
            ucaType: 'Not Providing',
            context: 'When system is in critical state',
            description: 'Controller does not provide necessary action',
            hazardIds: ['hazard-1']
          },
          responses: {
            '201': { description: 'Created successfully' }
          }
        }
      ]
    },
    {
      title: 'Batch Operations',
      description: 'Perform bulk operations',
      endpoints: [
        {
          method: 'POST',
          path: '/api/batch/{entityType}',
          description: 'Batch create entities',
          requestBody: {
            operation: 'create',
            items: [
              { code: 'L-1', title: 'Loss 1' },
              { code: 'L-2', title: 'Loss 2' }
            ]
          },
          responses: {
            '200': {
              description: 'Batch operation completed',
              example: {
                succeeded: [{ id: '1', code: 'L-1' }],
                failed: [{ item: { code: 'L-2' }, error: 'Duplicate code' }],
                totalProcessed: 2
              }
            }
          }
        }
      ]
    },
    {
      title: 'Search & Filtering',
      description: 'Search across entities',
      endpoints: [
        {
          method: 'GET',
          path: '/api/search',
          description: 'Search across all entity types',
          parameters: [
            { name: 'q', type: 'string', required: true, description: 'Search query' },
            { name: 'types', type: 'string[]', required: false, description: 'Entity types to search' },
            { name: 'limit', type: 'number', required: false, description: 'Maximum results' }
          ],
          responses: {
            '200': {
              description: 'Search results',
              example: {
                results: [
                  { entityType: 'loss', entity: { id: '1', title: 'Loss 1' }, score: 0.95 }
                ],
                total: 1
              }
            }
          }
        }
      ]
    },
    {
      title: 'Webhooks',
      description: 'Configure webhooks for real-time updates',
      endpoints: [
        {
          method: 'POST',
          path: '/api/webhooks',
          description: 'Create a webhook',
          requestBody: {
            url: 'https://example.com/webhook',
            events: ['loss.created', 'hazard.updated'],
            active: true
          },
          responses: {
            '201': {
              description: 'Webhook created',
              example: { id: 'webhook-1', secret: 'whsec_...' }
            }
          }
        }
      ]
    }
  ];

  const toggleSection = (title: string) => {
    setExpandedSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const copyToClipboard = (code: string, identifier: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(identifier);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'POST':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'PUT':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'DELETE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  const baseURL = 'https://api.example.com';

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6" />
          STPA Analysis API Documentation
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          The STPA Analysis API provides programmatic access to create, read, update, and delete
          STPA analysis data. All API requests must include an Authorization header with your API key.
        </p>
        
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">Authentication</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            Include your API key in the Authorization header:
          </p>
          <div className="relative">
            <SyntaxHighlighter
              language="bash"
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            >
              {`Authorization: Bearer YOUR_API_KEY`}
            </SyntaxHighlighter>
            <button
              onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY', 'auth')}
              className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
            >
              {copiedCode === 'auth' ? (
                <CheckIcon className="w-4 h-4 text-green-400" />
              ) : (
                <ClipboardDocumentIcon className="w-4 h-4 text-slate-300" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="font-semibold mb-2 text-blue-800 dark:text-blue-200">Base URL</h3>
          <code className="text-sm bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
            {baseURL}
          </code>
        </div>
      </Card>

      {/* API Sections */}
      {apiSections.map((section) => (
        <Card key={section.title} className="overflow-hidden">
          <button
            onClick={() => toggleSection(section.title)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedSections.includes(section.title) ? (
                <ChevronDownIcon className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-slate-400" />
              )}
              <div className="text-left">
                <h3 className="font-semibold">{section.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {section.description}
                </p>
              </div>
            </div>
            <span className="text-sm text-slate-500">
              {section.endpoints.length} endpoints
            </span>
          </button>

          {expandedSections.includes(section.title) && (
            <div className="border-t border-slate-200 dark:border-slate-700">
              {section.endpoints.map((endpoint, idx) => (
                <div
                  key={`${endpoint.method}-${endpoint.path}`}
                  className={`p-6 ${idx > 0 ? 'border-t border-slate-200 dark:border-slate-700' : ''}`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded flex-1">
                      {endpoint.path}
                    </code>
                  </div>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    {endpoint.description}
                  </p>

                  {/* Parameters */}
                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Parameters</h4>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param) => (
                          <div key={param.name} className="flex items-start gap-2 text-sm">
                            <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {param.name}
                            </code>
                            <span className="text-slate-500">{param.type}</span>
                            {param.required && (
                              <span className="text-red-600 dark:text-red-400 text-xs">required</span>
                            )}
                            <span className="text-slate-600 dark:text-slate-400">
                              - {param.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Request Body */}
                  {endpoint.requestBody && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Request Body</h4>
                      <div className="relative">
                        <SyntaxHighlighter
                          language="json"
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem'
                          }}
                        >
                          {JSON.stringify(endpoint.requestBody, null, 2)}
                        </SyntaxHighlighter>
                        <button
                          onClick={() => copyToClipboard(
                            JSON.stringify(endpoint.requestBody, null, 2),
                            `${endpoint.method}-${endpoint.path}-req`
                          )}
                          className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                        >
                          {copiedCode === `${endpoint.method}-${endpoint.path}-req` ? (
                            <CheckIcon className="w-4 h-4 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Responses */}
                  <div>
                    <h4 className="font-medium text-sm mb-2">Responses</h4>
                    <div className="space-y-2">
                      {Object.entries(endpoint.responses).map(([code, response]) => (
                        <div key={code}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${
                              code.startsWith('2') ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {code}
                            </span>
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {response.description}
                            </span>
                          </div>
                          {response.example && (
                            <div className="relative">
                              <SyntaxHighlighter
                                language="json"
                                style={vscDarkPlus}
                                customStyle={{
                                  margin: 0,
                                  borderRadius: '0.375rem',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {JSON.stringify(response.example, null, 2)}
                              </SyntaxHighlighter>
                              <button
                                onClick={() => copyToClipboard(
                                  JSON.stringify(response.example, null, 2),
                                  `${endpoint.method}-${endpoint.path}-${code}`
                                )}
                                className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                              >
                                {copiedCode === `${endpoint.method}-${endpoint.path}-${code}` ? (
                                  <CheckIcon className="w-4 h-4 text-green-400" />
                                ) : (
                                  <ClipboardDocumentIcon className="w-4 h-4 text-slate-300" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example Request */}
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="font-medium text-sm mb-2">Example Request</h4>
                    <div className="relative">
                      <SyntaxHighlighter
                        language="bash"
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem'
                        }}
                      >
                        {`curl -X ${endpoint.method} ${baseURL}${endpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\
  -d '${JSON.stringify(endpoint.requestBody)}'` : ''}`}
                      </SyntaxHighlighter>
                      <button
                        onClick={() => copyToClipboard(
                          `curl -X ${endpoint.method} ${baseURL}${endpoint.path} \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json"${endpoint.requestBody ? ` \\\n  -d '${JSON.stringify(endpoint.requestBody)}'` : ''}`,
                          `${endpoint.method}-${endpoint.path}-curl`
                        )}
                        className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                      >
                        {copiedCode === `${endpoint.method}-${endpoint.path}-curl` ? (
                          <CheckIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <ClipboardDocumentIcon className="w-4 h-4 text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}

      {/* SDKs */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CodeBracketIcon className="w-5 h-5" />
          Client Libraries
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Use our official client libraries to integrate with the API:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h4 className="font-medium mb-2">JavaScript/TypeScript</h4>
            <code className="text-sm text-blue-600 dark:text-blue-400">
              npm install @stpa/api-client
            </code>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h4 className="font-medium mb-2">Python</h4>
            <code className="text-sm text-blue-600 dark:text-blue-400">
              pip install stpa-api
            </code>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <h4 className="font-medium mb-2">Java</h4>
            <code className="text-sm text-blue-600 dark:text-blue-400">
              com.stpa:api-client:1.0.0
            </code>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default APIDocumentation;