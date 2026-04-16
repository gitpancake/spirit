export const openApiSpec = {
  "openapi": "3.0.0",
  "info": {
    "title": "SpiritRegistry API",
    "version": "1.0.0",
    "description": "A comprehensive API for managing SpiritRegistry NFTs",
    "contact": {
      "name": "API Support",
      "url": "https://github.com/your-org/spirit-registry"
    }
  },
  "servers": [
    {
      "url": "https://registry-gnclmdqzg-henry-personal.vercel.app",
      "description": "Production server"
    },
    {
      "url": "http://localhost:3000",
      "description": "Development server"
    }
  ],
  "paths": {
    "/api/registry/agents": {
      "get": {
        "summary": "Get All Agents",
        "description": "Retrieve a list of all registered agents from the SpiritRegistry contract",
        "tags": ["Registry"],
        "responses": {
          "200": {
            "description": "List of agents retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AgentsResponse"
                }
              }
            }
          },
          "500": {
            "$ref": "#/components/responses/ServerError"
          }
        }
      }
    },
    "/api/registry/agent/{id}": {
      "get": {
        "summary": "Get Agent by ID",
        "description": "Retrieve details for a specific agent by its agent ID",
        "tags": ["Registry"],
        "parameters": [
          {
            "name": "id",
            "in": "path",
            "required": true,
            "description": "The unique agent identifier",
            "schema": {
              "type": "string"
            }
          }
        ],
        "responses": {
          "200": {
            "description": "Agent details retrieved successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/AgentResponse"
                }
              }
            }
          },
          "404": {
            "$ref": "#/components/responses/NotFound"
          }
        }
      }
    },
    "/api/registry/mint": {
      "post": {
        "summary": "Mint Agent NFT",
        "description": "Mint a new agent NFT with a unique agent ID (Treasury only)",
        "tags": ["Registry"],
        "security": [{"MessageSignature": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/MintRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Agent minted successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/MintResponse"
                }
              }
            }
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "403": {
            "$ref": "#/components/responses/Forbidden"
          }
        }
      }
    },
    "/api/registry/burn": {
      "post": {
        "summary": "Burn Agent NFT",
        "description": "Burn an existing agent NFT (Treasury only)",
        "tags": ["Registry"],
        "security": [{"MessageSignature": []}],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/BurnRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Agent burned successfully",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/BurnResponse"
                }
              }
            }
          },
          "401": {
            "$ref": "#/components/responses/Unauthorized"
          },
          "403": {
            "$ref": "#/components/responses/Forbidden"
          }
        }
      }
    },
    "/api/auth/verify": {
      "post": {
        "summary": "Verify Signature",
        "description": "Verify a signed message (utility endpoint)",
        "tags": ["Authentication"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/VerifyRequest"
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Signature verification result",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/VerifyResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "securitySchemes": {
      "MessageSignature": {
        "type": "apiKey",
        "in": "header",
        "name": "X-Signature",
        "description": "Message signature for authentication. Sign the message with your wallet and include both signature and message in request body."
      }
    },
    "schemas": {
      "Agent": {
        "type": "object",
        "properties": {
          "tokenId": {
            "type": "string",
            "description": "The NFT token ID"
          },
          "agentId": {
            "type": "string",
            "description": "Unique agent identifier"
          },
          "owner": {
            "type": "string",
            "description": "Owner's Ethereum address"
          },
          "metadataURI": {
            "type": "string",
            "description": "URI to agent metadata"
          }
        }
      },
      "MintRequest": {
        "type": "object",
        "required": ["to", "agentId", "metadataURI", "signature", "message", "signer"],
        "properties": {
          "to": {
            "type": "string",
            "description": "Recipient address",
            "pattern": "^0x[a-fA-F0-9]{40}$"
          },
          "agentId": {
            "type": "string",
            "description": "Unique agent identifier"
          },
          "metadataURI": {
            "type": "string",
            "format": "uri",
            "description": "Metadata URI"
          },
          "signature": {
            "type": "string",
            "description": "Message signature"
          },
          "message": {
            "type": "string",
            "description": "Signed message with timestamp"
          },
          "signer": {
            "type": "string",
            "pattern": "^0x[a-fA-F0-9]{40}$",
            "description": "Signer address (must be treasury)"
          }
        }
      },
      "ApiResponse": {
        "type": "object",
        "properties": {
          "success": {
            "type": "boolean"
          },
          "data": {
            "type": "object"
          },
          "error": {
            "type": "string"
          },
          "transactionHash": {
            "type": "string"
          }
        }
      },
      "AgentsResponse": {
        "allOf": [
          {"$ref": "#/components/schemas/ApiResponse"},
          {
            "type": "object",
            "properties": {
              "data": {
                "type": "array",
                "items": {
                  "$ref": "#/components/schemas/Agent"
                }
              }
            }
          }
        ]
      },
      "AgentResponse": {
        "allOf": [
          {"$ref": "#/components/schemas/ApiResponse"},
          {
            "type": "object",
            "properties": {
              "data": {
                "$ref": "#/components/schemas/Agent"
              }
            }
          }
        ]
      },
      "MintResponse": {
        "allOf": [
          {"$ref": "#/components/schemas/ApiResponse"},
          {
            "type": "object",
            "properties": {
              "data": {
                "type": "object",
                "properties": {
                  "tokenId": {"type": "string"},
                  "agentId": {"type": "string"},
                  "to": {"type": "string"},
                  "metadataURI": {"type": "string"}
                }
              }
            }
          }
        ]
      },
      "BurnRequest": {
        "type": "object",
        "required": ["tokenId", "signature", "message", "signer"],
        "properties": {
          "tokenId": {
            "type": "string",
            "pattern": "^\\d+$",
            "description": "Token ID to burn"
          },
          "signature": {
            "type": "string",
            "description": "Message signature"
          },
          "message": {
            "type": "string",
            "description": "Signed message with timestamp"
          },
          "signer": {
            "type": "string",
            "pattern": "^0x[a-fA-F0-9]{40}$",
            "description": "Signer address (must be treasury)"
          }
        }
      },
      "BurnResponse": {
        "allOf": [
          {"$ref": "#/components/schemas/ApiResponse"},
          {
            "type": "object",
            "properties": {
              "data": {
                "type": "object",
                "properties": {
                  "tokenId": {"type": "string"},
                  "agentId": {"type": "string"},
                  "burned": {"type": "boolean"}
                }
              }
            }
          }
        ]
      },
      "VerifyRequest": {
        "type": "object",
        "required": ["message", "signature", "signer"],
        "properties": {
          "message": {
            "type": "string",
            "description": "Original message that was signed"
          },
          "signature": {
            "type": "string",
            "description": "Message signature"
          },
          "signer": {
            "type": "string",
            "pattern": "^0x[a-fA-F0-9]{40}$",
            "description": "Expected signer address"
          }
        }
      },
      "VerifyResponse": {
        "allOf": [
          {"$ref": "#/components/schemas/ApiResponse"},
          {
            "type": "object",
            "properties": {
              "data": {
                "type": "object",
                "properties": {
                  "signatureValid": {"type": "boolean"},
                  "timestampValid": {"type": "boolean"},
                  "message": {"type": "string"},
                  "signer": {"type": "string"},
                  "verified": {"type": "boolean"}
                }
              }
            }
          }
        ]
      }
    },
    "responses": {
      "BadRequest": {
        "description": "Bad request",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ApiResponse"
            }
          }
        }
      },
      "Unauthorized": {
        "description": "Invalid signature",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ApiResponse"
            }
          }
        }
      },
      "Forbidden": {
        "description": "Insufficient permissions",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ApiResponse"
            }
          }
        }
      },
      "NotFound": {
        "description": "Resource not found",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ApiResponse"
            }
          }
        }
      },
      "ServerError": {
        "description": "Internal server error",
        "content": {
          "application/json": {
            "schema": {
              "$ref": "#/components/schemas/ApiResponse"
            }
          }
        }
      }
    }
  },
  "tags": [
    {
      "name": "Registry",
      "description": "SpiritRegistry NFT management operations"
    },
    {
      "name": "Authentication",
      "description": "Authentication and signature verification"
    }
  ]
};